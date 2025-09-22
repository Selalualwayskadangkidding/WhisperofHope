// src/state/inventoryProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  loadInventory,
  saveInventory,
  hasItem as utilHasItem,
  addItem as utilAddItem,
  removeItem as utilRemoveItem,
  listKeys,
  listKeysForHouse,
  hasMatchingKey,
  ITEMS,
} from "./inventory.js";

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(() => loadInventory());

  // debounce save ke localStorage
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { saveInventory(items); } catch {}
    }, 200);
    return () => clearTimeout(saveTimer.current);
  }, [items]);

  // API yang konsisten dengan util
  const hasItem = (id) => utilHasItem(items, id);

  const addItem = (id) => {
    if (!id) return;
    setItems((prev) => (prev.includes(id) ? prev : utilAddItem(prev, id)));
  };

  const removeItem = (id) => {
    if (!id) return;
    setItems((prev) => utilRemoveItem(prev, id));
  };

  const clearInventory = () => setItems([]);

  const value = useMemo(() => ({
    items,
    hasItem,
    addItem,
    removeItem,
    clearInventory,
    // util ekstra biar nggak perlu import di scene:
    listKeys: () => listKeys(items),
    listKeysForHouse: (house) => listKeysForHouse(items, house),
    hasMatchingKey: (house, lock) => hasMatchingKey(items, house, lock),
    ITEMS,
  }), [items]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}
