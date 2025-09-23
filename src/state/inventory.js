// src/state/inventory.js

/* ============================================================
   LEGACY INVENTORY (kompatibel dgn kode lama kamu)
   - hv_inventory_v1 : array string (item unik, mis. keys)
   ============================================================ */
const INV_KEY = "hv_inventory_v1";

/** ID item standar (opsional untuk kompatibilitas) */
export const ITEMS = {
  HOUSE_KEYRING: "house_keyring",
  HOUSE_KEY: "house_key", // kalau masih pakai single-key lama
};

/** ===== Inventori: load/save/ops (LEGACY) ===== */
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

/** ===== (opsional) Gate flag untuk lock pintu global ===== */
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
  // eslint-disable-next-line no-console
  console.log("[dev] keys added:", ids);
}

/* ============================================================
   NEW INVENTORY (untuk merchant)
   - hv_inv_tools_v1 : array string (tool:*), unik 1x
   - hv_inv_cons_v1  : object { [id]: qty } untuk food:/drink:
   ============================================================ */
const KEY_TOOLS = "hv_inv_tools_v1";   // contoh: ["tool:sapu", "tool:pel"]
const KEY_CONS  = "hv_inv_cons_v1";    // contoh: {"food:tempe": 2, "drink:air": 1}

/** ---- Loaders ---- */
function loadTools() {
  try { return JSON.parse(localStorage.getItem(KEY_TOOLS)) ?? []; } catch { return []; }
}
function saveTools(arr) {
  try { localStorage.setItem(KEY_TOOLS, JSON.stringify(arr)); } catch {}
}
function loadCons() {
  try { return JSON.parse(localStorage.getItem(KEY_CONS)) ?? {}; } catch { return {}; }
}
function saveCons(obj) {
  try { localStorage.setItem(KEY_CONS, JSON.stringify(obj)); } catch {}
}

/** ---- Tools (unik) ---- */
export function hasTool(id) {
  const tools = loadTools();
  return tools.includes(id);
}
export function addToolOnce(id) {
  const tools = loadTools();
  if (tools.includes(id)) return false;
  tools.push(id);
  saveTools(tools);
  return true; // baru ditambah
}

/** ---- Consumables (stack) ---- */
export function qtyOf(id) {
  const cons = loadCons();
  return cons[id] ?? 0;
}
export function addConsumable(id, n = 1) {
  const cons = loadCons();
  cons[id] = (cons[id] ?? 0) + Math.max(1, n);
  saveCons(cons);
  return cons[id];
}
export function consumeOne(id) {
  const cons = loadCons();
  const curr = cons[id] ?? 0;
  if (curr <= 0) return 0;
  const next = curr - 1;
  if (next <= 0) delete cons[id];
  else cons[id] = next;
  saveCons(cons);
  return cons[id] ?? 0;
}

/** ---- List gabungan untuk panel ----
 *  Hasil: array id (tools unik + semua consumable yang qty>0)
 */
export function listAllItems() {
  const tools = loadTools();
  const cons  = loadCons();
  const consIds = Object.entries(cons).filter(([, q]) => q > 0).map(([id]) => id);
  return [...tools, ...consIds];
}

/** ---- API simpel untuk MerchantShop ----
 *  - merchantHasItem(id): tools → true/false; consumable → qty>0
 *  - merchantAddItem(id): tools → add once; consumable → +1
 */
export function merchantHasItem(id) {
  if (id.startsWith("tool:")) return hasTool(id);
  // food/drink dianggap "dimiliki" kalau qty>0
  return qtyOf(id) > 0;
}
export function merchantAddItem(id) {
  if (id.startsWith("tool:")) {
    return addToolOnce(id); // true kalau sukses nambah
  }
  addConsumable(id, 1);
  return true;
}
export const merchantAPI = {
  hasItem: merchantHasItem,
  addItem: merchantAddItem,
};
