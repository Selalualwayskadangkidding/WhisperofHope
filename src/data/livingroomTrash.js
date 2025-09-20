// src/data/livingroomTrash.js
import { loadJSON, saveJSON, pushUniqueToArray } from "../state/persist.js";
import {
  LR_TRASH_RECTS_KEY,
  getDefaultLivingroomTrashRects,
} from "./livingroomTrashRects.js";
import { TRASH_SPRITES } from "./trashSprites.js";

// Simpan ID item yang sudah dibersihkan
export const LR_TRASH_KEY = "lr_trash_v1";

/** Label human-friendly per kind */
function labelForKind(kind) {
  switch (kind) {
    case "dust": return "Debu";
    case "corner_dust": return "Debu pojok";
    case "paper": return "Kertas kusut";
    case "snack": return "Bungkus snack";
    case "stain": return "Noda";
    case "cobweb": return "Sarang laba-laba";
    case "magazine": return "Majalah";
    case "remote": return "Remote TV";
    case "plant_dry": return "Tanaman kering";
    default: return "Sampah";
  }
}

/** Ambil rect penempatan dari storage (atau default kalau belum ada) */
function getTrashRects() {
  return loadJSON(LR_TRASH_RECTS_KEY, getDefaultLivingroomTrashRects());
}

/** Paksa ID ke string yang stabil */
function toStableId(raw, defKind, idx) {
  if (raw === 0) return "0";
  if (raw === null || raw === undefined || raw === "") {
    return `lr_${defKind || "trash"}_${idx}`;
  }
  return String(raw);
}

/**
 * Map rect-overlay → item in-game:
 * - Pastikan setiap rect punya _id string yang stabil
 * - Ambil ukuran/sprite dari TRASH_SPRITES (fallback aman)
 * - Dependency: remote muncul setelah majalah terdekat
 */
export function getAllLivingroomTrash() {
  const rects = getTrashRects();

  // 1) Pastikan ID stabil
  const base = rects.map((r, i) => ({
    ...r,
    _id: toStableId(r.id, r.kind, i),
  }));

  // 2) Kumpulan majalah untuk dependency remote
  const magazines = base.filter((r) => r.kind === "magazine");

  function centerOf(rect) {
    return { cx: rect.x + (rect.w || 0) / 2, cy: rect.y + (rect.h || 0) / 2 };
  }

  function nearestMagazineId(rectLike) {
    if (magazines.length === 0) return null;
    const { cx: px, cy: py } = centerOf(rectLike);
    let best = null;
    let bestD2 = Infinity;
    for (const m of magazines) {
      const { cx, cy } = centerOf(m);
      const dx = px - cx;
      const dy = py - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = m._id; // gunakan id stabil
      }
    }
    return best;
  }

  // 3) Bangun item in-game
  return base.map((r) => {
    const def = TRASH_SPRITES?.[r.kind] ?? {};
    const w = def.w ?? r.w ?? 24;
    const h = def.h ?? r.h ?? 24;
    const src = def.src ?? "/assets/ui/trash/trash1.png";

    // Dependency: remote menunggu majalah terdekat
    const requires = r.kind === "remote" ? nearestMagazineId(r) : null;

    return {
      id: r._id,                  // id stabil (string)
      type: r.kind,               // gunakan "kind" sebagai type
      x: r.x,
      y: r.y,
      w,
      h,
      sprite: src,
      label: labelForKind(r.kind),
      ...(requires ? { requires } : {}),
    };
  });
}

/** Ambil array id yang sudah dibersihkan (persisted). */
export function getCleanedIds() {
  return loadJSON(LR_TRASH_KEY, []).map((v) => String(v));
}

/** Tandai satu item sudah dibersihkan (persist). */
export function markTrashClean(id) {
  const cleaned = getCleanedIds();
  const next = pushUniqueToArray(cleaned, String(id));
  saveJSON(LR_TRASH_KEY, next);
}

/** Reset progres (buat debug). */
export function resetLivingroomTrash() {
  saveJSON(LR_TRASH_KEY, []);
}

/**
 * Load daftar aktif:
 * - hide item yang sudah dibersihkan
 * - hide item yang punya `requires` tapi syaratnya belum selesai (contoh remote menunggu majalah)
 */
export function loadLivingroomTrash() {
  const all = getAllLivingroomTrash();
  const cleaned = new Set(getCleanedIds());

  return all.filter((it) => {
    if (cleaned.has(String(it.id))) return false;
    if (it.requires != null && !cleaned.has(String(it.requires))) return false;
    return true;
  });
}

/** Progress & checklist berdasarkan rect overlay (bukan hardcode) */
export function computeProgress() {
  const all = getAllLivingroomTrash();     // total berdasarkan overlay
  const cleaned = new Set(getCleanedIds());

  const total = all.length;
  const cleanedCount = all.filter((it) => cleaned.has(String(it.id))).length;
  const percent = total > 0 ? Math.round((cleanedCount / total) * 100) : 100;

  // Rekap per kategori
  const byTypeTotal = {};
  const byTypeCleaned = {};
  for (const it of all) {
    byTypeTotal[it.type] = (byTypeTotal[it.type] || 0) + 1;
    if (cleaned.has(String(it.id))) {
      byTypeCleaned[it.type] = (byTypeCleaned[it.type] || 0) + 1;
    }
  }

  const checklist = {
    dust:        { done: byTypeCleaned.dust || 0,        total: byTypeTotal.dust || 0,        label: "Sapu debu" },
    corner_dust: { done: byTypeCleaned.corner_dust || 0, total: byTypeTotal.corner_dust || 0, label: "Bersihkan debu pojok" },
    paper:       { done: byTypeCleaned.paper || 0,       total: byTypeTotal.paper || 0,       label: "Ambil kertas" },
    snack:       { done: byTypeCleaned.snack || 0,       total: byTypeTotal.snack || 0,       label: "Ambil bungkus snack" },
    stain:       { done: byTypeCleaned.stain || 0,       total: byTypeTotal.stain || 0,       label: "Lap noda" },
    cobweb:      { done: byTypeCleaned.cobweb || 0,      total: byTypeTotal.cobweb || 0,      label: "Bersihkan sarang laba-laba" },
    magazine:    { done: byTypeCleaned.magazine || 0,    total: byTypeTotal.magazine || 0,    label: "Rapikan majalah" },
    remote:      { done: byTypeCleaned.remote || 0,      total: byTypeTotal.remote || 0,      label: "Temukan remote" },
    plant_dry:   { done: byTypeCleaned.plant_dry || 0,   total: byTypeTotal.plant_dry || 0,   label: "Rapikan tanaman kering" },
  };

  return { percent, total, cleaned: cleanedCount, checklist };
}

/**
 * Setelah bersihin item (mis. majalah), cari item yang baru "unlock"
 * (contoh: remote yang requires majalah itu).
 */
export function getNewlyUnlockedItems(previousCleanId) {
  const all = getAllLivingroomTrash();
  const cleaned = new Set(getCleanedIds());
  const prev = String(previousCleanId);

  return all.filter((it) => {
    if (cleaned.has(String(it.id))) return false;
    if (it.requires == null) return false;
    return String(it.requires) === prev && cleaned.has(prev);
  });
}
