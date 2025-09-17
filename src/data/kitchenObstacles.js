// Bump versi supaya data lama (v1) yang pakai ID ganda nggak ikut
export const KT_STORAGE_KEY = "hv_collision_rects_kitchen_v2";

export function getDefaultKitchenObstacles() {
  return [
    // spawn default
    { id: 100, x: 600, y: 560, w: 20, h: 14, type: "spawn" },

    // dinding (unik)
    { id: 1, x: 0, y: 0, w: 1280, h: 18, type: "solid" },
    { id: 2, x: 0, y: 702, w: 1280, h: 18, type: "solid" },
    { id: 3, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    { id: 4, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 5, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 6, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 7, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 8, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 9, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    // ====== ZONA PINTU BALIK KE HALLWAY ======
    // type "door" + ID unik (903). Geser via overlay ke kusen pintu.
    { id: 903, x: 610, y: 650, w: 60, h: 30, type: "door" },
  ];
}

export function loadKitchenObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(KT_STORAGE_KEY);
    if (!raw) return getDefaultKitchenObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultKitchenObstacles();
  } catch {
    return getDefaultKitchenObstacles();
  }
}
