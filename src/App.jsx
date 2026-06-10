import { useState, useEffect } from "react";

const FINAL_VALUE_FEE = 0.136;
const PER_ORDER_FEE = 0.40;
const CLARK_COUNTY_TAX = 0.08375;

function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val || 0);
}

function FeeRow({ label, amount, accent, small, bold, green }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: small ? "10px 0" : "14px 0",
      borderBottom: "1px solid #1e2433",
    }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: small ? "13px" : "15px",
        color: accent ? "#94a3b8" : "#cbd5e1",
        fontWeight: bold ? "600" : "400",
        letterSpacing: "0.01em",
      }}>{label}</span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: small ? "13px" : "15px",
        color: green ? "#34d399" : accent ? "#f87171" : bold ? "#f1f5f9" : "#e2e8f0",
        fontWeight: bold ? "700" : "500",
      }}>{amount}</span>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 8px",
        background: active ? "#1a2e4a" : "transparent",
        border: "none",
        borderRadius: "10px",
        color: active ? "#60a5fa" : "#334155",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.03em",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function DiscountToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
      {[20, 40].map((pct) => (
        <button
          key={pct}
          onClick={() => onChange(pct)}
          style={{
            flex: 1,
            padding: "14px",
            background: value === pct ? (pct === 40 ? "#0c2a1e" : "#1a1a2e") : "#131929",
            border: `1.5px solid ${value === pct ? (pct === 40 ? "#34d399" : "#818cf8") : "#1e2a3a"}`,
            borderRadius: "14px",
            color: value === pct ? (pct === 40 ? "#34d399" : "#818cf8") : "#334155",
            fontSize: "20px",
            fontWeight: "700",
            fontFamily: "'DM Mono', monospace",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {pct}% OFF
        </button>
      ))}
    </div>
  );
}

// ── TAB 1: eBay Fee Calculator ──────────────────────────────────────────────
function EbayTab() {
  const [sellPrice, setSellPrice] = useState("");
  const [shippingCharge, setShippingCharge] = useState("");
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const sp = parseFloat(sellPrice) || 0;
    const sc = parseFloat(shippingCharge) || 0;
    if (sp <= 0) { setResults(null); return; }
    const totalSale = sp + sc;
    const fvf = totalSale * FINAL_VALUE_FEE;
    const totalFees = fvf + PER_ORDER_FEE;
    const youReceive = totalSale - totalFees;
    const effectiveRate = (totalFees / totalSale) * 100;
    setResults({ totalSale, fvf, totalFees, youReceive, effectiveRate });
  }, [sellPrice, shippingCharge]);

  const inputStyle = (field) => ({
    width: "100%",
    background: active === field ? "#1a2235" : "#131929",
    border: `1.5px solid ${active === field ? "#3b82f6" : "#1e2a3a"}`,
    borderRadius: "14px",
    padding: "16px 18px 16px 44px",
    color: "#f1f5f9",
    fontSize: "18px",
    fontFamily: "'DM Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    WebkitAppearance: "none",
    appearance: "none",
  });

  return (
    <div style={{ width: "100%", maxWidth: "480px", padding: "24px 20px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Item Sale Price
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "16px", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>$</span>
            <input type="number" inputMode="decimal" placeholder="0.00" value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              onFocus={() => setActive("sell")} onBlur={() => setActive(null)}
              style={inputStyle("sell")} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Shipping Charged to Buyer
            <span style={{ fontWeight: "400", textTransform: "none", color: "#334155", marginLeft: "6px" }}>(fees apply here too)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "16px", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>$</span>
            <input type="number" inputMode="decimal" placeholder="0.00" value={shippingCharge}
              onChange={(e) => setShippingCharge(e.target.value)}
              onFocus={() => setActive("ship")} onBlur={() => setActive(null)}
              style={inputStyle("ship")} />
          </div>
        </div>
      </div>

      {results ? (
        <div style={{ background: "#0f1929", borderRadius: "20px", border: "1px solid #1e2a3a", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", background: "#111e30", borderBottom: "1px solid #1e2a3a" }}>
            <div style={{ fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>eBay Total Sale Base</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "28px", fontWeight: "700", color: "#f1f5f9" }}>{formatCurrency(results.totalSale)}</div>
            <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>Item + shipping · fees applied to this amount</div>
          </div>
          <div style={{ padding: "4px 20px 0" }}>
            <FeeRow label="Final Value Fee (13.6%)" amount={`− ${formatCurrency(results.fvf)}`} accent />
            <FeeRow label="Per-Order Fee (fixed)" amount={`− ${formatCurrency(PER_ORDER_FEE)}`} accent small />
            <FeeRow label={`Total eBay Takes (${results.effectiveRate.toFixed(1)}%)`} amount={`− ${formatCurrency(results.totalFees)}`} bold />
          </div>
          <div style={{ margin: "16px 20px 20px", background: "linear-gradient(135deg, #0c2a1e 0%, #0a1f2e 100%)", border: "1px solid #1a3a28", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#34d399", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>You Receive</div>
              <div style={{ fontSize: "12px", color: "#1e4d38" }}>before your own shipping cost</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "30px", fontWeight: "700", color: "#34d399" }}>{formatCurrency(results.youReceive)}</div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#0f1929", borderRadius: "20px", border: "1px dashed #1e2a3a", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>👟</div>
          <div style={{ color: "#334155", fontSize: "14px", lineHeight: 1.6 }}>Enter a sale price above<br />to calculate your eBay fees</div>
        </div>
      )}

      <div style={{ marginTop: "24px", background: "#0f1929", borderRadius: "14px", border: "1px solid #1e2a3a", padding: "16px 18px" }}>
        <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Fee Rules Applied</div>
        {[
          ["Final Value Fee", "13.6% of total sale (item + shipping)"],
          ["Per-Order Fee", "$0.40 flat on every transaction"],
          ["Price Threshold", "Under $150 — standard rate applies"],
          ["Insertion Fee", "Free (250 listings/month included)"],
        ].map(([rule, desc]) => (
          <div key={rule} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1e3a5f", marginTop: "6px", flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>{rule}: </span>
              <span style={{ fontSize: "12px", color: "#475569" }}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 2: Buy Price Calculator ─────────────────────────────────────────────
function BuyTab() {
  const [retailPrice, setRetailPrice] = useState("");
  const [discount, setDiscount] = useState(40);
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const rp = parseFloat(retailPrice) || 0;
    if (rp <= 0) { setResults(null); return; }
    const discountAmt = rp * (discount / 100);
    const priceAfterDiscount = rp - discountAmt;
    const taxAmt = priceAfterDiscount * CLARK_COUNTY_TAX;
    const totalYouPay = priceAfterDiscount + taxAmt;
    setResults({ discountAmt, priceAfterDiscount, taxAmt, totalYouPay });
  }, [retailPrice, discount]);

  const inputStyle = (field) => ({
    width: "100%",
    background: active === field ? "#1a2235" : "#131929",
    border: `1.5px solid ${active === field ? "#3b82f6" : "#1e2a3a"}`,
    borderRadius: "14px",
    padding: "16px 18px 16px 44px",
    color: "#f1f5f9",
    fontSize: "18px",
    fontFamily: "'DM Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    WebkitAppearance: "none",
    appearance: "none",
  });

  return (
    <div style={{ width: "100%", maxWidth: "480px", padding: "24px 20px 0" }}>

      <DiscountToggle value={discount} onChange={setDiscount} />

      <div style={{ marginBottom: "28px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
          Retail Tag Price
        </label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "16px", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>$</span>
          <input type="number" inputMode="decimal" placeholder="0.00" value={retailPrice}
            onChange={(e) => setRetailPrice(e.target.value)}
            onFocus={() => setActive("retail")} onBlur={() => setActive(null)}
            style={inputStyle("retail")} />
        </div>
      </div>

      {results ? (
        <div style={{ background: "#0f1929", borderRadius: "20px", border: "1px solid #1e2a3a", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", background: "#111e30", borderBottom: "1px solid #1e2a3a" }}>
            <div style={{ fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
              Retail Tag Price
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "28px", fontWeight: "700", color: "#f1f5f9" }}>{formatCurrency(parseFloat(retailPrice))}</div>
            <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>Ross / DD's tagged price</div>
          </div>

          <div style={{ padding: "4px 20px 0" }}>
            <FeeRow label={`${discount}% Discount`} amount={`− ${formatCurrency(results.discountAmt)}`} accent />
            <FeeRow label="Price After Discount" amount={formatCurrency(results.priceAfterDiscount)} small />
            <FeeRow label="Clark County Tax (8.375%)" amount={`+ ${formatCurrency(results.taxAmt)}`} accent />
          </div>

          <div style={{ margin: "16px 20px 20px", background: "linear-gradient(135deg, #1a0e2e 0%, #0a1a2e 100%)", border: "1px solid #2a1a4a", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>You Pay at Register</div>
              <div style={{ fontSize: "12px", color: "#2d1f4e" }}>your real cost · all-in</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "30px", fontWeight: "700", color: "#a78bfa" }}>{formatCurrency(results.totalYouPay)}</div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#0f1929", borderRadius: "20px", border: "1px dashed #1e2a3a", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏷️</div>
          <div style={{ color: "#334155", fontSize: "14px", lineHeight: 1.6 }}>Enter the tag price above<br />to calculate your real cost</div>
        </div>
      )}

      <div style={{ marginTop: "24px", background: "#0f1929", borderRadius: "14px", border: "1px solid #1e2a3a", padding: "16px 18px" }}>
        <div style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>How This Works</div>
        {[
          ["Discount", "Applied first to the retail tag price"],
          ["Sales Tax", "Clark County, NV — 8.375%"],
          ["Tax Base", "Calculated on discounted price, not retail"],
          ["Store", "Ross / DD's Discounts, Las Vegas"],
        ].map(([rule, desc]) => (
          <div key={rule} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2e1a5f", marginTop: "6px", flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600" }}>{rule}: </span>
              <span style={{ fontSize: "12px", color: "#475569" }}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("ebay");

  return (
    <div style={{ minHeight: "100dvh", background: "#0b1120", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "48px", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ width: "100%", background: "linear-gradient(180deg, #0f1a2e 0%, #0b1120 100%)", padding: "52px 24px 20px", borderBottom: "1px solid #1e2433" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
          <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Retail Arbitrage · Las Vegas
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#f1f5f9", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          Flip Calculator
        </h1>
        <p style={{ margin: "6px 0 16px", fontSize: "13px", color: "#475569" }}>Athletic Shoes · Under $150</p>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#0b1120", border: "1px solid #1e2433", borderRadius: "12px", padding: "4px", gap: "4px" }}>
          <TabButton label="💸  eBay Fees" active={tab === "ebay"} onClick={() => setTab("ebay")} />
          <TabButton label="🏷️  Buy Price" active={tab === "buy"} onClick={() => setTab("buy")} />
        </div>
      </div>

      {tab === "ebay" ? <EbayTab /> : <BuyTab />}

      <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#1e2a3a" }}>
        OkuClean Tools · Ross / DD's · Clark County NV
      </div>
    </div>
  );
}
