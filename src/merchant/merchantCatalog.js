export const TOOL_ITEMS = [
  { id: "tool:sapu", name: "Sapu", price: 12000, rarity: "common", speedMul: 0.05 },
  { id: "tool:kemoceng", name: "Kemoceng", price: 10000, rarity: "common", speedMul: 0.04 },
  { id: "tool:kanebo", name: "Kanebo", price: 15000, rarity: "uncommon", speedMul: 0.06 },
  { id: "tool:pel", name: "Pel", price: 18000, rarity: "uncommon", speedMul: 0.08 },
  { id: "tool:sikat", name: "Sikat Lantai", price: 22000, rarity: "uncommon", speedMul: 0.1 },
  { id: "tool:steam_mop", name: "Steam Mop", price: 150000, rarity: "rare", speedMul: 0.25 },
  { id: "tool:vacuum", name: "Vacuum Cleaner", price: 500000, rarity: "epic", speedMul: 0.6 },
];

export const FOOD_ITEMS = [
  { id: "food:tempe", name: "Tempe", price: 5000, hunger: +12 },
  { id: "food:tahu", name: "Tahu", price: 4000, hunger: +10 },
  { id: "food:lontong", name: "Lontong", price: 7000, hunger: +15 },
  { id: "food:sukro", name: "Sukro", price: 3000, hunger: +8 },
];

export const DRINK_ITEMS = [
  { id: "drink:air", name: "Air Putih", price: 2000, thirst: +12 },
  { id: "drink:teh", name: "Teh Manis", price: 6000, thirst: +14 },
  { id: "drink:kopi", name: "Kopi Tubruk", price: 8000, thirst: +10 },
  { id: "drink:es_jeruk", name: "Es Jeruk", price: 9000, thirst: +15 },
  { id: "drink:beras_kencur", name: "Beras Kencur", price: 18000, thirst: +20 },
  { id: "drink:kunyit_asem", name: "Kunyit Asem", price: 17000, thirst: +20 },
];

export const CATEGORIES = [
  { key: "tools", label: "Alat", items: TOOL_ITEMS },
  { key: "foods", label: "Makanan", items: FOOD_ITEMS },
  { key: "drinks", label: "Minuman", items: DRINK_ITEMS },
];
