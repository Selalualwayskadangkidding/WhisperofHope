// src/components/MoneyText.jsx
import { useMoney } from "../state/money.js";

/**
 * Komponen tampilan saldo uang yang selalu sinkron di semua scene.
 *
 * Props:
 * - prefix   : string di depan nominal (default: "Saldo:")
 * - className: kelas CSS tambahan (opsional)
 * - style    : inline style (opsional)
 * - locale   : locale untuk format angka (default: "id-ID")
 */
export default function MoneyText({
  prefix = "Saldo:",
  className,
  style,
  locale = "id-ID",
}) {
  const { money } = useMoney();

  return (
    <div className={className} style={style}>
      {prefix ? `${prefix} ` : ""}
      {/* Format angka uang: Rp 100.000 */}
      Rp {Number(money).toLocaleString(locale)}
    </div>
  );
}
