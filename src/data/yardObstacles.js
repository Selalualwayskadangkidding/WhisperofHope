// src/data/yardObstacles.js
// Sumber asli dari file lu (dipertahankan), plus normalizer buat konsistensi.

export const STORAGE_KEY = "hv_collision_rects_mainmap_v";

// RAW obstacles (asli dari kode lu)
const manualObstacles = [
  { id: 1,  x: 822,  y: 149, width: 475, height: 353, type: "solid" },
  { id: 2,  x: 1014, y: 508, width: 237, height: 143, type: "solid" },
  { id: 3,  x: 315,  y: 484, width: 479, height: 336, type: "solid" },
  { id: 4,  x: 1328, y: 695, width: 93,  height: 120, type: "solid" },
  { id: 5,  x: 1160, y: -43, width: 1252, height: 196, type: "solid" },
  { id: 6,  x: 87,   y: 8,   width: 698, height: 311, type: "solid" },
  { id: 7,  x: 927,  y: 382, width: 91,  height: 107, type: "solid" }, // rumah (buat ambil pintu)
  { id: 8,  x: 1454, y: 159, width: 225, height: 1104, type: "solid" },
  { id: 9,  x: 519,  y: 947, width: 463, height: 319, type: "solid" },
  { id: 10, x: 947,  y: 536, width: 34,  height: 89,  type: "spawn" },
];

// Normalizer → ubah ke {id,x,y,w,h,type}
export function normalizeObstacles(list) {
  return list.map((ob, i) => ({
    id: ob.id ?? i + 1,
    x: ob.x,
    y: ob.y,
    w: ob.width ?? ob.w,
    h: ob.height ?? ob.h,
    type: ob.type ?? "solid",
  }));
}

export function loadObstaclesFromStorage(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed.map((r, i) => ({
      id: r.id ?? i + 1,
      x: r.x, y: r.y,
      w: r.w ?? r.width,
      h: r.h ?? r.height,
      type: r.type || "solid",
    }));
  } catch {
    return null;
  }
}

export function getDefaultObstacles() {
  return normalizeObstacles(manualObstacles);
}
