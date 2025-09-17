// src/state/inventory.js
const INV_KEY = "hv_inventory_v1";

/** ID item standar (opsional untuk kompatibilitas) */
export const ITEMS = {
  HOUSE_KEYRING: "house_keyring",
  HOUSE_KEY: "house_key", // kalau masih pakai single-key lama
};

/** ===== Inventori: load/save/ops ===== */
export function loadInventory() {
  try {
    const raw = localStorage.getItem(INV_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveInventory(inv) {
  try {
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
  } catch {}
}

export function hasItem(inv, id) {
  return inv.includes(id);
}

export function addItem(inv, id) {
  if (inv.includes(id)) return inv;
  const next = [...inv, id];
  saveInventory(next);
  return next;
}

export function removeItem(inv, id) {
  const next = inv.filter((x) => x !== id);
  saveInventory(next);
  return next;
}

/** =====(opsional) Gate flag untuk lock pintu global===== */
const REQ_KEY_FLAG = "hv_requires_key_v1"; // "true" / "false"
export function requiresKey() {
  return localStorage.getItem(REQ_KEY_FLAG) === "true";
}
export function setRequiresKey(value) {
  localStorage.setItem(REQ_KEY_FLAG, value ? "true" : "false");
}

/** ===== Helper multi-kunci (format: key:<houseTag>:<lockId>) ===== */
export function isKeyId(id) {
  return typeof id === "string" && id.startsWith("key:");
}

export function listKeys(inv) {
  return inv.filter(isKeyId);
}

export function listKeysForHouse(inv, houseTag) {
  return listKeys(inv).filter((id) => id.split(":")[1] === houseTag);
}

export function hasMatchingKey(inv, houseTag, lockId) {
  return inv.includes(`key:${houseTag}:${lockId}`);
}

/** ===== Dev helper ===== */
export function devGiveKeys(ids = ["key:house1:frontdoor"]) {
  const inv = loadInventory();
  let next = inv.slice();
  let changed = false;
  for (const id of ids) {
    if (!next.includes(id)) {
      next.push(id);
      changed = true;
    }
  }
  if (changed) saveInventory(next);
  console.log("[dev] keys added:", ids);
}
