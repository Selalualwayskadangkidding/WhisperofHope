// src/data/livingroomObstacles.js
export const LR_STORAGE_KEY = "hv_collision_rects_livingroom_v4"; // bump biar reset cache lama

/**
 * Koordinat map 1280x720 dengan origin (0,0) di pojok kiri-atas stage.
 * type:
 *  - "solid" : collision
 *  - "spawn" : titik lahir (punya tag asal)
 *  - "door"  : trigger pindah scene (punya tag tujuan)
 */
export function getDefaultLivingroomObstacles() {
  return [
    // ====== DINDING RUANG (bingkai) ======
    { id: 1,  x: 0,    y: 0,   w: 1280, h: 18,  type: "solid" }, // top
    { id: 2,  x: 0,    y: 702, w: 1280, h: 18,  type: "solid" }, // bottom
    { id: 3,  x: 0,    y: 0,   w: 18,   h: 720, type: "solid" }, // left
    { id: 4,  x: 1262, y: 0,   w: 18,   h: 720, type: "solid" }, // right

    // ====== FURNITURE (perkiraan, bisa digeser di overlay) ======
    { id: 11, x: 440, y: 250, w: 400, h: 90,  type: "solid" }, // sofa panjang
    { id: 12, x: 560, y: 360, w: 160, h: 80,  type: "solid" }, // meja kopi
    { id: 13, x: 880, y: 240, w: 160, h: 120, type: "solid" }, // TV set
    { id: 14, x: 380, y: 480, w: 120, h: 120, type: "solid" }, // pot besar
    { id: 15, x: 1030, y: 430, w: 40,  h: 180, type: "solid" }, // pilar lorong kanan
    { id: 16, x: 900,  y: 180, w: 40,  h: 180, type: "solid" }, // pilar lorong atas (contoh)

    // ====== SPAWN ZONES (titik lahir saat masuk LR) ======
    // dari YARD -> masuk ke LR (bawah tengah)
    { id: 100, x: 620, y: 600, w: 20, h: 14, type: "spawn", tag: "from_yard" },
    // dari HALLWAY -> masuk ke LR (dekat pintu kanan)
    { id: 101, x: 1120, y: 400, w: 20, h: 14, type: "spawn", tag: "from_hallway" },

    // ====== DOOR ZONES (trigger pindah scene; bisa digeser) ======
    // ke Yard (pintu depan bawah)
    { id: 200, x: 560, y: 655, w: 160, h: 40, type: "door", tag: "to_yard", label: "Ke Yard" },
    // ke Hallway (pintu kanan)
    { id: 201, x: 1040, y: 470, w: 140, h: 40, type: "door", tag: "to_hallway", label: "Ke Hallway" },
  ];
}

export function loadLivingroomObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(LR_STORAGE_KEY);
    if (!raw) return getDefaultLivingroomObstacles();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : getDefaultLivingroomObstacles();
  } catch (err) {
    console.warn("loadLivingroomObstaclesFromStorage gagal:", err);
    return getDefaultLivingroomObstacles();
  }
}
