// src/mechanics/locks.js
const LOCKS_STORAGE_KEY = "hv_game_locks_v1";

/**
 * locks shape:
 * {
 *   doors: {
 *     "<doorId>": { locked: true, requiredKeyId: "key_frontdoor" },
 *     ...
 *   }
 * }
 */

function load() {
  try {
    const raw = localStorage.getItem(LOCKS_STORAGE_KEY);
    if (!raw) return { doors: {} };
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load locks:", e);
    return { doors: {} };
  }
}

function save(state) {
  try {
    localStorage.setItem(LOCKS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save locks:", e);
  }
}

// default initial state helper (call once on game start)
export function initLocks(defaults = {}) {
  const existing = load();
  // Merge defaults only when not present
  const merged = { doors: { ...(defaults.doors || {}), ...(existing.doors || {}) } };
  save(merged);
  return merged;
}

export function isLocked(doorId) {
  const state = load();
  return !!(state.doors && state.doors[doorId] && state.doors[doorId].locked);
}

export function requiredKeyFor(doorId) {
  const state = load();
  return state.doors && state.doors[doorId] ? state.doors[doorId].requiredKeyId : null;
}

export function unlock(doorId) {
  const state = load();
  if (!state.doors) state.doors = {};
  if (!state.doors[doorId]) state.doors[doorId] = {};
  state.doors[doorId].locked = false;
  save(state);
}

export function lock(doorId, requiredKeyId) {
  const state = load();
  if (!state.doors) state.doors = {};
  state.doors[doorId] = { locked: true, requiredKeyId };
  save(state);
}

// debug helper
export function resetAllLocks() {
  const state = { doors: {} };
  save(state);
  return state;
}

export default {
  initLocks,
  isLocked,
  requiredKeyFor,
  unlock,
  lock,
  resetAllLocks,
};
