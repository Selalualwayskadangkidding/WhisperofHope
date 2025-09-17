export const STORAGE_KEY = "hv_collision_rects_house_v";

export function getDefaultObstacles() {
  return [
    // pintu keluar ke yard
    { id: 1, x: 612, y: 676, width: 136, height: 24, type: "door" },

    // dinding
    { id: 2, x: 0, y: 0, width: 1280, height: 24, type: "solid" },
    { id: 3, x: 0, y: 0, width: 24, height: 720, type: "solid" },
    { id: 4, x: 1256, y: 0, width: 24, height: 720, type: "solid" },
    { id: 5, x: 0, y: 696, width: 1280, height: 24, type: "solid" },

    // furniture contoh
    { id: 10, x: 240, y: 560, width: 170, height: 60, type: "solid" },
    { id: 11, x: 380, y: 200, width: 520, height: 120, type: "solid" },
    { id: 12, x: 980, y: 520, width: 160, height: 90, type: "solid" },
  ];
}

export function loadObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveObstaclesToStorage(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list || [])); } catch {}
}
