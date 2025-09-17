// Bump versi biar data lama (v1) yang ID-nya bentrok nggak kepakai
export const RO_STORAGE_KEY = "hv_collision_rects_roomortu_v2";

export function getDefaultRoomOrtuObstacles() {
  return [
    // spawn default
    { id: 100, x: 620, y: 560, w: 20, h: 14, type: "spawn" },

    // dinding (ID unik, bukan pintu)
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
    { id: 11, x: 0, y: 0, w: 18, h: 720, type: "solid" },
    { id: 13, x: 0, y: 0, w: 18, h: 720, type: "solid" },

    // ====== ZONA PINTU KE HALLWAY ======
    // PENTING: type "door" + ID unik (901). Geser via overlay ke kusen pintu.
    { id: 901, x: 610, y: 650, w: 60, h: 30, type: "door" },
  ];
}

export function loadRoomOrtuObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(RO_STORAGE_KEY);
    if (!raw) return getDefaultRoomOrtuObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultRoomOrtuObstacles();
  } catch {
    return getDefaultRoomOrtuObstacles();
  }
}
