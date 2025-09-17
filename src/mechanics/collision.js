// src/mechanics/collision.js
// Utilitas collision axis-per-axis sesuai pola di GameScene lu

export function rectOverlap(ax, ay, aw, ah, b) {
  return ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;
}

export function overlapAny(ax, ay, aw, ah, rects) {
  for (let i = 0; i < rects.length; i++) {
    if (rectOverlap(ax, ay, aw, ah, rects[i])) return rects[i];
  }
  return null;
}

/** Gerak + dorong keluar kalau nabrak (axis-per-axis) */
export function moveWithCollisionAxis(hitbox, dx, dy, solids) {
  const out = { ...hitbox };

  // X
  out.x += dx;
  const hitX = overlapAny(out.x, out.y, out.w, out.h, solids);
  if (hitX) {
    if (dx > 0) out.x = hitX.x - out.w;       // dari kiri
    else if (dx < 0) out.x = hitX.x + hitX.w; // dari kanan
  }

  // Y
  out.y += dy;
  const hitY = overlapAny(out.x, out.y, out.w, out.h, solids);
  if (hitY) {
    if (dy > 0) out.y = hitY.y - out.h;       // dari atas
    else if (dy < 0) out.y = hitY.y + hitY.h; // dari bawah
  }

  return out;
}
