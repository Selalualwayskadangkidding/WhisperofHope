// NEW (shared money state untuk semua scene)
const KEY = "hv_money";
const DEFAULT = 100000;

export function loadMoney() {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) ? n : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setMoney(next) {
  try { localStorage.setItem(KEY, String(next)); } catch {}
  window.dispatchEvent(new CustomEvent("hv_money_change", { detail: next }));
  return next;
}

export function addMoney(delta) {
  return setMoney(loadMoney() + delta);
}

import { useEffect, useState } from "react";
export function useMoney() {
  const [money, setState] = useState(() => loadMoney());

  useEffect(() => {
    const onChange = (e) => setState(e.detail);
    window.addEventListener("hv_money_change", onChange);
    // sync awal
    setState(loadMoney());
    return () => window.removeEventListener("hv_money_change", onChange);
  }, []);

  return {
    money,
    setMoney: (n) => setState(setMoney(n)),
    addMoney: (d) => setState(addMoney(d)),
    reload: () => setState(loadMoney()),
  };
}
