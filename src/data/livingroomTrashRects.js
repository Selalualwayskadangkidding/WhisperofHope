// src/data/livingroomTrashRects.js
// Daftar RECT "trash" untuk penempatan item kotor di Living Room.
// Dipakai DebugCollisionOverlay buat drag/drop & save ke localStorage.
import { loadJSON, saveJSON } from "../state/persist.js";

// Storage key khusus trash-rects living room
export const LR_TRASH_RECTS_KEY = "hv_lr_trash_rects_v1";

/**
 * Struktur rect:
 * {
 *   id: number, x, y, w, h,
 *   type: "trash",
 *   kind: "dust" | "stain" | "paper" | "snack" | "cobweb" | "magazine" | "remote" | "plant_dry"
 * }
 * Catatan:
 * - "kind" kita pakai nanti untuk memetakan ke sprite & perilaku.
 * - Silakan ubah/duplikasi sesuai kebutuhan di overlay.
 */
export function getDefaultLivingroomTrashRects() {
  return [
    { id: 1001, x: 77,  y: 380, w: 42, h: 26, type: "trash", kind: "paper" },
    { id: 1002, x: 585, y: 537, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1003, x: 421, y: 405, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1004, x: 351, y: 523, w: 40, h: 26, type: "trash", kind: "paper" },
    { id: 1005, x: 452, y: 174, w: 52, h: 32, type: "trash", kind: "stain" },
    { id: 1006, x: 563, y: 491, w: 40, h: 26, type: "trash", kind: "snack" },
    { id: 1007, x: 509, y: 428, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1008, x: 690, y: 470, w: 46, h: 28, type: "trash", kind: "dust" },

    { id: 1010, x: 760, y: 361, w: 44, h: 30, type: "trash", kind: "magazine" },
    { id: 1011, x: 640, y: 425, w: 32, h: 18, type: "trash", kind: "remote" },

    { id: 1020, x: 909, y: 499, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1021, x: 720, y: 565, w: 40, h: 26, type: "trash", kind: "paper" },
    { id: 1022, x: 186, y: 311, w: 52, h: 32, type: "trash", kind: "stain" },
    { id: 1023, x: 913, y: 248, w: 40, h: 26, type: "trash", kind: "snack" },
    { id: 1024, x: 280, y: 439, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1025, x: 355, y: 412, w: 46, h: 28, type: "trash", kind: "dust" },

    { id: 1030, x: 871, y: 648, w: 40, h: 26, type: "trash", kind: "paper" },
    { id: 1031, x: 1010, y: 640, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1032, x: 990, y: 590, w: 40, h: 26, type: "trash", kind: "snack" },
    { id: 1033, x: 1018, y: 483, w: 46, h: 28, type: "trash", kind: "dust" },

    { id: 1040, x: 301, y: 304, w: 44, h: 34, type: "trash", kind: "corner_dust" },
    { id: 1041, x: 1010, y: 388, w: 44, h: 34, type: "trash", kind: "corner_dust" },
    { id: 1042, x: 167, y: 557, w: 44, h: 34, type: "trash", kind: "corner_dust" },
    { id: 1043, x: 922, y: 387, w: 44, h: 34, type: "trash", kind: "corner_dust" },

    { id: 1050, x: 57,  y: 67,  w: 50, h: 38, type: "trash", kind: "cobweb" },
    { id: 1051, x: 662, y: 65,  w: 50, h: 38, type: "trash", kind: "cobweb" },
    { id: 1052, x: 1044, y: 71, w: 50, h: 38, type: "trash", kind: "cobweb" },

    { id: 1060, x: 64,  y: 327, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1061, x: 448, y: 536, w: 40, h: 26, type: "trash", kind: "paper" },
    { id: 1062, x: 374, y: 314, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1063, x: 528, y: 261, w: 52, h: 32, type: "trash", kind: "stain" },
    { id: 1064, x: 698, y: 211, w: 46, h: 28, type: "trash", kind: "dust" },
    { id: 1065, x: 683, y: 258, w: 40, h: 26, type: "trash", kind: "paper" },
    { id: 1066, x: 230, y: 520, w: 46, h: 28, type: "trash", kind: "dust" },

    { id: 1070, x: 1062, y: 274, w: 50, h: 56, type: "trash", kind: "plant_dry" },
  ];
}


/** load rects dari localStorage, fallback ke default */
export function loadLivingroomTrashRects() {
  return loadJSON(LR_TRASH_RECTS_KEY, getDefaultLivingroomTrashRects());
}

/** simpan rects baru ke localStorage */
export function saveLivingroomTrashRects(rects) {
  saveJSON(LR_TRASH_RECTS_KEY, rects);
}