/**
 * 定位状态管理 — GPS 优先 → IP 定位兜底
 *
 * 流程:
 *   1. GPS → 后端代理高德逆地理 → 城市名
 *   2. GPS 失败 → 后端 IP 定位（自带城市名，无需逆地理）
 *   3. 全失败 → 缓存或默认"北京"
 */
import { create } from 'zustand';
import { reverse, ipLocate } from '@/api/geoController';

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
      // 清除旧的错误默认坐标缓存（洛阳城市中心 34.62,112.45）
      if (lat === 34.62 && lng === 112.45) {
        console.log('[定位] 清除旧默认坐标缓存');
        localStorage.removeItem(STORAGE_CITY);
        localStorage.removeItem(STORAGE_COORDS);
        return null;
      }
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

// GPS 仅在安全的本地回环地址上对 HTTP 豁免，其他 HTTP 场景浏览器静默拒绝
const isSecureForGeolocation =
  location.protocol === 'https:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '::1';

/** 检查浏览器是否已永久拒绝定位权限 */
async function isGeolocationDenied(): Promise<boolean> {
  try {
    if (!navigator.permissions) return false;
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'denied';
  } catch {
    return false;
  }
}

/** 逆地理编码 — 使用 OpenAPI 生成的 geoController */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // 拦截器已解包 BaseResponse，实际返回 Record<string, any>
    const data = await reverse({ lat, lng }) as Record<string, any> | undefined;
    if (data?.city) {
      console.log('[定位] 逆地理成功:', data.city);
      return data.city as string;
    }
    console.warn('[定位] 逆地理返回无城市:', data);
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

/** IP 定位 — 使用 OpenAPI 生成的 geoController */
async function tryIpLocate(): Promise<{ city: string; lat: number; lng: number } | null> {
  try {
    // 拦截器已解包 BaseResponse，实际返回 Record<string, any>
    const data = await ipLocate() as Record<string, any> | undefined;
    if (data?.city) {
      console.log('[定位] IP 定位成功:', data.city, data.lat, data.lng);
      return { city: data.city as string, lat: data.lat as number, lng: data.lng as number };
    }
    console.warn('[定位] IP 定位返回无城市:', data);
    return null;
  } catch (e) {
    console.warn('[定位] IP 定位请求失败:', e);
    return null;
  }
}

export const useLocationStore = create<LocationState>()((set) => ({
  city: '洛阳',
  lat: 34.66598275858435,
  lng: 112.37335681915285,
  loading: false,
  located: false,

  init: async () => {
    console.log('[定位] init 开始…');
    const cache = loadCache();
    if (cache) { set({ city: cache.city, lat: cache.lat, lng: cache.lng, located: false }); console.log('[定位] 缓存命中:', cache.city); } else { console.log('[定位] 无缓存'); }

    set({ loading: true });

    // 第1步：GPS + 后端逆地理代理
    try {
      if (isSecureForGeolocation) {
        const denied = await isGeolocationDenied();
        if (!denied) {
          const pos = await getCurrentPosition();
          const name = await reverseGeocode(pos.lat, pos.lng);
          if (name) {
            set({ city: name, lat: pos.lat, lng: pos.lng, loading: false, located: true });
            saveCache(name, pos.lat, pos.lng);
            console.log('[定位] init 完成(GPS) —', name);
            return;
          }
          console.warn('[定位] GPS 成功但逆地理无结果');
        } else {
          console.warn('[定位] 权限已拒绝，跳过 GPS');
        }
      } else {
        console.warn('[定位] HTTP 非本地环境，跳过 GPS');
      }
    } catch (e: any) { console.warn('[定位] GPS 失败，降级到 IP:', e.message || e); }

    // 第2步：IP 定位（GPS 失败时始终尝试，不因有缓存就跳过）
    const ip = await tryIpLocate();
    if (ip) {
      // IP 成功 → 始终更新坐标（IP 可能比旧缓存更准）
      set({ city: ip.city, lat: ip.lat, lng: ip.lng, loading: false, located: false });
      saveCache(ip.city, ip.lat, ip.lng);
      console.log('[定位] init 完成(IP) —', ip.city);
      return;
    }

    // 第3步：全失败 → 缓存或默认
    set({ loading: false });
    if (cache) {
      console.log('[定位] 定位失败，使用缓存:', cache.city);
    } else {
      console.warn('[定位] GPS+IP 均失败，请手动选城市');
      set({ located: false });
    }
  },

  selectCity: (c) => {
    set({ city: c.name, lat: c.lat, lng: c.lng, located: true });
    saveCache(c.name, c.lat, c.lng);
  },

  relocate: async () => {
    set({ loading: true });

    try {
      if (isSecureForGeolocation) {
        const denied = await isGeolocationDenied();
        if (!denied) {
          const pos = await getCurrentPosition();
          const name = await reverseGeocode(pos.lat, pos.lng);
          if (name) {
            set({ city: name, lat: pos.lat, lng: pos.lng, loading: false, located: true });
            saveCache(name, pos.lat, pos.lng);
            console.log('[定位] relocate(GPS) —', name);
            return;
          }
        }
      }
    } catch { /* ignore */ }

    const ip = await tryIpLocate();
    if (ip) {
      set({ city: ip.city, lat: ip.lat, lng: ip.lng, loading: false, located: false });
      saveCache(ip.city, ip.lat, ip.lng);
      console.log('[定位] relocate(IP) —', ip.city);
      return;
    }

    set({ loading: false, located: false });
    console.warn('[定位] relocate 失败 — 请手动选城市或检查广告拦截插件');
  },
}));
