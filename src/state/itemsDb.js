// src/state/itemsDb.js
const BASE = (import.meta?.env?.BASE_URL ?? "/").replace(/\/+$/, "") + "/";

/** Katalog ID item baku (hindari magic string di tempat lain) */
export const ITEM_IDS = {
  HOUSE_KEYRING: "house_keyring",
  HOUSE_KEY: "house_key", // legacy single key (back-compat)
};

/** Util: cek & bikin/pecah ID kunci multi pintu */
export function isKeyId(id) {
  return typeof id === "string" && id.startsWith("key:");
}
/**
 * keyId format: key:<houseTag>:<lockId>
 * contoh: key:house1:frontdoor
 */
export function makeKeyId(houseTag, lockId) {
  return `key:${houseTag}:${lockId}`;
}
export function parseKeyId(id) {
  if (!isKeyId(id)) return null;
  const [, houseTag, lockId] = id.split(":");
  return { houseTag, lockId };
}

/** Label cantik buat UI */
export function itemLabel(id) {
  if (!id) return "—";

  if (isKeyId(id)) {
    const parsed = parseKeyId(id);
    if (!parsed) return "Kunci";
    const { houseTag, lockId } = parsed;
    return `Kunci (${houseTag} / ${lockId})`;
  }

  switch (id) {
    case ITEM_IDS.HOUSE_KEYRING:
      return "Gantungan Kunci";
    case ITEM_IDS.HOUSE_KEY: // legacy
      return "Kunci Rumah";
    default:
      // fallback: tampilkan id mentah biar kelihatan kalau ada item baru
      return id;
  }
}

/** Path icon item (arahin ke aset kamu) */
export function itemIcon(id) {
  if (!id) return null;

  // Legacy single key → ikon sama
  if (id === ITEM_IDS.HOUSE_KEY) return `${BASE}assets/ui/items/keys/house_key.png`;

  // Semua kunci multi pintu sementara pakai ikon yang sama
  if (isKeyId(id)) return `${BASE}assets/ui/items/keys/house_key.png`;

  // Gantungan kunci (SVG)
  if (id === ITEM_IDS.HOUSE_KEYRING) return `${BASE}assets/ui/items/keys/keyring.svg`;

  // fallback: tidak ada ikon
  return null;
}
