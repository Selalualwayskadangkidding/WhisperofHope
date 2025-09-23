const FIRST_FLAG_KEY = "hv_merchant_seen_v1";

export function getIsFirstTime() {
  try {
    return localStorage.getItem(FIRST_FLAG_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markSeen() {
  try {
    localStorage.setItem(FIRST_FLAG_KEY, "1");
  } catch {}
}
