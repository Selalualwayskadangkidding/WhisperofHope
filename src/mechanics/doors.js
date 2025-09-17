// src/mechanics/doors.js

export const DOOR_CONFIG = {
  inset: 28,        // makin besar: zona masuk agak ke dalam rumah → aman dari spawn
  width: null,      // null => pakai fraksi dari lebar rumah
  widthFrac: 0.35,  // 35% dari lebar obstacle rumah
  height: 40,
};

/**
 * Hitung area pintu dari obstacle rumah (pakai id rumah).
 * obstacles: array {id, x, y, w, h, type}
 * return: { x, y, width, height } | null
 */
export function makeDoorZone(obstacles, houseRectId, cfg = DOOR_CONFIG) {
  const house = obstacles.find(o => o.id === houseRectId);
  if (!house) return null;

  const inset = cfg.inset ?? 0;
  const width =
    cfg.width != null
      ? cfg.width
      : Math.max(24, Math.floor((cfg.widthFrac ?? 0.3) * house.w));
  const height = cfg.height ?? 36;

  // zona pintu di tengah sisi bawah rumah
  const x = Math.floor(house.x + (house.w - width) / 2);
  const y = Math.floor(house.y + house.h - inset - height);

  return { x, y, width, height };
}

/** AABB overlap sederhana antara hb {x,y,w,h} dan box {x,y,width,height} */
export function overlaps(hb, box) {
  return !(
    hb.x + hb.w <= box.x ||
    hb.x >= box.x + box.width ||
    hb.y + hb.h <= box.y ||
    hb.y >= box.y + box.height
  );
}
