// src/data/portals.js
// Definisi portal & spawn agar pindah scene konsisten

export const PORTALS = {
  YARD_TO_LIVING: "yard->living",
};

export const SPAWNS = {
  LIVING_ENTRANCE: "living:entrance",
};

// Atur area pintu di Yard agar sesuai dengan kotak pintu kamu.
// Angka default di bawah menyesuaikan yang pernah kamu sebut (id:7).
export const PORTAL_DEFS = [
  {
    id: PORTALS.YARD_TO_LIVING,
    fromScene: "YardScene",
    area: { x: 927, y: 382, width: 91, height: 107 }, // geser kalau nggak pas
    toScene: "LivingRoomScene",
    toSpawn: SPAWNS.LIVING_ENTRANCE,
    hint: "Masuk Rumah [E]",
  },
];
