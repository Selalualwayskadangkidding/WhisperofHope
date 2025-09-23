// src/state/itemsDb.js
const BASE = import.meta.env.BASE_URL || "/";

/** Label cantik buat ditampilkan di UI */
export function itemLabel(id) {
  if (!id) return "—";

  // legacy keys
  if (id?.startsWith("key:")) {
    const [, house, lock] = id.split(":");
    return `Kunci (${house} / ${lock})`;
  }
  if (id === "house_keyring") return "Gantungan Kunci";
  if (id === "house_key") return "Kunci Rumah";

  // merchant: tools
  if (id.startsWith("tool:")) {
    switch (id) {
      case "tool:sapu": return "Sapu";
      case "tool:kemoceng": return "Kemoceng";
      case "tool:kanebo": return "Kanebo";
      case "tool:pel": return "Pel";
      case "tool:sikat": return "Sikat Lantai";
      case "tool:steam_mop": return "Steam Mop";
      case "tool:vacuum": return "Vacuum Cleaner";
      default: return id.slice(5);
    }
  }

  // merchant: foods
  if (id.startsWith("food:")) {
    switch (id) {
      case "food:tempe": return "Tempe";
      case "food:tahu": return "Tahu";
      case "food:lontong": return "Lontong";
      case "food:sukro": return "Sukro";
      default: return id.slice(5);
    }
  }

  // merchant: drinks
  if (id.startsWith("drink:")) {
    switch (id) {
      case "drink:air": return "Air Putih";
      case "drink:teh": return "Teh Manis";
      case "drink:kopi": return "Kopi Tubruk";
      case "drink:es_jeruk": return "Es Jeruk";
      case "drink:beras_kencur": return "Beras Kencur";
      case "drink:kunyit_asem": return "Kunyit Asem";
      default: return id.slice(6);
    }
  }

  return id;
}

/** Path icon item (sesuaikan aset kamu) */
export function itemIcon(id) {
  // legacy keys
  if (id === "house_key") return `${BASE}assets/ui/items/keys/house_key.png`;
  if (id?.startsWith("key:")) return `${BASE}assets/ui/items/keys/house_key.png`;

  // merchant placeholders
  if (id?.startsWith("tool:"))   return `${BASE}assets/ui/items/tools/default_tool.png`;
  if (id?.startsWith("food:"))   return `${BASE}assets/ui/items/foods/default_food.png`;
  if (id?.startsWith("drink:"))  return `${BASE}assets/ui/items/drinks/default_drink.png`;

  return `${BASE}assets/ui/items/default.png`;
}
