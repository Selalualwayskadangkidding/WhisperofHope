// src/mechanics/useDoorEnter.js
import { useEffect, useRef } from "react";
import locks from "./locks";

/**
 * Listener tombol 'E' dengan cooldown + initial debounce.
 *
 * Props:
 * - enabled: boolean (true kalau player lagi di zona pintu/objek)
 * - onEnter: function() => dipanggil saat E ditekan dan enabled = true
 * - keyName: default 'e'
 * - cooldownMs: cegah spam trigger (default 400ms)
 * - initialDebounceMs: tunda penerimaan input setelah mount (default 250ms)
 *   → mencegah kasus "E masih kepencet" saat pindah scene.
 */
export default function useDoorEnter({
  enabled,
  onEnter,
  keyName = "e",
  cooldownMs = 400,
  initialDebounceMs = 250,
}) {
  const lastRef = useRef(0);
  const pressedRef = useRef(false);
  const readyAtRef = useRef(Date.now() + initialDebounceMs);

  useEffect(() => {
    // setiap kali hook dipasang ulang (scene baru), reset debounce awal
    readyAtRef.current = Date.now() + initialDebounceMs;
    // kalau toggle enabled ke false, anggap tombol dilepas biar gak nyangkut
    if (!enabled) pressedRef.current = false;
  }, [initialDebounceMs, enabled]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key?.toLowerCase() !== keyName) return;

      // tahan auto-repeat (holding)
      if (pressedRef.current) return;
      pressedRef.current = true;

      if (!enabled) return;

      const now = Date.now();
      if (now < readyAtRef.current) return; // tahan sebentar setelah mount
      if (now - lastRef.current < cooldownMs) return;

      lastRef.current = now;
      if (typeof onEnter === "function") onEnter();
    };

    const onKeyUp = (e) => {
      if (e.key?.toLowerCase() === keyName) pressedRef.current = false;
    };

    // kalau tab balik fokus, anggap tombol sudah dilepas
    const onVisibility = () => {
      if (!document.hidden) pressedRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, onEnter, keyName, cooldownMs]);
}

/**
 * Helper untuk bikin handler `onEnter` yang mengurus pintu terkunci:
 * - Kalau pintu TIDAK terkunci → langsung panggil onOpenDoor(doorId).
 * - Kalau TERKUNCI → paksa buka inventory, tunggu klik kunci yang benar,
 *   lalu unlock dan lanjut onOpenDoor.
 *
 * Pakai di scene:
 *   const onEnter = makeLockedDoorEnter({
 *     doorId: "yard_to_lr",
 *     onOpenDoor: (id) => setScene("livingroom"),
 *     openInventory: ({ initialSelectedId, onItemClick }) => { ... },
 *     closeInventory: () => { ... },
 *     // optional:
 *     requiredKeyId: "key_house",
 *     onWrongKey: () => toast("Bukan kunci untuk pintu ini"),
 *   });
 *   useDoorEnter({ enabled: inDoorZone, onEnter });
 */
export function makeLockedDoorEnter({
  doorId,
  onOpenDoor,
  openInventory,
  closeInventory,
  requiredKeyId, // optional; kalau tidak diisi, ambil dari locks.requiredKeyFor(doorId)
  onWrongKey,    // optional feedback saat salah kunci
}) {
  if (!doorId) throw new Error("makeLockedDoorEnter: 'doorId' wajib diisi");
  if (typeof onOpenDoor !== "function") throw new Error("makeLockedDoorEnter: 'onOpenDoor' wajib function");
  if (typeof openInventory !== "function") throw new Error("makeLockedDoorEnter: 'openInventory' wajib function");

  return function onEnterLockedDoor() {
    // jika tidak terkunci → langsung buka
    if (!locks.isLocked(doorId)) {
      onOpenDoor(doorId);
      return;
    }

    const needKey = requiredKeyId ?? locks.requiredKeyFor(doorId);

    // buka inventory dan minta player pilih kunci
    openInventory({
      initialSelectedId: needKey || null,
      disableBackdropClose: true, // paksa tetap terbuka sampai klik kunci yang benar
      onItemClick: (clickedId) => {
        // normalisasi id (kalau InventoryPanel ngasih object)
        const selId = typeof clickedId === "string" ? clickedId : clickedId?.id;

        if (selId && needKey && selId === needKey) {
          // unlock dan lanjut
          locks.unlock(doorId);
          closeInventory && closeInventory();
          // beri sedikit delay agar UI nutup dulu
          setTimeout(() => onOpenDoor(doorId), 60);
        } else {
          // salah kunci → kasih feedback (opsional), biarkan inventory tetap terbuka
          if (onWrongKey) onWrongKey();
        }
      },
    });
  };
}
