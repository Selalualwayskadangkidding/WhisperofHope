// src/state/persist.js

const NS = "hv_"; // namespace kecil biar kunci storage rapi

/** Ambil JSON dari localStorage. Gagal parsing → fallback. */
export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Simpan JSON ke localStorage. Return true jika sukses. */
export function saveJSON(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Hapus kunci tertentu. */
export function removeKey(key) {
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* ignore */
  }
}

/** Util kecil: set berbasis array (hindari duplikat). */
export function pushUniqueToArray(arr, val) {
  if (!Array.isArray(arr)) return [val];
  return arr.includes(val) ? arr.slice() : [...arr, val];
}
