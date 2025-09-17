// Bump versi supaya data lama (v1) yang pakai ID bentrok nggak kepakai
export const BM_STORAGE_KEY = "hv_collision_rects_bathroom_v2";

export function getDefaultBathroomObstacles() {
  return [
    // spawn default
    { id: 100, x: 600, y: 560, w: 20, h: 14, type: "spawn" },

    // dinding
    { id: 1, x: 0, y: 0, w: 1280, h: 18, type: "solid" },
    { id: 2, x: 0, y: 702, w: 1280, h: 18, type: "solid" },
    { id: 3, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    { id: 4, x: 1262, y: 0, w: 18, h: 720, type: "solid" },

    // ====== ZONA PINTU BALIK KE HALLWAY ======
    // Pakai type "door" + ID unik (902). Geser di overlay ke kusen pintu.
    { id: 902, x: 610, y: 650, w: 60, h: 30, type: "door" },
  ];
}

export function loadBathroomObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(BM_STORAGE_KEY);
    if (!raw) return getDefaultBathroomObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultBathroomObstacles();
  } catch {
    return getDefaultBathroomObstacles();
  }
}
