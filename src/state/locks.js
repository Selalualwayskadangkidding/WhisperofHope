// src/state/locks.js
const PREFIX = "hv_lock_v1:";

/**
 * Key format: hv_lock_v1:<houseTag>:<lockId> => "locked" | "unlocked"
 * Default: jika belum ada di storage -> dianggap "locked" (true).
 */

export function isLocked(houseTag, lockId) {
  const k = `${PREFIX}${houseTag}:${lockId}`;
  const v = localStorage.getItem(k);
  if (v === null) return true; // default terkunci
  return v === "locked";
}

export function setLocked(houseTag, lockId, locked) {
  const k = `${PREFIX}${houseTag}:${lockId}`;
  localStorage.setItem(k, locked ? "locked" : "unlocked");
}

export function ensureLock(houseTag, lockId, lockedByDefault = true) {
  const k = `${PREFIX}${houseTag}:${lockId}`;
  if (localStorage.getItem(k) == null) {
    localStorage.setItem(k, lockedByDefault ? "locked" : "unlocked");
  }
}

/** Dev helper */
export function devResetLock(houseTag, lockId) {
  const k = `${PREFIX}${houseTag}:${lockId}`;
  localStorage.removeItem(k);
  console.log("[dev] lock cleared:", k);
}
