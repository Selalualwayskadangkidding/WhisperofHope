// BUMP versi storage biar data lama (yang ID bentrok) nggak kepakai
export const RK_STORAGE_KEY = "hv_collision_rects_roomkakak_v2";

export function getDefaultRoomKakakObstacles() {
  return [
    // spawn default
    { id: 100, x: 600, y: 560, w: 20, h: 14, type: "spawn" },

    // bingkai dinding (tetap unik, tidak dipakai sebagai pintu)
    { id: 1, x: 0, y: 0, w: 1280, h: 18, type: "solid" },
    { id: 2, x: 0, y: 702, w: 1280, h: 18, type: "solid" },
    { id: 3, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    { id: 4, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 5, x: 0, y: 0, w: 1280, h: 18, type: "solid" },
    { id: 6, x: 0, y: 702, w: 1280, h: 18, type: "solid" },
    { id: 7, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    { id: 8, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 9, x: 1262, y: 0, w: 18, h: 720, type: "solid" },
    { id: 10, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    // ====== ZONA PINTU BALIK KE HALLWAY ======
    // Geser di overlay sesuai posisi pintu map-mu
    { id: 900, x: 610, y: 650, w: 60, h: 30, type: "door" },
  ];
}

export function loadRoomKakakObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(RK_STORAGE_KEY);
    if (!raw) return getDefaultRoomKakakObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultRoomKakakObstacles();
  } catch {
    return getDefaultRoomKakakObstacles();
  }
}
