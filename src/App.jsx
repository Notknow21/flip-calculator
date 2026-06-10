import { useState, useEffect, useRef } from "react";

const FINAL_VALUE_FEE = 0.136;
const PER_ORDER_FEE = 0.40;
const CLARK_COUNTY_TAX = 0.08375;
const DEFAULT_SHIPPING = 12;
const STORAGE_KEY = "flip_calc_items_v2";
const CLOUDINARY_CLOUD = "drtr9aos3";
const CLOUDINARY_PRESET = "Flip Calculator";

function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(val || 0);
}
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${m}/${day}/${y}`;
}
function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveItems(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function TabButton({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "11px 4px", position: "relative",
      background: active ? "#1a2e4a" : "transparent", border: "none",
      borderRadius: "10px", color: active ? "#60a5fa" : "#334155",
      fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
    }}>
      {label}
      {badge > 0 && <span style={{ position: "absolute", top: "5px", right: "6px", background: "#3b82f6", color: "#fff", fontSize: "9px", fontWeight: "700", borderRadius: "99px", padding: "1px 5px" }}>{badge}</span>}
    </button>
  );
}

function SectionLabel({ text, color = "#475569" }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: "700", color, letterSpacing: "0.1em", textTransform: "uppercase", margin: "20px 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "1px", background: "#1e2433" }} />
      {text}
      <div style={{ flex: 1, height: "1px", background: "#1e2433" }} />
    </div>
  );
}

function DiscountToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      {[20, 40].map((pct) => (
        <button key={pct} onClick={() => onChange(pct)} style={{
          flex: 1, padding: "13px",
          background: value === pct ? (pct === 40 ? "#0c2a1e" : "#1a1a2e") : "#131929",
          border: `1.5px solid ${value === pct ? (pct === 40 ? "#34d399" : "#818cf8") : "#1e2a3a"}`,
          borderRadius: "14px", color: value === pct ? (pct === 40 ? "#34d399" : "#818cf8") : "#334155",
          fontSize: "18px", fontWeight: "700", fontFamily: "monospace", cursor: "pointer", transition: "all 0.2s",
        }}>{pct}% OFF</button>
      ))}
    </div>
  );
}

function NumberInput({ label, sublabel, field, active, setActive, value, onChange }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>
        {label}{sublabel && <span style={{ fontWeight: "400", textTransform: "none", color: "#334155", marginLeft: "6px" }}>{sublabel}</span>}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "15px", fontFamily: "monospace", pointerEvents: "none" }}>$</span>
        <input type="number" inputMode="decimal" placeholder="0.00" value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setActive(field)} onBlur={() => setActive(null)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: active === field ? "#1a2235" : "#131929",
            border: `1.5px solid ${active === field ? "#3b82f6" : "#1e2a3a"}`,
            borderRadius: "14px", padding: "15px 16px 15px 40px",
            color: "#f1f5f9", fontSize: "17px", fontFamily: "monospace",
            outline: "none", transition: "border-color 0.2s", WebkitAppearance: "none", appearance: "none",
          }} />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: focused ? "#1a2235" : "#131929",
          border: `1.5px solid ${focused ? "#3b82f6" : "#1e2a3a"}`,
          borderRadius: "14px", padding: "14px 16px",
          color: "#f1f5f9", fontSize: "15px", outline: "none", transition: "border-color 0.2s",
        }} />
    </div>
  );
}

function FeeRow({ label, amount, accent, small, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: small ? "9px 0" : "13px 0", borderBottom: "1px solid #1e2433" }}>
      <span style={{ fontFamily: "monospace", fontSize: small ? "12px" : "14px", color: accent ? "#94a3b8" : "#cbd5e1", fontWeight: bold ? "600" : "400" }}>{label}</span>
      <span style={{ fontFamily: "monospace", fontSize: small ? "12px" : "14px", color: accent ? "#f87171" : bold ? "#f1f5f9" : "#e2e8f0", fontWeight: bold ? "700" : "500" }}>{amount}</span>
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div style={{ background: "#0f1929", borderRadius: "20px", border: "1px dashed #1e2a3a", padding: "44px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "30px", marginBottom: "10px" }}>{emoji}</div>
      <div style={{ color: "#334155", fontSize: "13px", lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

function RangePriceInput({ label, icon, minVal, maxVal, onMinChange, onMaxChange }) {
  const [fMin, setFMin] = useState(false);
  const [fMax, setFMax] = useState(false);
  const inp = (focused) => ({
    flex: 1, boxSizing: "border-box",
    background: focused ? "#1a2235" : "#131929",
    border: `1.5px solid ${focused ? "#3b82f6" : "#1e2a3a"}`,
    borderRadius: "10px", padding: "12px 12px 12px 26px",
    color: "#f1f5f9", fontSize: "15px", fontFamily: "monospace",
    outline: "none", transition: "border-color 0.2s", WebkitAppearance: "none", appearance: "none",
  });
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>{icon} {label}</label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "13px", fontFamily: "monospace", pointerEvents: "none" }}>$</span>
          <input type="number" inputMode="decimal" placeholder="Min" value={minVal} onChange={(e) => onMinChange(e.target.value)} onFocus={() => setFMin(true)} onBlur={() => setFMin(false)} style={inp(fMin)} />
        </div>
        <span style={{ color: "#334155", fontSize: "13px" }}>—</span>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "13px", fontFamily: "monospace", pointerEvents: "none" }}>$</span>
          <input type="number" inputMode="decimal" placeholder="Max" value={maxVal} onChange={(e) => onMaxChange(e.target.value)} onFocus={() => setFMax(true)} onBlur={() => setFMax(false)} style={inp(fMax)} />
        </div>
      </div>
    </div>
  );
}

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
function PhotoUpload({ photoUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("folder", "flip_calculator");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) { onUploaded(data.secure_url); }
      else { setError("Upload failed. Check your Cloudinary preset."); }
    } catch { setError("Network error during upload."); }
    setUploading(false);
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Item Photo</label>
      {photoUrl ? (
        <div style={{ position: "relative" }}>
          <img src={photoUrl} alt="Item" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "14px", border: "1.5px solid #1e2a3a", display: "block" }} />
          <button onClick={() => onUploaded("")} style={{
            position: "absolute", top: "8px", right: "8px", background: "#0b1120cc",
            border: "1px solid #334155", borderRadius: "8px", color: "#f87171",
            fontSize: "11px", fontWeight: "700", padding: "4px 10px", cursor: "pointer",
          }}>Remove</button>
        </div>
      ) : (
        <button onClick={() => fileRef.current.click()} disabled={uploading} style={{
          width: "100%", padding: "28px 16px", borderRadius: "14px",
          background: "#131929", border: "1.5px dashed #1e2a3a",
          color: uploading ? "#334155" : "#475569", fontSize: "13px",
          cursor: uploading ? "not-allowed" : "pointer", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "24px" }}>{uploading ? "⏳" : "📷"}</span>
          <span>{uploading ? "Uploading..." : "Tap to take photo or choose from library"}</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      {error && <div style={{ fontSize: "11px", color: "#f87171", marginTop: "6px" }}>{error}</div>}
    </div>
  );
}

// ── LOCATION PICKER ───────────────────────────────────────────────────────────
function LocationPicker({ location, onLocationChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [focused, setFocused] = useState(false);

  async function detectLocation() {
    if (!navigator.geolocation) { setError("GPS not available on this device."); return; }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          onLocationChange(addr);
          setEditing(false);
        } catch {
          onLocationChange(`GPS detected`);
        }
        setLoading(false);
      },
      () => { setError("GPS access denied. Enter manually."); setLoading(false); setEditing(true); }
    );
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Location</label>

      {!location && !editing ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={detectLocation} disabled={loading} style={{
            flex: 1, padding: "14px", borderRadius: "14px",
            background: loading ? "#131929" : "#0f1929",
            border: "1.5px solid #1e2a3a", color: loading ? "#334155" : "#60a5fa",
            fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            <span>{loading ? "⏳" : "📍"}</span>
            <span>{loading ? "Detecting..." : "Use My Location"}</span>
          </button>
          <button onClick={() => setEditing(true)} style={{
            padding: "14px 16px", borderRadius: "14px",
            background: "#131929", border: "1.5px solid #1e2a3a",
            color: "#475569", fontSize: "13px", cursor: "pointer",
          }}>✏️</button>
        </div>
      ) : (
        <div>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="Store name or address" value={location} onChange={(e) => onLocationChange(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: focused ? "#1a2235" : "#131929",
                border: `1.5px solid ${focused ? "#3b82f6" : "#1e2a3a"}`,
                borderRadius: "14px", padding: "14px 44px 14px 16px",
                color: "#f1f5f9", fontSize: "14px", outline: "none", transition: "border-color 0.2s",
              }} />
            <button onClick={() => { onLocationChange(""); setEditing(false); }} style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "16px",
            }}>×</button>
          </div>
          <button onClick={detectLocation} disabled={loading} style={{
            marginTop: "6px", background: "none", border: "none",
            color: loading ? "#334155" : "#3b82f6", fontSize: "11px",
            fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", padding: "0",
          }}>
            {loading ? "⏳ Detecting..." : "📍 Use GPS instead"}
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: "11px", color: "#f87171", marginTop: "6px" }}>{error}</div>}
    </div>
  );
}

// ── TAB 1: FULL FLIP ──────────────────────────────────────────────────────────
function FlipTab({ onBuildProfile }) {
  const [retailPrice, setRetailPrice] = useState("");
  const [discount, setDiscount] = useState(40);
  const [ebayPrice, setEbayPrice] = useState("");
  const [shippingCost, setShippingCost] = useState(String(DEFAULT_SHIPPING));
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const rp = parseFloat(retailPrice) || 0;
    const ep = parseFloat(ebayPrice) || 0;
    const sc = parseFloat(shippingCost) || 0;
    if (rp <= 0 || ep <= 0) { setResults(null); return; }
    const discountAmt = rp * (discount / 100);
    const priceAfterDiscount = rp - discountAmt;
    const taxAmt = priceAfterDiscount * CLARK_COUNTY_TAX;
    const totalCost = priceAfterDiscount + taxAmt;
    const fvf = ep * FINAL_VALUE_FEE;
    const totalEbayFees = fvf + PER_ORDER_FEE;
    const youReceive = ep - totalEbayFees;
    const netProfit = youReceive - totalCost - sc;
    const roi = (netProfit / totalCost) * 100;
    const worthIt = netProfit > 0 && roi >= 30;
    setResults({ discountAmt, priceAfterDiscount, taxAmt, totalCost, fvf, totalEbayFees, youReceive, sc, netProfit, roi, worthIt, retailPrice: rp, ebayPrice: ep, discount, shippingCost: sc });
  }, [retailPrice, discount, ebayPrice, shippingCost]);

  return (
    <div style={{ width: "100%", maxWidth: "480px", padding: "22px 20px 0", boxSizing: "border-box" }}>
      <DiscountToggle value={discount} onChange={setDiscount} />
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
        <NumberInput label="Retail Tag Price" field="retail" active={active} setActive={setActive} value={retailPrice} onChange={setRetailPrice} />
        <NumberInput label="eBay Sale Price" sublabel="(listing price)" field="ebay" active={active} setActive={setActive} value={ebayPrice} onChange={setEbayPrice} />
        <NumberInput label="Your Shipping Cost" sublabel="(default $12)" field="ship" active={active} setActive={setActive} value={shippingCost} onChange={setShippingCost} />
      </div>

      {results ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            borderRadius: "16px", padding: "16px 20px",
            background: results.worthIt ? "linear-gradient(135deg, #0c2a1e 0%, #0a1f2e 100%)" : "linear-gradient(135deg, #2a0e0e 0%, #1a0a1e 100%)",
            border: `1.5px solid ${results.worthIt ? "#34d399" : "#f87171"}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: results.worthIt ? "#34d399" : "#f87171", marginBottom: "2px" }}>
                {results.worthIt ? "✅ Worth the Pickup" : results.netProfit > 0 ? "⚠️ Low Margin" : "❌ Skip This One"}
              </div>
              <div style={{ fontSize: "11px", color: results.worthIt ? "#1e4d38" : "#4d1e1e" }}>
                {results.netProfit > 0 ? `ROI: ${results.roi.toFixed(0)}% — threshold is 30%` : "You'd lose money on this flip"}
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "28px", fontWeight: "700", color: results.worthIt ? "#34d399" : results.netProfit > 0 ? "#fbbf24" : "#f87171" }}>
              {formatCurrency(results.netProfit)}
            </div>
          </div>

          <div style={{ background: "#0f1929", borderRadius: "16px", border: "1px solid #1e2a3a", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#0d1525", borderBottom: "1px solid #1e2a3a" }}>
              <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>🏷️ Buy Side — Ross / DD's</span>
            </div>
            <div style={{ padding: "2px 16px 4px" }}>
              <FeeRow label="Tag Price" amount={formatCurrency(results.retailPrice)} small />
              <FeeRow label={`− ${discount}% Discount`} amount={`− ${formatCurrency(results.discountAmt)}`} accent small />
              <FeeRow label="+ Tax (8.375%)" amount={`+ ${formatCurrency(results.taxAmt)}`} accent small />
              <FeeRow label="Your Cost" amount={formatCurrency(results.totalCost)} bold small />
            </div>
          </div>

          <div style={{ background: "#0f1929", borderRadius: "16px", border: "1px solid #1e2a3a", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#0d1525", borderBottom: "1px solid #1e2a3a" }}>
              <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>💸 Sell Side — eBay</span>
            </div>
            <div style={{ padding: "2px 16px 4px" }}>
              <FeeRow label="Sale Price" amount={formatCurrency(results.ebayPrice)} small />
              <FeeRow label="− eBay 13.6%" amount={`− ${formatCurrency(results.fvf)}`} accent small />
              <FeeRow label="− Per-Order Fee" amount={`− ${formatCurrency(PER_ORDER_FEE)}`} accent small />
              <FeeRow label="− Your Shipping" amount={`− ${formatCurrency(results.sc)}`} accent small />
              <FeeRow label="You Receive" amount={formatCurrency(results.youReceive - results.sc)} bold small />
            </div>
          </div>

          <div style={{ background: "#0f1929", borderRadius: "16px", border: "1px solid #1e2a3a", padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "#475569" }}>Total Cost (buy + ship)</span>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#f87171" }}>− {formatCurrency(results.totalCost + results.sc)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "#475569" }}>You Receive from eBay</span>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#94a3b8" }}>{formatCurrency(results.youReceive)}</span>
            </div>
            <div style={{ borderTop: "1px solid #1e2433", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#cbd5e1" }}>Net Profit</span>
              <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "700", color: results.netProfit > 0 ? "#34d399" : "#f87171" }}>{formatCurrency(results.netProfit)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "12px", color: "#475569" }}>ROI</span>
              <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "600", color: results.roi >= 30 ? "#34d399" : results.roi > 0 ? "#fbbf24" : "#f87171" }}>{results.roi.toFixed(1)}%</span>
            </div>
          </div>

          <button onClick={() => onBuildProfile(results)} style={{
            width: "100%", padding: "16px", borderRadius: "14px",
            background: "linear-gradient(135deg, #1e3a5f 0%, #1a2e4a 100%)",
            border: "1.5px solid #3b82f6", color: "#60a5fa",
            fontSize: "14px", fontWeight: "700", cursor: "pointer",
            letterSpacing: "0.03em", marginBottom: "16px",
          }}>
            Build Item Profile →
          </button>
        </div>
      ) : <EmptyState emoji="📊" text={"Enter tag price + eBay price\nto see the full flip picture"} />}
    </div>
  );
}

// ── TAB 2: ITEM PROFILE ───────────────────────────────────────────────────────
function ProfileTab({ prefill, onSaved }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState("M");
  const [photoUrl, setPhotoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [ebayMin, setEbayMin] = useState(""); const [ebayMax, setEbayMax] = useState("");
  const [amazonMin, setAmazonMin] = useState(""); const [amazonMax, setAmazonMax] = useState("");
  const [mfgMin, setMfgMin] = useState(""); const [mfgMax, setMfgMax] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [purchased, setPurchased] = useState(null);
  const [date, setDate] = useState(today());
  const [saved, setSaved] = useState(false);

  function confColor(v) { return v >= 70 ? "#34d399" : v >= 40 ? "#fbbf24" : "#f87171"; }

  function handleSave() {
    if (!brand || !model || purchased === null) return;
    const item = {
      id: Date.now(), brand, model, size, gender, photoUrl, location,
      ebayMin, ebayMax, amazonMin, amazonMax, mfgMin, mfgMax,
      confidence, purchased, date, flip: prefill || null,
    };
    saveItems([item, ...loadItems()]);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(); }, 900);
  }

  return (
    <div style={{ width: "100%", maxWidth: "480px", padding: "22px 20px 0", boxSizing: "border-box" }}>
      {prefill && (
        <div style={{ background: "#0f1929", borderRadius: "12px", border: "1px solid #1e2a3a", padding: "12px 16px", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "11px", color: "#475569" }}>
            <span style={{ color: "#94a3b8", fontWeight: "600" }}>Cost:</span> {formatCurrency(prefill.totalCost)} &nbsp;·&nbsp;
            <span style={{ color: "#94a3b8", fontWeight: "600" }}>List:</span> {formatCurrency(prefill.ebayPrice)} &nbsp;·&nbsp;
            <span style={{ color: "#94a3b8", fontWeight: "600" }}>{prefill.discount}% OFF</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "700", color: prefill.netProfit > 0 ? "#34d399" : "#f87171" }}>{formatCurrency(prefill.netProfit)}</div>
        </div>
      )}

      <SectionLabel text="Item Info" color="#60a5fa" />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <TextInput label="Brand" value={brand} onChange={setBrand} placeholder="e.g. Nike, New Balance" />
        <TextInput label="Model" value={model} onChange={setModel} placeholder="e.g. Air Force 1, 990v6" />
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}><TextInput label="Size" value={size} onChange={setSize} placeholder="e.g. 10.5" /></div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Gender</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["M", "F"].map((g) => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex: 1, padding: "13px 4px", borderRadius: "10px",
                  background: gender === g ? "#1a2e4a" : "#131929",
                  border: `1.5px solid ${gender === g ? "#3b82f6" : "#1e2a3a"}`,
                  color: gender === g ? "#60a5fa" : "#334155",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer",
                }}>{g === "M" ? "👟 Men" : "👠 Women"}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionLabel text="Photo" color="#f59e0b" />
      <PhotoUpload photoUrl={photoUrl} onUploaded={setPhotoUrl} />

      <SectionLabel text="Location" color="#818cf8" />
      <LocationPicker location={location} onLocationChange={setLocation} />

      <SectionLabel text="Market Price Range" color="#a78bfa" />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <RangePriceInput label="eBay Sold" icon="🛒" minVal={ebayMin} maxVal={ebayMax} onMinChange={setEbayMin} onMaxChange={setEbayMax} />
        <RangePriceInput label="Amazon" icon="📦" minVal={amazonMin} maxVal={amazonMax} onMinChange={setAmazonMin} onMaxChange={setAmazonMax} />
        <RangePriceInput label="Manufacturer" icon="🏭" minVal={mfgMin} maxVal={mfgMax} onMinChange={setMfgMin} onMaxChange={setMfgMax} />
      </div>

      <SectionLabel text="Sell Confidence" color="#34d399" />
      <div style={{ background: "#0f1929", borderRadius: "16px", border: "1px solid #1e2a3a", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "#475569" }}>I'll sell this in under 2 months</span>
          <span style={{ fontFamily: "monospace", fontSize: "22px", fontWeight: "700", color: confColor(confidence) }}>{confidence}%</span>
        </div>
        <input type="range" min="1" max="100" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}
          style={{ width: "100%", accentColor: confColor(confidence), cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "10px", color: "#334155" }}>1% — No idea</span>
          <span style={{ fontSize: "10px", color: "#334155" }}>100% — Guaranteed</span>
        </div>
      </div>

      <SectionLabel text="Decision" color="#fbbf24" />
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {[true, false].map((val) => (
          <button key={String(val)} onClick={() => setPurchased(val)} style={{
            flex: 1, padding: "15px",
            background: purchased === val ? (val ? "#0c2a1e" : "#2a0e0e") : "#131929",
            border: `1.5px solid ${purchased === val ? (val ? "#34d399" : "#f87171") : "#1e2a3a"}`,
            borderRadius: "14px", color: purchased === val ? (val ? "#34d399" : "#f87171") : "#334155",
            fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
          }}>{val ? "✅ Bought It" : "❌ Passed"}</button>
        ))}
      </div>

      {purchased !== null && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{
            width: "100%", boxSizing: "border-box", background: "#131929",
            border: "1.5px solid #1e2a3a", borderRadius: "14px", padding: "14px 16px",
            color: "#f1f5f9", fontSize: "15px", outline: "none", colorScheme: "dark",
          }} />
        </div>
      )}

      <button onClick={handleSave} disabled={!brand || !model || purchased === null} style={{
        width: "100%", padding: "16px", borderRadius: "14px", marginBottom: "32px",
        background: (!brand || !model || purchased === null) ? "#0f1929" : "linear-gradient(135deg, #1e3a5f 0%, #1a2e4a 100%)",
        border: `1.5px solid ${(!brand || !model || purchased === null) ? "#1e2a3a" : "#3b82f6"}`,
        color: (!brand || !model || purchased === null) ? "#334155" : "#60a5fa",
        fontSize: "14px", fontWeight: "700", cursor: (!brand || !model || purchased === null) ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}>{saved ? "✅ Saved!" : "Save Item Profile"}</button>
    </div>
  );
}

// ── TAB 3: SAVED ITEMS ────────────────────────────────────────────────────────
function SavedTab() {
  const [items, setItems] = useState(loadItems());
  const [selected, setSelected] = useState(null);

  function deleteItem(id) { const u = items.filter(i => i.id !== id); saveItems(u); setItems(u); setSelected(null); }

  if (selected) {
    const it = selected;
    const cc = it.confidence >= 70 ? "#34d399" : it.confidence >= 40 ? "#fbbf24" : "#f87171";
    return (
      <div style={{ width: "100%", maxWidth: "480px", padding: "22px 20px 0", boxSizing: "border-box" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "0 0 16px 0" }}>← Back</button>

        {it.photoUrl && <img src={it.photoUrl} alt="Item" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "16px", border: "1px solid #1e2a3a", marginBottom: "16px", display: "block" }} />}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>{it.brand} {it.model}</div>
            <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>Size {it.size} · {it.gender === "M" ? "Men's" : "Women's"} · {formatDate(it.date)}</div>
            {it.location && <div style={{ fontSize: "11px", color: "#334155", marginTop: "4px" }}>📍 {it.location}</div>}
          </div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: it.purchased ? "#34d399" : "#f87171", flexShrink: 0, marginLeft: "12px" }}>{it.purchased ? "✅ Bought" : "❌ Passed"}</div>
        </div>

        {it.flip && (
          <div style={{ background: "#0f1929", borderRadius: "14px", border: "1px solid #1e2a3a", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Flip Numbers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[["Cost", formatCurrency(it.flip.totalCost)], ["eBay Price", formatCurrency(it.flip.ebayPrice)], ["Discount", `${it.flip.discount}%`], ["ROI", `${it.flip.roi?.toFixed(1)}%`], ["Net Profit", formatCurrency(it.flip.netProfit)]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: "10px", color: "#475569" }}>{k}</div>
                  <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "600", color: k === "Net Profit" ? (it.flip.netProfit > 0 ? "#34d399" : "#f87171") : "#f1f5f9" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(it.ebayMin || it.ebayMax || it.amazonMin || it.amazonMax || it.mfgMin || it.mfgMax) && (
          <div style={{ background: "#0f1929", borderRadius: "14px", border: "1px solid #1e2a3a", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Market Range</div>
            {[["🛒 eBay Sold", it.ebayMin, it.ebayMax], ["📦 Amazon", it.amazonMin, it.amazonMax], ["🏭 Manufacturer", it.mfgMin, it.mfgMax]].map(([src, mn, mx]) => (
              (mn || mx) ? <div key={src} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#475569" }}>{src}</span>
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#94a3b8" }}>{mn ? `$${mn}` : "—"} — {mx ? `$${mx}` : "—"}</span>
              </div> : null
            ))}
          </div>
        )}

        <div style={{ background: "#0f1929", borderRadius: "14px", border: "1px solid #1e2a3a", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#475569" }}>Sell Confidence (under 2mo)</span>
          <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "700", color: cc }}>{it.confidence}%</span>
        </div>

        <button onClick={() => deleteItem(it.id)} style={{
          width: "100%", padding: "14px", borderRadius: "14px", marginBottom: "32px",
          background: "#1a0e0e", border: "1.5px solid #4d1e1e", color: "#f87171",
          fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>Delete Item</button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "480px", padding: "22px 20px 0", boxSizing: "border-box" }}>
      {items.length === 0 ? <EmptyState emoji="📦" text={"No saved items yet\nBuild a profile from Full Flip"} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "32px" }}>
          {items.map((it) => {
            const cc = it.confidence >= 70 ? "#34d399" : it.confidence >= 40 ? "#fbbf24" : "#f87171";
            return (
              <button key={it.id} onClick={() => setSelected(it)} style={{
                background: "#0f1929", borderRadius: "16px", border: "1px solid #1e2a3a",
                padding: "0", textAlign: "left", cursor: "pointer", width: "100%", overflow: "hidden",
              }}>
                {it.photoUrl && <img src={it.photoUrl} alt="" style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#f1f5f9", marginBottom: "2px" }}>{it.brand} {it.model}</div>
                      <div style={{ fontSize: "11px", color: "#475569" }}>Size {it.size} · {it.gender === "M" ? "Men's" : "Women's"} · {formatDate(it.date)}</div>
                      {it.location && <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>📍 {it.location.length > 40 ? it.location.slice(0, 40) + "…" : it.location}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: it.purchased ? "#34d399" : "#f87171", marginBottom: "3px" }}>{it.purchased ? "✅" : "❌"}</div>
                      {it.flip && <div style={{ fontFamily: "monospace", fontSize: "13px", color: it.flip.netProfit > 0 ? "#34d399" : "#f87171", fontWeight: "600" }}>{formatCurrency(it.flip.netProfit)}</div>}
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ flex: 1, height: "4px", background: "#1e2433", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ width: `${it.confidence}%`, height: "100%", background: cc, borderRadius: "99px" }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: cc, fontWeight: "600", flexShrink: 0 }}>{it.confidence}%</span>
                    {it.flip && <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569", flexShrink: 0 }}>ROI {it.flip.roi?.toFixed(0)}%</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("flip");
  const [profilePrefill, setProfilePrefill] = useState(null);
  const [savedCount, setSavedCount] = useState(loadItems().length);

  function handleBuildProfile(results) { setProfilePrefill(results); setTab("profile"); }
  function handleSaved() { setSavedCount(loadItems().length); setTab("saved"); }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "48px" }}>
      <div style={{ width: "100%", background: "linear-gradient(180deg, #0f1a2e 0%, #0b1120 100%)", padding: "36px 24px 16px", borderBottom: "1px solid #1e2433", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
          <span style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase" }}>Retail Arbitrage · Las Vegas</span>
        </div>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "-0.02em" }}>Flip Calculator</h1>
        <p style={{ margin: "4px 0 14px", fontSize: "12px", color: "#475569" }}>Athletic Shoes · Under $150</p>
        <div style={{ display: "flex", background: "#0b1120", border: "1px solid #1e2433", borderRadius: "12px", padding: "4px", gap: "3px" }}>
          <TabButton label="📊 Full Flip" active={tab === "flip"} onClick={() => setTab("flip")} />
          <TabButton label="🔍 Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
          <TabButton label="📦 Saved" active={tab === "saved"} onClick={() => setTab("saved")} badge={savedCount} />
        </div>
      </div>
      {tab === "flip" && <FlipTab onBuildProfile={handleBuildProfile} />}
      {tab === "profile" && <ProfileTab prefill={profilePrefill} onSaved={handleSaved} />}
      {tab === "saved" && <SavedTab />}
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "10px", color: "#1e2a3a" }}>OkuClean Tools · Ross / DD's · Clark County NV</div>
    </div>
  );
}
