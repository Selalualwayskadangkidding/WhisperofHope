// src/App.jsx
import { useState } from "react";

import MenuScreen from "./scenes/MenuScreen";
import IntroScene from "./scenes/IntroScene";
import YardScene from "./scenes/YardScene";
import LivingRoomScene from "./scenes/LivingRoomScene";
import HallwayScene from "./scenes/HallwayScene";

// ========== Tambahan: import tujuan pintu hallway ==========
import RoomKakakScene from "./scenes/RoomKakakScene";
import RoomOrtuScene from "./scenes/RoomOrtuScene";
import KitchenScene from "./scenes/KitchenScene";
import BathroomScene from "./scenes/BathroomScene"; // kamar mandi

export default function App() {
  // mulai dari menu
  const [scene, setScene] = useState("menu");

  // Helper: balik ke hallway dan spawn di pintu yang benar (id 7/8/9/10)
  function goToHallwayFrom(doorId) {
    localStorage.setItem("hv_next_spawn_id", String(doorId));
    setScene("hallway");
  }

  return (
    <>
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
          onEnterHouse={() => setScene("LivingRoomScene")} // Tekan E di pintu rumah
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
    </>
  );
}
