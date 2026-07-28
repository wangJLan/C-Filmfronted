/**
 * 定位状态管理 — Zustand + 手动 localStorage
 *
 * 流程：
 *   1. 首次打开 → showGate = true → 展示授权弹窗
 *   2. 用户点击"同意" → 调用浏览器定位 API → 保存城市 → showGate = false
 *   3. 用户点击"拒绝"或定位失败 → 使用默认城市 → showGate = false
 *   4. 后续打开 → permissionGranted 已持久化 → 直接跳过授权
 */
import { create } from 'zustand';

const STORAGE_KEY = 'location-store';
const DEFAULT_CITY = '北京市';

interface PersistedData {
  city: string;
  permissionGranted: boolean;
}

function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { city: DEFAULT_CITY, permissionGranted: false };
}

function savePersisted(data: PersistedData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

const persisted = loadPersisted();

export interface LocationState {
  city: string;
  permissionGranted: boolean;
  showGate: boolean;
  loading: boolean;

  grant: () => Promise<void>;
  deny: () => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  city: persisted.city,
  permissionGranted: persisted.permissionGranted,
  showGate: !persisted.permissionGranted,
  loading: false,

  grant: async () => {
    set({ loading: true });

    let city = DEFAULT_CITY;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('浏览器不支持定位'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 10 * 60 * 1000,
        });
      });

      city = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );
    } catch {
      // 定位失败，使用默认城市
    }

    savePersisted({ city, permissionGranted: true });
    set({ city, permissionGranted: true, showGate: false, loading: false });
  },

  deny: () => {
    savePersisted({ city: DEFAULT_CITY, permissionGranted: true });
    set({ city: DEFAULT_CITY, permissionGranted: true, showGate: false, loading: false });
  },
}));

// ================= 简易反向地理编码 =================

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // 直接使用本地经纬度→城市映射（避免外部 API 依赖）
  return cityFromCoords(lat, lng);
}

function cityFromCoords(lat: number, lng: number): string {
  const cities: [string, number, number, number, number][] = [
    ['北京市', 39.4, 40.2, 115.4, 117.5],
    ['上海市', 30.7, 31.5, 120.8, 122.2],
    ['广州市', 22.6, 23.6, 112.8, 114.0],
    ['深圳市', 22.4, 22.9, 113.7, 114.6],
    ['杭州市', 29.8, 30.6, 119.7, 120.9],
    ['成都市', 30.1, 31.0, 103.6, 104.7],
    ['武汉市', 30.1, 31.0, 113.7, 115.1],
    ['南京市', 31.5, 32.5, 118.4, 119.4],
    ['重庆市', 29.1, 30.2, 105.7, 107.1],
    ['西安市', 33.9, 34.8, 108.4, 109.5],
    ['长沙市', 27.9, 28.7, 112.5, 113.5],
    ['天津市', 38.6, 39.6, 116.6, 118.0],
  ];

  for (const [c, latMin, latMax, lngMin, lngMax] of cities) {
    if (lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax) {
      return c;
    }
  }

  return DEFAULT_CITY;
}
