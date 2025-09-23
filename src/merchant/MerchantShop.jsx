import { useMemo, useState } from "react";
import "./styles/merchant.css";
import Toast from "./Toast.jsx";
import { CATEGORIES } from "./merchantCatalog.js";
import { getIsFirstTime, markSeen } from "./useMerchantFlags.js";

/** Format rupiah */
const rp = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function MerchantShop({
  open,
  onClose,
  money = 0,
  setMoney = () => {},
  hasItem = () => false,
  addItem = () => {},
}) {
  const [tab, setTab] = useState("tools"); // tools | foods | drinks
  const [toast, setToast] = useState({ show: false, text: "" });
  const firstTime = useMemo(() => getIsFirstTime(), []);
  const [showIntro, setShowIntro] = useState(firstTime);

  if (!open) return null;

  function buy(item) {
    if (hasItem(item.id)) return;
    if (money < item.price) {
      setToast({ show: true, text: "Uang tidak cukup!" });
      return;
    }
    setMoney(money - item.price);
    addItem(item.id);
    setToast({ show: true, text: "Barang berhasil dibeli" });
  }

  function renderItemCard(item) {
    const owned = hasItem(item.id);
    return (
      <div key={item.id} className="card">
        <div className="card-top">
          <div className={`badge ${item.rarity || "common"}`}>
            {(item.rarity || "common").toUpperCase()}
          </div>
          <div className="price">{rp(item.price)}</div>
        </div>
        <div className="item-name">{item.name}</div>
        <div className="desc">
          {item.speedMul ? `+${Math.round(item.speedMul * 100)}% kecepatan bersih` : null}
          {item.hunger ? `Hunger +${item.hunger}` : null}
          {item.thirst ? `Thirst +${item.thirst}` : null}
        </div>

        <button
          className={`btn-pixel ${owned ? "btn-owned" : ""}`}
          onClick={() => buy(item)}
          disabled={owned}
        >
          {owned ? "Sudah dimiliki" : "Bayar"}
        </button>
      </div>
    );
  }

  const activeCat = CATEGORIES.find((c) => c.key === tab) ?? CATEGORIES[0];

  return (
    <div className="merchant-backdrop" onMouseDown={onClose}>
      <div className="merchant-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header">
          <div className="title">Toko Pak Eka</div>
          <div className="money">Saldo: <b>{rp(money)}</b></div>
        </div>

        {showIntro ? (
          <div className="intro">
            <p>“Warga baru ya, mas? Selamat datang di Harapan Village.”</p>
            <p>“Kalau butuh alat atau cemilan, belanja di sini aja.”</p>
            <button
              className="btn-pixel"
              onClick={() => {
                setShowIntro(false);
                markSeen();
              }}
            >
              Buka Toko
            </button>
          </div>
        ) : (
          <>
            <div className="tabs">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={`tab ${tab === c.key ? "active" : ""}`}
                  onClick={() => setTab(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid">{activeCat.items.map(renderItemCard)}</div>
          </>
        )}

        <div className="footer">
          <button className="btn-pixel" onClick={onClose}>
            Tutup
          </button>
        </div>

        {toast.show && (
          <Toast
            text={toast.text}
            show={toast.show}
            onDone={() => setToast({ show: false, text: "" })}
          />
        )}
      </div>
    </div>
  );
}
