import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "hv_player_state_v1";

const DEFAULT_STATE = {
  hunger: 100,    // 0..100
  thirst: 100,    // 0..100
  money: 100_000, // Rp100.000 awal
};

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [hunger, setHunger] = useState(DEFAULT_STATE.hunger);
  const [thirst, setThirst] = useState(DEFAULT_STATE.thirst);
  const [money,  setMoney ] = useState(DEFAULT_STATE.money);

  // Load sekali saat mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.hunger === "number") setHunger(saved.hunger);
        if (typeof saved.thirst === "number") setThirst(saved.thirst);
        if (typeof saved.money  === "number") setMoney(saved.money);
      }
    } catch {}
  }, []);

  // Save (debounce ringan)
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ hunger, thirst, money }));
      } catch {}
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [hunger, thirst, money]);

  // Decay tiap detik (sesuaikan kalau perlu)
  useEffect(() => {
    const TICK_MS = 1000;
    const HUNGER_DEC = 0.03; // ~3 / 100 detik
    const THIRST_DEC = 0.05; // ~5 / 100 detik
    const id = setInterval(() => {
      setHunger(h => Math.max(0, Math.min(100, h - HUNGER_DEC)));
      setThirst(t => Math.max(0, Math.min(100, t - THIRST_DEC)));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Helpers uang
  const addMoney = (amount) => setMoney(m => Math.max(0, m + (amount|0)));
  const spendMoney = (amount) => {
    const a = amount|0;
    if (a <= 0) return true;
    if (money >= a) {
      setMoney(m => m - a);
      return true;
    }
    return false;
  };

  // Helpers status (untuk item makanan/minuman)
  const addHunger = (v) => setHunger(h => Math.max(0, Math.min(100, h + v)));
  const addThirst = (v) => setThirst(t => Math.max(0, Math.min(100, t + v)));

  const value = useMemo(() => ({
    hunger, thirst, money,
    setHunger, setThirst, setMoney,
    addHunger, addThirst, addMoney, spendMoney,
  }), [hunger, thirst, money]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export function formatIDR(n) {
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return "Rp" + (n ?? 0).toLocaleString("id-ID");
  }
}
