// src/App.jsx
import { useEffect, useState } from "react";

import MenuScreen from "./scenes/MenuScreen";
import IntroScene from "./scenes/IntroScene";
import YardScene from "./scenes/YardScene";
import LivingRoomScene from "./scenes/LivingRoomScene";
import HallwayScene from "./scenes/HallwayScene";

// Tujuan pintu hallway
import RoomKakakScene from "./scenes/RoomKakakScene";
import RoomOrtuScene from "./scenes/RoomOrtuScene";
import KitchenScene from "./scenes/KitchenScene";
import BathroomScene from "./scenes/BathroomScene";

// ====== Kunci & Inventori (sesuai project lu) ======
import locks from "./mechanics/locks";
// 👉 pakai provider inventori yang tadi kita bikin
import { InventoryProvider } from "./state/inventoryProvider.jsx";

// ====== Status Bar (Lapar / Haus / Uang) ======
import { PlayerProvider } from "./state/player.jsx";
import StatusHUD from "./components/StatusHUD.jsx";

export default function App() {
  // mulai dari menu (ikut kode lama lu)
  const [scene, setScene] = useState("menu");

  // init locks 1x (pindahin dari render ke effect biar gak ke-init tiap render)
  useEffect(() => {
    locks.initLocks({
      doors: {
        // contoh: sesuaikan sama sistem kamu
        frontdoor: { locked: true, requiredKeyId: "key_front" },
        yard_to_lr: { locked: true, requiredKeyId: "key_house" },
      },
    });
  }, []);

  // Helper: balik ke hallway dan spawn di pintu yang benar (id 7/8/9/10)
  function goToHallwayFrom(doorId) {
    localStorage.setItem("hv_next_spawn_id", String(doorId));
    setScene("hallway");
  }

  // ====== StatusHUD config ======
  // HUD disembunyikan di menu & intro (kalau mau tampil, set ke false)
  const hudHidden = scene === "menu" || scene === "intro";

  // Pemetaan nama scene (pakai string-string yang ADA di kode lu)
  // → ke "tema" yang dipakai StatusHUD
  const sceneToTheme = {
    yard: "yard",
    hallway: "hallway",
    LivingRoomScene: "livingroom", // nama state lu PascalCase, HUD cukup tahu temanya "livingroom"
    RoomKakakScene: "roomkakak",
    RoomOrtuScene: "roomortu",
    KitchenScene: "kitchen",
    BathroomScene: "bathroom",
  };
  const hudTheme = sceneToTheme[scene] ?? "default";

  return (
    <PlayerProvider>
      <InventoryProvider>
        {/* HUD global: selalu nempel, warna ikut scene */}
        <StatusHUD scene={hudTheme} hidden={hudHidden} />

        {scene === "menu" && (
          <MenuScreen
            onStartNew={() => setScene("intro")}
            onGoHallway={() => setScene("hallway")} // tombol cepat ke hallway
            onExit={() => console.log("Keluar game")}
          />
        )}

        {scene === "intro" && <IntroScene onFinish={() => setScene("yard")} />}

        {scene === "yard" && (
          <YardScene
            onBackMenu={() => setScene("menu")}
            // Tekan E di pintu rumah → pakai string lama lu biar nggak ngerusak alur
            onEnterHouse={() => setScene("LivingRoomScene")}
          />
        )}

        {scene === "LivingRoomScene" && (
          <LivingRoomScene
            onChangeScene={(name) => setScene(name)}
            onExitToYard={() => setScene("yard")}
            onExitToHallway={() => setScene("hallway")}
          />
        )}

        {scene === "hallway" && (
          <HallwayScene
            onBackLivingRoom={() => setScene("LivingRoomScene")}
            onEnterKamarKakak={() => setScene("RoomKakakScene")}
            onEnterKamarOrtu={() => setScene("RoomOrtuScene")}
            onEnterDapur={() => setScene("KitchenScene")}
            onEnterKamarMandi={() => setScene("BathroomScene")}
          />
        )}

        {/* ======== Tujuan dari pintu hallway ======== */}
        {scene === "RoomKakakScene" && (
          <RoomKakakScene onBackHallway={() => goToHallwayFrom(7)} />
        )}

        {scene === "RoomOrtuScene" && (
          <RoomOrtuScene onBackHallway={() => goToHallwayFrom(8)} />
        )}

        {scene === "KitchenScene" && (
          <KitchenScene onBackHallway={() => goToHallwayFrom(9)} />
        )}

        {scene === "BathroomScene" && (
          <BathroomScene onBackHallway={() => goToHallwayFrom(10)} />
        )}
      </InventoryProvider>
    </PlayerProvider>
  );
}
