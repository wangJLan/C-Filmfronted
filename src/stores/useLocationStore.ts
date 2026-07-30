/**
 * 定位状态管理 — 真实 GPS 定位 + 高德逆地理编码
 *
 * 流程:
 *   1. 尝试 GPS 定位 → 拿到经纬度 → 调高德 API 逆地理 → 城市名
 *   2. GPS 失败/拒绝 → 读 localStorage 缓存
 *   3. 缓存为空 → 默认"北京"，提示手动选城
 *
 * 高德 Web服务 Key: 74bfb724d417db45d5a9ffe7215eb4b1
 */
import { create } from 'zustand';

const AMAP_KEY = '74bfb724d417db45d5a9ffe7215eb4b1';
const STORAGE_CITY = 'app_city';
const STORAGE_COORDS = 'app_coords';

export interface CityInfo {
  name: string;
  lat: number;
  lng: number;
}

interface LocationState {
  city: string;
  lat: number;
  lng: number;
  loading: boolean;
  located: boolean;
  init: () => Promise<void>;
  selectCity: (c: CityInfo) => void;
  relocate: () => Promise<void>;
}

function loadCache(): { city: string; lat: number; lng: number } | null {
  try {
    const city = localStorage.getItem(STORAGE_CITY);
    const coords = localStorage.getItem(STORAGE_COORDS);
    if (city && coords) {
      const [lat, lng] = coords.split(',').map(Number);
      return { city, lat, lng };
    }
  } catch { /* ignore */ }
  return null;
}

function saveCache(city: string, lat: number, lng: number) {
  try {
    localStorage.setItem(STORAGE_CITY, city);
    localStorage.setItem(STORAGE_COORDS, `${lat},${lng}`);
  } catch { /* ignore */ }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&output=json&radius=1000&extensions=base`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === '1' && data.regeocode) {
      const comp = data.regeocode.addressComponent;
      const cityName = comp.city || comp.district || comp.province || null;
      console.log('[定位] 逆地理成功:', cityName, `(原返回: city=${comp.city}, district=${comp.district})`);
      return cityName;
    }
    console.warn('[定位] 逆地理返回异常:', data);
    return null;
  } catch (e) {
    console.warn('[定位] 逆地理请求失败:', e);
    return null;
  }
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('[定位] 浏览器不支持 geolocation');
      reject(new Error('浏览器不支持定位'));
      return;
    }
    // 检查当前协议 — HTTP（非 localhost）会被 Chrome 拦截
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol === 'http:' && !isLocalhost) {
      console.warn(`[定位] 当前为 HTTP(${location.hostname})，浏览器会拦截 GPS。请用 localhost 访问或部署 HTTPS。`);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[定位] GPS 成功:', pos.coords.latitude, pos.coords.longitude);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.warn(`[定位] GPS 失败: ${err.message} (code=${err.code})`);
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

export const useLocationStore = create<LocationState>()((set) => ({
  city: '北京',
  lat: 39.9,
  lng: 116.41,
  loading: false,
  located: false,

  init: async () => {
    console.log('[定位] init 开始…');
    const cache = loadCache();
    if (cache) { set({ city: cache.city, lat: cache.lat, lng: cache.lng, located: true }); console.log('[定位] 缓存命中:', cache.city); } else { console.log('[定位] 无缓存'); }

    set({ loading: true });
    try {
      const pos = await getCurrentPosition();
      const cityName = await reverseGeocode(pos.lat, pos.lng);
      if (cityName) {
        set({ city: cityName, lat: pos.lat, lng: pos.lng, loading: false, located: true });
        saveCache(cityName, pos.lat, pos.lng);
        console.log('[定位] init 完成 — 当前城市:', cityName);
        return;
      }
      console.warn('[定位] GPS 成功但逆地理无结果');
    } catch (e: any) { console.warn('[定位] GPS 失败:', e.message || e); }
    set({ loading: false });
    if (!cache) { console.warn('[定位] 无缓存且 GPS 失败，保持默认:"北京"，请手动选城或点"重新定位"'); set({ located: false }); }
  },

  selectCity: (c) => {
    set({ city: c.name, lat: c.lat, lng: c.lng, located: true });
    saveCache(c.name, c.lat, c.lng);
  },

  relocate: async () => {
    set({ loading: true });
    try {
      const pos = await getCurrentPosition();
      const cityName = await reverseGeocode(pos.lat, pos.lng);
      if (cityName) {
        set({ city: cityName, lat: pos.lat, lng: pos.lng, loading: false, located: true });
        saveCache(cityName, pos.lat, pos.lng);
        return;
      }
    } catch { /* ignore */ }
    set({ loading: false, located: false });
  },
}));
