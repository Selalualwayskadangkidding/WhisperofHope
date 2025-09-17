// src/data/hallwayObstacles.js
export const HW_STORAGE_KEY = "hv_collision_rects_hallway_v1";

/**
 * Default obstacles cuma fallback kalau localStorage kosong/invalid.
 * Format: { id, x, y, w, h, type: "solid" | "spawn" }
 */
export function getDefaultHallwayObstacles() {
  return [
    // spawn default (boleh lu ubah nanti di overlay)
    { id: 100, x: 41, y: 486, w: 20, h: 14, type: "spawn" },

    // bingkai dinding minimal
    { id: 1, x: 0,    y: 0,   w: 1280, h: 18,  type: "solid" },
    { id: 2, x: 0,    y: 702, w: 1280, h: 18,  type: "solid" },
    { id: 3, x: 0,    y: 0,   w: 18,   h: 720, type: "solid" },
    { id: 4, x: 1262, y: 0,   w: 18,   h: 720, type: "solid" },

    // jalur bawah (contoh)
    { id: 5, x: 666, y: 604, w: 577, h: 111, type: "solid" },

    // ======== ZONA PINTU (ikut SS lu) ========
    // 6: balik ke Living Room
    { id: 6, x: 535, y: 652, w: 29, h: 29, type: "door" },
    // 7: Kamar Kakak
    { id: 7, x: 228, y: 321, w: 92, h: 29, type: "door" },
    // 8: Kamar Ayah Ibu
    { id: 8, x: 872, y: 326, w: 112, h: 29, type: "door" },
    // 9: Dapur
    { id: 9, x: 1179, y: 399, w: 92, h: 29, type: "door" },
    // 10: Kamar Mandi (baru) — bebas geser di overlay
    { id: 10, x: 1050, y: 200, w: 92, h: 29, type: "door" },
  ];
}

export function loadHallwayObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(HW_STORAGE_KEY);
    if (!raw) return getDefaultHallwayObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultHallwayObstacles();
  } catch {
    return getDefaultHallwayObstacles();
  }
}
