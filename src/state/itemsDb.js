// src/state/itemsDb.js
const BASE = import.meta.env.BASE_URL || "/";

/** Label cantik buat ditampilkan di UI */
export function itemLabel(id) {
  if (id?.startsWith("key:")) {
    const [, house, lock] = id.split(":");
    return `Kunci (${house} / ${lock})`;
  }
  switch (id) {
    case "house_keyring":
      return "Gantungan Kunci";
    case "house_key":
      return "Kunci Rumah";
    default:
      return id || "—";
  }
}

/** Path icon item (silakan arahkan ke gambar final kamu) */
export function itemIcon(id) {
  // ikon khusus kalau masih pakai single id "house_key"
  if (id === "house_key") return `${BASE}assets/ui/items/keys/house_key.png`;

  // semua kunci multi-id pakai gambar yang sama (bisa dipecah per lock kalau mau)
  if (id?.startsWith("key:")) return `${BASE}assets/ui/items/keys/house_key.png`;

  // gantungan kunci
  if (id === "house_keyring") return `${BASE}assets/ui/items/keys/keyring.svg`;

  return null;
}
