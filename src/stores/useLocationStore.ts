/**
 * 定位状态管理 — GPS 优先 → IP 定位兜底
 *
 * 流程:
 *   1. GPS → 后端代理高德逆地理 → 城市名
 *   2. GPS 失败 → 后端 IP 定位（自带城市名，无需逆地理）
 *   3. 全失败 → 缓存或默认"北京"
 */
import { create } from 'zustand';

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

/** 逆地理编码 — 走后端代理 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const resp = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, { credentials: 'include' });
    const body = await resp.json();
    if (body.code === 0 && body.data?.city) {
      console.log('[定位] 逆地理成功:', body.data.city);
      return body.data.city;
    }
    console.warn('[定位] 逆地理返回异常:', body);
    return null;
  } catch (e) {
    console.warn('[定位] 逆地理请求失败:', e);
    return null;
  }
}

const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('[定位] 浏览器不支持 geolocation');
      reject(new Error('浏览器不支持定位'));
      return;
    }
    if (location.protocol === 'http:' && !isLocalhost) {
      console.warn(`[定位] HTTP(${location.hostname}) 会拦截 GPS`);
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

/** IP 定位 — 城市名由后端返回，无需再调逆地理 */
async function ipLocate(): Promise<{ city: string; lat: number; lng: number } | null> {
  try {
    const resp = await fetch('/api/geo/ip-locate', { credentials: 'include' });
    const body = await resp.json();
    if (body.code === 0 && body.data?.city) {
      console.log('[定位] IP 定位成功:', body.data.city, body.data.lat, body.data.lng);
      return { city: body.data.city, lat: body.data.lat, lng: body.data.lng };
    }
    console.warn('[定位] IP 定位返回异常:', body);
    return null;
  } catch (e) {
    console.warn('[定位] IP 定位请求失败:', e);
    return null;
  }
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

    // 第1步：GPS + 后端逆地理代理
    try {
      const pos = await getCurrentPosition();
      const cityName = await reverseGeocode(pos.lat, pos.lng);
      if (cityName) {
        set({ city: cityName, lat: pos.lat, lng: pos.lng, loading: false, located: true });
        saveCache(cityName, pos.lat, pos.lng);
        console.log('[定位] init 完成(GPS) —', cityName);
        return;
      }
      console.warn('[定位] GPS 成功但逆地理无结果');
    } catch (e: any) { console.warn('[定位] GPS 失败，降级到 IP:', e.message || e); }

    // 第2步：IP 定位 — localhost 下 IP 定位永远是北京，不可信
    if (!isLocalhost || !cache) {
      const ip = await ipLocate();
      if (ip) {
        set({ city: ip.city, lat: ip.lat, lng: ip.lng, loading: false, located: !isLocalhost });
        saveCache(ip.city, ip.lat, ip.lng);
        console.log('[定位] init 完成(IP) —', ip.city);
        return;
      }
    }

    // 第3步：全失败 → 缓存或提示手动选择
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
    // GPS
    try {
      const pos = await getCurrentPosition();
      const cityName = await reverseGeocode(pos.lat, pos.lng);
      if (cityName) {
        set({ city: cityName, lat: pos.lat, lng: pos.lng, loading: false, located: true });
        saveCache(cityName, pos.lat, pos.lng);
        console.log('[定位] relocate(GPS) —', cityName);
        return;
      }
    } catch { /* ignore */ }

    // IP — localhost 下不可信
    if (!isLocalhost) {
      const ip = await ipLocate();
      if (ip) {
        set({ city: ip.city, lat: ip.lat, lng: ip.lng, loading: false, located: true });
        saveCache(ip.city, ip.lat, ip.lng);
        console.log('[定位] relocate(IP) —', ip.city);
        return;
      }
    }
    set({ loading: false, located: false });
    console.warn('[定位] relocate 失败 — 请手动选城市或检查广告拦截插件');
  },
}));
