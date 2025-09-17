export const LR_STORAGE_KEY = "hv_collision_rects_livingroom_v2"; // bump versi biar nggak ketimpa data lama

/**
 * Koordinat map 1280x720 dengan origin (0,0) di pojok kiri-atas stage.
 * type: "solid" dipakai collision, "spawn" untuk titik lahir.
 */
export function getDefaultLivingroomObstacles() {

  return [
    // ====== SPAWN (depan area bawah tengah) ======
    { id: 100, x: 620, y: 600, w: 20, h: 14, type: "spawn" },

    // ====== DINDING RUANG (bingkai) ======
    { id: 21, x: 0,    y: 0,   w: 1280, h: 18,  type: "solid" }, // top
    { id: 22, x: 0,    y: 702, w: 1280, h: 18,  type: "solid" }, // bottom
    { id: 23, x: 0,    y: 0,   w: 18,   h: 720, type: "solid" }, // left
    { id: 24, x: 1262, y: 0,   w: 18,   h: 720, type: "solid" }, // right
    // ====== FURNITURE (perkiraan, tinggal geser via overlay) ======
    { id: 1, x: 440, y: 250, w: 400, h: 90,  type: "solid" }, // sofa panjang
    { id: 2, x: 560, y: 360, w: 160, h: 80,  type: "solid" }, // meja kopi
    { id: 3, x: 880, y: 240, w: 160, h: 120, type: "solid" }, // TV set
    { id: 4, x: 380, y: 480, w: 120, h: 120, type: "solid" }, // pot besar
    { id: 5, x: 380, y: 480, w: 120, h: 110, type: "solid" }, // lemari kanan
    { id: 6, x: 380, y: 480, w: 120, h: 110, type: "solid" }, // lemari kanan
    { id: 7, x: 440, y: 250, w: 400, h: 90,  type: "solid" }, // sofa panjang
    { id: 8, x: 750, y: 480, w: 120, h: 110, type: "solid" }, // lemari kiri
    { id: 9, x: 750, y: 480, w: 120, h: 110, type: "spawn" },   // merah (lemari)
    { id: 10, x: 900, y: 480, w: 120, h: 120, type: "solid" }, // pot besar
    // ====== AREA LORONG (bisa dilewati) ======
    { id: 5, x: 900, y: 0,   w: 40,  h: 180, type: "solid" },


    // (opsional) lorong/pagar dekor, bisa dihapus kalau mengganggu
    { id: 6, x: 900, y: 430, w: 40,  h: 180, type: "solid" }, // pilar lorong
  ];
}

export function loadLivingroomObstaclesFromStorage() {
  try {
    const raw = localStorage.getItem(LR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn("loadLivingroomObstaclesFromStorage gagal:", err);
    return null;
  }
}
