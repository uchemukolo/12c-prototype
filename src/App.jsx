import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Sparkles, BookOpen, Calculator, CalendarRange,
  Package, BarChart3, Users, Settings, HelpCircle, LogOut,
  Mic, Keyboard, Camera, FileUp, Play, Check, ChevronRight, ChevronDown,
  Link2, AlertTriangle, TrendingUp, Clock, Printer, Share2, Download,
  Utensils, Info, ArrowRight, Plus, Building2, Eye
} from "lucide-react";

/* ============================================================
   I2C RECIPE INTELLIGENCE — Clickable Prototype
   Sequenced build 1: shell + 13 hero screens + role switching
   All AI / OCR / memory / costing values are pre-scripted demo data.
   Scaling arithmetic is real (deterministic).
   ============================================================ */

// ---- Design tokens ----
const C = {
  ink: "#1a1633",
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  indigoSoft: "#eef2ff",
  violet: "#7c3aed",
  paper: "#f7f7fb",
  card: "#ffffff",
  line: "#e7e6f0",
  muted: "#6b6980",
  green: "#059669",
  greenSoft: "#ecfdf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  red: "#dc2626",
};

// ---- Hero demo recipe (Jollof Rice) ----
const BASE_PORTIONS = 100;
const baseIngredients = [
  { name: "Parboiled Rice", amount: 25, unit: "kg", cost: 18.75, pct: 59.7 },
  { name: "Tomatoes (800 g tin)", amount: 2, unit: "tin (800g)", cost: 3.2, pct: 10.2 },
  { name: "Oil", amount: 2.5, unit: "L", cost: 4.5, pct: 14.3 },
  { name: "Onions", amount: 3, unit: "kg", cost: 2.1, pct: 6.7 },
  { name: "Seasoning Cube", amount: 5, unit: "pcs", cost: 0.85, pct: 2.7 },
  { name: "Salt", amount: 35, unit: "g", cost: 0.2, pct: 0.6 },
];
const BASE_COST = 31.4;

const method = [
  "Wash rice and drain.",
  "Blend tomatoes and onions.",
  "Heat oil, fry onions until soft.",
  "Add blended tomatoes.",
  "Add chicken stock and seasoning cube.",
  "Add rice and cook until done.",
  "Stir, cover and cook on low heat until ready.",
];
// Method as captured for the 150-guest event batch built through the capture flow —
// kept separate from `method`, which belongs to the pre-existing persisted Jollof Rice recipe.
const CAPTURE_METHOD = [
  "Wash the rice thoroughly and leave to drain.",
  "Blend the tatashe, fresh tomatoes and Scotch bonnet.",
  "Heat the vegetable oil, add the onions and fry the tomato paste.",
  "Add the blended pepper and tomato mixture and cook down thoroughly.",
  "Add the curry powder, thyme, chicken seasoning powder, bay leaves and part of the salt.",
  "Add 8 L Chicken Stock and combine with the cooked base.",
  "Add the rice, mix thoroughly and cover.",
  "Cook until the rice is tender and has absorbed the sauce.",
  "Check the seasoning and adjust the remaining salt before service.",
];
// Business knowledge already confirmed by Amaka — shown in Settings and after a fresh capture run.
const LEARNED_MEANINGS_SEED = [
  { k: "One bag of rice", v: "25 kg bag" },
  { k: '"Big tin" of tomato paste', v: "2.2 kg tin" },
  { k: "Tatashe", v: "Red/long pepper" },
  { k: "One box of tatashe", v: "5 kg box" },
  { k: "One box of fresh tomatoes", v: "6 kg box" },
  { k: "One box of Scotch bonnet", v: "2 kg box" },
  { k: "One drum of vegetable oil", v: "20 L drum" },
  { k: "One jug of chicken stock", v: "2 L" },
  { k: "One sachet of curry", v: "100 g sachet" },
  { k: "One sachet of thyme", v: "50 g sachet" },
  { k: "One sachet of chicken seasoning powder", v: "100 g sachet" },
];

// ---- Sub-recipes (linked components) with real composition ----
// Each has its own ingredients; its batch cost is derived, and a per-unit cost
// flows into any parent recipe that links it. yieldQty = how much one batch makes.
const SUBRECIPES_SEED = {
  "Chicken Stock": {
    name: "Chicken Stock",
    yieldQty: 10, yieldUnit: "L",
    ingredients: [
      { name: "Chicken Bones", qty: "4 kg", price: 5.2 },
      { name: "Onions", qty: "1 kg", price: 0.7 },
      { name: "Carrots", qty: "0.5 kg", price: 0.45 },
      { name: "Bay Leaves", qty: "10 g", price: 0.35 },
    ],
  },
  "Tomato Base": {
    name: "Tomato Base",
    yieldQty: 6, yieldUnit: "kg",
    ingredients: [
      { name: "Tomatoes (800 g tin)", qty: "6 tins", price: 3.9 },
      { name: "Onions", qty: "1 kg", price: 0.7 },
      { name: "Garlic", qty: "0.2 kg", price: 0.6 },
      { name: "Oil", qty: "0.5 L", price: 0.9 },
    ],
  },
};
const subBatchCost = (sub) => sub.ingredients.reduce((s, i) => s + (i.price || 0), 0);
const subUnitCost = (sub) => subBatchCost(sub) / sub.yieldQty; // cost per L or per kg

// Which parent recipes use which sub-recipe, and how much of it they use.
const PARENTS_OF = {
  "Chicken Stock": [
    { recipe: "Jollof Rice", use: 5, unit: "L" },
    { recipe: "Egusi Soup", use: 8, unit: "L" },
  ],
  "Tomato Base": [
    { recipe: "Jollof Rice", use: 3, unit: "kg" },
    { recipe: "Fried Rice", use: 1.5, unit: "kg" },
  ],
};

// ---- Nav (Create Recipe intentionally before Recipes) ----
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "create", label: "Create Recipe", icon: Sparkles, accent: true },
  { id: "recipes", label: "Recipes", icon: BookOpen },
  { id: "ingredients", label: "Ingredients & Suppliers", icon: Package },
  { id: "costing", label: "Costing", icon: Calculator },
  { id: "production", label: "Production Plan", icon: CalendarRange },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "locations", label: "Locations", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const ROLES = ["Owner / Admin", "Manager / Head Chef", "Kitchen Staff"];

const money = (n) => "£" + n.toFixed(2);

// Demo seed values, reused by the "Reset demo data" control.
const SEED_PACK_PRICES = {
  "Parboiled Rice": 18.75, "Tomatoes (800 g tin)": 1.6, "Oil": 9.0,
  "Onions": 7.0, "Seasoning Cube": 17.0, "Salt": 5.71,
  "Rice (Parboiled)": 50.00, "Tomato Paste": 13.06, "Tatashe (Red Bell Pepper)": 21.95,
  "Fresh Tomatoes": 11.88, "Scotch Bonnet": 14.00, "White Onions": 17.99, "Vegetable Oil": 32.99,
  "Curry Powder": 1.50, "Thyme": 4.00, "Chicken Seasoning Powder": 1.80, "Bay Leaves": 2.50, "Cooking Salt": 0.80,
  "Chicken Parts": 20.00, "Fresh Ginger": 4.00, "Garlic": 5.00,
};
const EMPTY_PACK_PRICES = {
  "Parboiled Rice": 0, "Tomatoes (800 g tin)": 0, "Oil": 0, "Onions": 0, "Seasoning Cube": 0, "Salt": 0,
  "Rice (Parboiled)": 0, "Tomato Paste": 0, "Tatashe (Red Bell Pepper)": 0, "Fresh Tomatoes": 0, "Scotch Bonnet": 0,
  "White Onions": 0, "Vegetable Oil": 0, "Curry Powder": 0, "Thyme": 0, "Chicken Seasoning Powder": 0, "Bay Leaves": 0, "Cooking Salt": 0,
  "Chicken Parts": 0, "Fresh Ginger": 0, "Garlic": 0,
};
const SEED_LINKED_SUBS = [
  { name: "Chicken Stock", use: 5, unit: "L" },
  { name: "Tomato Base", use: 3, unit: "kg" },
];

export default function App() {
  // Auth flow: landing marketing page → auth form → app
  const [authed, setAuthed] = useState(false);
  const [authScreen, setAuthScreen] = useState("landing"); // "landing" | "form"
  const [formMode, setFormMode] = useState("signup");       // "signup" | "login"
  const [user, setUser] = useState({ firstName: "Amaka", fullName: "Amaka Okafor", business: "Amaka's Kitchen" });
  const [onboarding, setOnboarding] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "Amaka's Kitchen", type: "Restaurant & catering", currency: "GBP (£)",
    batchFormat: "Event batch", size: "1–10 staff", cuisine: "West African",
  });

  const [view, setView] = useState("dashboard");
  const [role, setRole] = useState("Owner / Admin");

  // hero flow sub-state
  const [captureStep, setCaptureStep] = useState("choose"); // choose|captured|analysis|clarify|pricing|knowledge|standard
  const [clarify, setClarify] = useState({
    rice: "25 kg bag", tomatoPaste: "2.2 kg tin", tatashe: "5 kg box", freshTomatoes: "6 kg box",
    scotchBonnet: "500 g", oil: "10 L", chickenStock: "2 L", curry: "100 g", thyme: "50 g",
    chickenSeasoningFull: "100 g", chickenSeasoning: "50 g", bayLeaves: "20 leaves", saltAmount: "5", saltUnit: "tbsp",
  });
  const [remember, setRemember] = useState({
    rice: true, tomatoPaste: true, tatashe: true, freshTomatoes: true, scotchBonnet: true, oil: true,
    chickenStock: true, curry: true, thyme: true, chickenSeasoning: true,
  });
  const [clarifyPhotos, setClarifyPhotos] = useState({});
  const [stockSupply, setStockSupply] = useState("inhouse");
  const [stockSourceMode, setStockSourceMode] = useState("created-new"); // "" | "linked-existing" | "created-new"
  const [stockLinkedName, setStockLinkedName] = useState("");
  const [stockPackSize, setStockPackSize] = useState(""); // purchased path: "1 L" | "5 L" | "Other"
  const [stockPackSizeOther, setStockPackSizeOther] = useState("");
  const [learned, setLearned] = useState(LEARNED_MEANINGS_SEED);
  const [approved, setApproved] = useState(false);

  // NEW: pricing origin — a first-time user has no catalogue, so costs start at 0.00 and are entered by hand.
  // Pack prices keyed by recipe-ingredient name. Seeded with demo values so costing
  // works immediately; editable in the Ingredient costs step and in Ingredients & Suppliers.
  const [packPrices, setPackPrices] = useState({ ...SEED_PACK_PRICES });
  const pricesEntered = Object.values(packPrices).some((v) => v > 0);

  // scaling
  const [targetPortions, setTargetPortions] = useState(150);

  // staff open-recipe (null = library list)
  const [openRecipe, setOpenRecipe] = useState(null);

  // BUILD 2: import-existing-recipe sub-flow: choose -> uploading -> analysed -> (clarifyOne) -> done
  const [importStep, setImportStep] = useState(null); // null unless in import branch
  const [importClarified, setImportClarified] = useState(false);

  // BUILD 2: invoice-driven cost update (branch C). null | "uploaded" | "confirmed"
  const [invoiceState, setInvoiceState] = useState(null);
  const [priceBumped, setPriceBumped] = useState(false); // has the rice price update been applied

  // BUILD 3: sub-recipe dependency — editable composition + which subs the parent links.
  const [subs, setSubs] = useState(SUBRECIPES_SEED);
  const [linkedSubs, setLinkedSubs] = useState(SEED_LINKED_SUBS.map((l) => ({ ...l })));

  // BUILD 4: editable base yield (portions the standard recipe is defined for)
  const [basePortions, setBasePortions] = useState(BASE_PORTIONS);

  // BUILD 4: which library recipe is open on the editable detail page (null = none)
  const [detailRecipe, setDetailRecipe] = useState(null);

  // Presentation reset menu
  const [resetMenu, setResetMenu] = useState(false);

  const isStaff = role === "Kitchen Staff";

  // Kitchen staff: browse the full library, open any recipe read-only. No create/edit, no costs.
  const effectiveView = isStaff ? (openRecipe ? "staff" : "staffLibrary") : (detailRecipe ? "recipeDetail" : view);

  const go = (v) => { if (isStaff) setOpenRecipe(null); setDetailRecipe(null); setView(v); };
  const openRecipeDetail = (name) => { setDetailRecipe(name); };

  // Reset all demo state for a clean presentation run.
  // mode "seeded" = populated demo (default), "empty" = first-time user with no prices.
  const resetDemo = (mode = "seeded") => {
    setView("dashboard"); setRole("Owner / Admin");
    setCaptureStep("choose");
    setClarify({
      rice: "25 kg bag", tomatoPaste: "2.2 kg tin", tatashe: "5 kg box", freshTomatoes: "6 kg box",
      scotchBonnet: "500 g", oil: "10 L", chickenStock: "2 L", curry: "100 g", thyme: "50 g",
      chickenSeasoningFull: "100 g", chickenSeasoning: "50 g", bayLeaves: "20 leaves", saltAmount: "5", saltUnit: "tbsp",
    });
    setRemember({
      rice: true, tomatoPaste: true, tatashe: true, freshTomatoes: true, scotchBonnet: true, oil: true,
      chickenStock: true, curry: true, thyme: true, chickenSeasoning: true,
    });
    setClarifyPhotos({}); setStockSupply("inhouse");
    setStockSourceMode("created-new"); setStockLinkedName(""); setStockPackSize(""); setStockPackSizeOther("");
    setLearned(LEARNED_MEANINGS_SEED); setApproved(false);
    setPackPrices(mode === "empty" ? { ...EMPTY_PACK_PRICES } : { ...SEED_PACK_PRICES });
    setTargetPortions(150);
    setOpenRecipe(null); setDetailRecipe(null);
    setImportStep(null); setImportClarified(false);
    setInvoiceState(null); setPriceBumped(false);
    setSubs(SUBRECIPES_SEED);
    setLinkedSubs(SEED_LINKED_SUBS.map((l) => ({ ...l })));
    setBasePortions(BASE_PORTIONS);
  };

  const scaled = useMemo(() => {
    const f = targetPortions / basePortions;
    return baseIngredients.map((i) => ({ ...i, s: i.amount * f }));
  }, [targetPortions, basePortions]);
  const scaledCost = BASE_COST * (targetPortions / basePortions);

  // Login goes straight in; signup passes through onboarding to populate the business profile.
  const enterApp = (u) => { setUser(u); setAuthed(true); setView("dashboard"); setRole("Owner / Admin"); };
  const handleAuth = (u, mode) => {
    setUser(u);
    setBusinessProfile((p) => ({ ...p, name: u.business || p.name }));
    if (mode === "signup") { setOnboarding(true); }
    else { enterApp(u); }
  };
  const finishOnboarding = (profile) => { setBusinessProfile(profile); setOnboarding(false); enterApp(user); };
  const handleLogout = () => { setAuthed(false); setOnboarding(false); setAuthScreen("landing"); };
  const openAuth = (mode) => { setFormMode(mode); setAuthScreen("form"); };

  if (!authed) {
    if (onboarding) return <Onboarding user={user} initial={businessProfile} onDone={finishOnboarding} />;
    if (authScreen === "landing") return <Landing onGetStarted={() => openAuth("signup")} onLogin={() => openAuth("login")} />;
    return <AuthForm mode={formMode} setMode={setFormMode} onAuth={handleAuth} onBack={() => setAuthScreen("landing")} defaultUser={user} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", color: C.ink }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        .navbtn:hover { background: rgba(255,255,255,.08); }
        .navbtn-active { background: rgba(255,255,255,.14) !important; }
        .card { background:${C.card}; border:1px solid ${C.line}; border-radius:14px; }
        .lift { transition: box-shadow .15s, transform .15s; }
        .lift:hover { box-shadow: 0 6px 20px rgba(79,70,229,.10); }
        .pbtn { background:${C.indigo}; color:#fff; border:none; border-radius:10px; padding:10px 16px; font-weight:600; font-size:14px; display:inline-flex; align-items:center; gap:8px; transition:background .15s; }
        .pbtn:hover { background:${C.indigoDeep}; }
        .gbtn { background:#fff; color:${C.ink}; border:1px solid ${C.line}; border-radius:10px; padding:9px 15px; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:7px; }
        .gbtn:hover { border-color:${C.indigo}; color:${C.indigo}; }
        .resetrow:hover { background:${C.indigoSoft}; }
        .chip { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; letter-spacing:.02em; }
        input[type=range]{ accent-color:${C.indigo}; }
        table { border-collapse: collapse; width:100%; }
        .rowline td { border-top:1px solid ${C.line}; }
        select { font-family:inherit; }
      `}</style>

      {/* ---------------- Sidebar ---------------- */}
      <aside style={{ width: 244, background: C.ink, color: "#cfcae8", display: "flex", flexDirection: "column", padding: "18px 12px", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "6px 10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: 15 }}>I2C</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Recipe</div>
            <div style={{ color: "#8b86ad", fontWeight: 600, fontSize: 11, letterSpacing: ".08em" }}>INTELLIGENCE</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const staffAllowed = n.id === "dashboard" || n.id === "recipes";
            const disabled = isStaff && !staffAllowed;
            const active = isStaff
              ? (staffAllowed && (n.id === "recipes" ? (view === "recipes") : view === n.id))
              : (view === n.id);
            return (
              <button key={n.id}
                className={"navbtn" + (active ? " navbtn-active" : "")}
                onClick={() => !disabled && go(n.id)}
                disabled={disabled}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                  background: "transparent", border: "none", color: disabled ? "#514d6e" : (active ? "#fff" : "#cfcae8"),
                  opacity: disabled ? .38 : 1, padding: "10px 11px", borderRadius: 9, fontSize: 13.5, fontWeight: active ? 700 : 500,
                }}>
                <Icon size={17} />
                <span>{n.label}</span>
                {n.accent && !active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 99, background: "#a855f7" }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button className="navbtn" style={ghost}><HelpCircle size={17} /> Help</button>
          <button className="navbtn" style={ghost} onClick={handleLogout}><LogOut size={17} /> Log out</button>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderBottom: `1px solid ${C.line}`, background: "#fff", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{screenTitle(effectiveView, captureStep)}</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ ...C_demoTag }}><Info size={12} /> Simulated demo data</span>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setResetMenu((o) => !o)}
                title="Reset the prototype for a fresh demo run"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: C.muted }}>
                <Clock size={13} /> Reset demo <ChevronDown size={13} />
              </button>
              {resetMenu && (
                <>
                  <div onClick={() => setResetMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 258, padding: 6, zIndex: 41, boxShadow: "0 12px 30px rgba(0,0,0,.15)" }}>
                    <button className="resetrow" onClick={() => { resetDemo("seeded"); setResetMenu(false); }}
                      style={{ ...resetItem }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Reset with demo data</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>Prices populated — costing works immediately.</div>
                    </button>
                    <button className="resetrow" onClick={() => { resetDemo("empty"); setResetMenu(false); }}
                      style={{ ...resetItem }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Reset as first-time user</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>Empty catalogue — costs start at £0.00.</div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Viewing as</span>
              <div style={{ position: "relative" }}>
                <select value={role} onChange={(e) => { const nr = e.target.value; setRole(nr); setOpenRecipe(null); setView(nr === "Kitchen Staff" ? "recipes" : "dashboard"); }}
                  style={{ appearance: "none", border: `1px solid ${C.line}`, borderRadius: 9, padding: "7px 30px 7px 12px", fontWeight: 600, fontSize: 13, color: C.ink, background: "#fff" }}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown size={15} style={{ position: "absolute", right: 9, top: 9, color: C.muted, pointerEvents: "none" }} />
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "26px 28px 60px", maxWidth: 1180, margin: "0 auto" }}>
          {effectiveView === "dashboard" && <Dashboard role={role} isStaff={isStaff} user={user} go={go} />}
          {effectiveView === "create" && (
            <CreateFlow
              step={captureStep} setStep={setCaptureStep}
              clarify={clarify} setClarify={setClarify}
              remember={remember} setRemember={setRemember}
              clarifyPhotos={clarifyPhotos} setClarifyPhotos={setClarifyPhotos}
              stockSupply={stockSupply} setStockSupply={setStockSupply}
              stockSourceMode={stockSourceMode} setStockSourceMode={setStockSourceMode}
              stockLinkedName={stockLinkedName} setStockLinkedName={setStockLinkedName}
              stockPackSize={stockPackSize} setStockPackSize={setStockPackSize}
              stockPackSizeOther={stockPackSizeOther} setStockPackSizeOther={setStockPackSizeOther}
              learned={learned} setLearned={setLearned}
              approved={approved} setApproved={setApproved}
              packPrices={packPrices} setPackPrices={setPackPrices} pricesEntered={pricesEntered}
              importStep={importStep} setImportStep={setImportStep}
              importClarified={importClarified} setImportClarified={setImportClarified}
              subs={subs} setSubs={setSubs}
              linkedSubs={linkedSubs} setLinkedSubs={setLinkedSubs}
              basePortions={basePortions} setBasePortions={setBasePortions}
              go={go}
            />
          )}
          {effectiveView === "recipes" && <Recipes go={go} approved={approved} onOpen={openRecipeDetail} />}
          {effectiveView === "recipeDetail" && (
            <Standard
              title={detailRecipe}
              onBack={() => { setDetailRecipe(null); setView("recipes"); }}
              approved={approved} setApproved={setApproved}
              packPrices={packPrices} pricesEntered={pricesEntered}
              subs={subs} setSubs={setSubs}
              linkedSubs={linkedSubs} setLinkedSubs={setLinkedSubs}
              basePortions={basePortions} setBasePortions={setBasePortions}
              go={go}
            />
          )}
          {effectiveView === "costing" && (
            <Costing packPrices={packPrices} pricesEntered={pricesEntered} priceBumped={priceBumped} go={go}
              captureData={buildStandardCaptureData({ clarify, packPrices, subs, stockSupply, stockSourceMode, stockLinkedName, stockPackSize, stockPackSizeOther })} />
          )}
          {effectiveView === "production" && (
            <Production scaled={scaled} target={targetPortions} setTarget={setTargetPortions} scaledCost={scaledCost} basePortions={basePortions}
              captureData={buildStandardCaptureData({ clarify, packPrices, subs, stockSupply, stockSourceMode, stockLinkedName, stockPackSize, stockPackSizeOther })} />
          )}
          {effectiveView === "ingredients" && (
            <Ingredients
              invoiceState={invoiceState} setInvoiceState={setInvoiceState}
              priceBumped={priceBumped} setPriceBumped={setPriceBumped}
              packPrices={packPrices} setPackPrices={setPackPrices}
              go={go}
            />
          )}
          {effectiveView === "reports" && <Reports priceBumped={priceBumped} />}
          {effectiveView === "locations" && <Locations />}
          {effectiveView === "settings" && <SettingsView learned={learned} profile={businessProfile} setProfile={setBusinessProfile} />}
          {effectiveView === "staffLibrary" && <StaffLibrary onOpen={(r) => setOpenRecipe(r)} />}
          {effectiveView === "staff" && <StaffView recipe={openRecipe} onBack={() => setOpenRecipe(null)} />}
        </div>
      </main>
    </div>
  );
}

const ghost = { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#a9a4c8", padding: "9px 11px", borderRadius: 9, fontSize: 13, fontWeight: 500 };
const C_demoTag = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: C.amber, background: C.amberSoft, border: `1px solid #fde68a`, padding: "4px 10px", borderRadius: 999 };
const resetItem = { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "9px 11px", borderRadius: 8, color: C.ink };

// ==================== MARKETING LANDING PAGE ====================
function Landing({ onGetStarted, onLogin }) {
  const nav = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
  const steps = [
    { n: "01", t: "Capture it however it exists", d: "Speak the recipe, type or paste it, snap the packaging, or import a spreadsheet. Combine methods in one go." },
    { n: "02", t: "I2C flags what's ambiguous", d: "“One bag of rice”, “big tin”, “half a bottle” — I2C asks a targeted question instead of guessing." },
    { n: "03", t: "Confirm once, reuse next time", d: "Your answers become business knowledge and auto-fill next time. Your kitchen's language, learned." },
    { n: "04", t: "Run the whole operation", d: "A trusted standard recipe powers costing, scaling, production, reports and staff access." },
  ];
  const features = [
    [Mic, "Multimodal capture", "Voice, text, photo or import — no retyping recipes into rigid forms."],
    [Sparkles, "Ambiguity detection", "Culturally-aware clarification turns informal measures into precise quantities."],
    [BookOpen, "Business knowledge", "Confirmed meanings are remembered and reused across every future recipe."],
    [Calculator, "Live costing", "Batch and per-portion cost from real ingredient prices, updated as prices change."],
    [Link2, "Sub-recipe dependencies", "Change a stock or base once and every linked recipe recosts automatically."],
    [Building2, "Multi-location control", "Central master recipes and version governance across every site."],
  ];
  const personas = [
    ["Independent restaurants", "Standardise the founder's recipes so any chef can reproduce them consistently."],
    ["Caterers & home food businesses", "Cost and scale for events without a spreadsheet full of guesswork."],
    ["Growing multi-site brands", "Keep every location cooking the current, approved version of each recipe."],
  ];

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", color: C.ink, background: "#fff" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        .mkbtn-p { background:#fff; color:${C.indigoDeep}; border:none; border-radius:11px; padding:13px 22px; font-weight:800; font-size:15px; display:inline-flex; align-items:center; gap:8px; }
        .mkbtn-p:hover { transform: translateY(-1px); }
        .mkbtn-g { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.4); border-radius:11px; padding:13px 22px; font-weight:700; font-size:15px; }
        .mkbtn-g:hover { border-color:#fff; }
        .mkbtn-dark { background:${C.indigo}; color:#fff; border:none; border-radius:11px; padding:13px 24px; font-weight:800; font-size:15px; display:inline-flex; align-items:center; gap:8px; }
        .mkbtn-dark:hover { background:${C.indigoDeep}; }
        .navlink { background:none; border:none; color:${C.ink}; font-size:14px; font-weight:600; opacity:.75; }
        .navlink:hover { opacity:1; }
        .fcard { border:1px solid ${C.line}; border-radius:16px; padding:24px; transition: box-shadow .15s, transform .15s; }
        .fcard:hover { box-shadow: 0 12px 34px rgba(79,70,229,.10); transform: translateY(-2px); }
      `}</style>

      {/* Top nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: 13 }}>I2C</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Recipe Intelligence</div>
          </div>
          <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 22 }}>
            <button className="navlink" onClick={() => nav("features")}>Features</button>
            <button className="navlink" onClick={() => nav("how")}>How it works</button>
            <button className="navlink" onClick={() => nav("who")}>Who it's for</button>
            <button className="navlink" onClick={onLogin}>Log in</button>
            <button className="mkbtn-dark" style={{ padding: "9px 16px", fontSize: 14 }} onClick={onGetStarted}>Get started</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "linear-gradient(160deg,#312e81,#4c1d95 55%,#6d28d9)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "84px 24px 92px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, marginBottom: 26 }}>
            <Sparkles size={13} /> Informal culinary knowledge → commercial recipe data
          </div>
          <h1 style={{ fontSize: 54, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 22px", maxWidth: 760 }}>
            Your recipes live in your head. I2C turns them into a business.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,.85)", maxWidth: 620, margin: "0 0 34px" }}>
            Capture recipes the way your kitchen already describes them, resolve the ambiguity, and get standardised recipes you can cost, scale and hand to any chef.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="mkbtn-p" onClick={onGetStarted}>Get started free <ArrowRight size={17} /></button>
            <button className="mkbtn-g" onClick={() => nav("how")}>See how it works</button>
          </div>
          <div style={{ marginTop: 30, fontSize: 13, color: "rgba(255,255,255,.7)" }}>No card required · Prototype with simulated demo data</div>
        </div>
        {/* decorative glow */}
        <div style={{ position: "absolute", right: -120, top: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,.5),transparent 70%)" }} />
        <div style={{ position: "absolute", left: -100, bottom: -120, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.45),transparent 70%)" }} />
      </section>

      {/* Problem framing / stat strip */}
      <section style={{ borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "34px 24px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[["Recipes in notebooks & WhatsApp", "The knowledge that runs the kitchen isn't written down in any usable form."],
            ["“One bag”, “big tin”, “to taste”", "Meaningful in the kitchen, useless for costing, scaling or a new hire."],
            ["Prices change every week", "Without linked costing, nobody knows what a dish actually costs today."]].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ maxWidth: 1140, margin: "0 auto", padding: "76px 24px" }}>
        <div style={{ maxWidth: 620, marginBottom: 42 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.indigo, marginBottom: 10 }}>How it works</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>From informal culinary knowledge to a costed, standardised recipe.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 18, padding: 24, border: `1px solid ${C.line}`, borderRadius: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.indigoSoft, WebkitTextStroke: `1px ${C.indigo}`, lineHeight: 1 }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: C.paper, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "76px 24px" }}>
          <div style={{ maxWidth: 620, marginBottom: 42 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.indigo, marginBottom: 10 }}>What you get</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>From informal recipe capture to everyday kitchen operations.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {features.map(([Icon, t, d]) => (
              <div key={t} className="fcard" style={{ background: "#fff" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: C.indigoSoft, display: "grid", placeItems: "center", marginBottom: 16 }}><Icon size={21} color={C.indigo} /></div>
                <div style={{ fontWeight: 800, fontSize: 16.5, marginBottom: 7 }}>{t}</div>
                <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" style={{ maxWidth: 1140, margin: "0 auto", padding: "76px 24px" }}>
        <div style={{ maxWidth: 620, marginBottom: 42 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.indigo, marginBottom: 10 }}>Who it's for</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>Built for founder-led food businesses.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {personas.map(([t, d]) => (
            <div key={t} style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 26 }}>
              <Utensils size={22} color={C.violet} style={{ marginBottom: 14 }} />
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: "linear-gradient(120deg,#4338ca,#7c3aed)", color: "#fff" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "70px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 14px" }}>Standardise your first recipe today.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.85)", maxWidth: 560, margin: "0 auto 30px", lineHeight: 1.6 }}>
            Speak a recipe, answer a couple of questions, and watch it become a costed, shareable standard recipe.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="mkbtn-p" onClick={onGetStarted}>Get started free <ArrowRight size={17} /></button>
            <button className="mkbtn-g" onClick={onLogin}>Log in</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.ink, color: "#cfcae8" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: 12 }}>I2C</div>
            <span style={{ fontWeight: 700, color: "#fff" }}>Recipe Intelligence</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 22, fontSize: 13 }}>
            <button className="navlink" style={{ color: "#cfcae8" }} onClick={() => nav("features")}>Features</button>
            <button className="navlink" style={{ color: "#cfcae8" }} onClick={() => nav("how")}>How it works</button>
            <button className="navlink" style={{ color: "#cfcae8" }} onClick={onLogin}>Log in</button>
          </div>
          <div style={{ width: "100%", marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 12, color: "#8b86ad", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>© 2025 I2C Recipe Intelligence. Prototype — simulated demo data.</span>
            <span>Privacy · Terms · Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== AUTH FORM (signup / login) ====================
function AuthForm({ mode, setMode, onAuth, onBack, defaultUser }) {
  const isSignup = mode === "signup";
  const [name, setName] = useState(defaultUser ? defaultUser.fullName : "Amaka Okafor");
  const [business, setBusiness] = useState("Amaka's Kitchen");
  const [email, setEmail] = useState("amaka@kitchen.co.uk");
  const [password, setPassword] = useState("demo1234");

  const submit = () => {
    const clean = (name || "").trim();
    const first = clean ? clean.split(/\s+/)[0] : "there";
    onAuth({ firstName: first, fullName: clean || "I2C User", business: business || "My Kitchen" }, mode);
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", color: C.ink, background: C.paper }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        .lpbtn { background:${C.indigo}; color:#fff; border:none; border-radius:10px; padding:12px 16px; font-weight:700; font-size:14px; width:100%; }
        .lpbtn:hover { background:${C.indigoDeep}; }
        .lfield { width:100%; border:1px solid ${C.line}; border-radius:10px; padding:11px 12px; font-size:14px; font-family:inherit; }
        .lfield:focus { outline:none; border-color:${C.indigo}; box-shadow:0 0 0 3px ${C.indigoSoft}; }
        .linklike { background:none; border:none; color:${C.indigo}; font-weight:700; font-size:13.5px; }
      `}</style>

      {/* Left brand panel */}
      <div style={{ flex: 1, background: "linear-gradient(150deg,#3730a3,#6d28d9 60%,#7c3aed)", color: "#fff", padding: "56px 52px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
        <button onClick={onBack} style={{ position: "absolute", top: 26, left: 52, background: "rgba(255,255,255,.14)", border: "none", color: "#fff", borderRadius: 9, padding: "8px 13px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to home</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 34 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 }}>I2C</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Recipe Intelligence</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", fontWeight: 600, letterSpacing: ".06em" }}>INFORMAL → COMMERCIAL</div>
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, margin: "0 0 14px", maxWidth: 460 }}>
          {isSignup ? "Standardise your first recipe in minutes." : "Welcome back to your kitchen."}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.85)", maxWidth: 440, margin: 0, lineHeight: 1.6 }}>
          Capture informal culinary knowledge, clarify what's unclear, and turn it into trusted commercial recipe data.
        </p>
        <div style={{ position: "absolute", bottom: 22, left: 52, fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>Prototype · simulated demo data</div>
      </div>

      {/* Right form */}
      <div style={{ width: 460, display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 48px", background: "#fff", borderLeft: `1px solid ${C.line}` }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>{isSignup ? "Create your account" : "Sign in"}</h2>
        <p style={{ margin: "0 0 26px", color: C.muted, fontSize: 14 }}>
          {isSignup ? "Set up your business and standardise your first recipe." : "Sign in to your kitchen."}
        </p>

        <label style={lbl}>Your name</label>
        <input className="lfield" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKey} style={{ marginBottom: 16 }} />

        {isSignup && (
          <>
            <label style={lbl}>Business name</label>
            <input className="lfield" value={business} onChange={(e) => setBusiness(e.target.value)} onKeyDown={onKey} style={{ marginBottom: 16 }} />
          </>
        )}

        <label style={lbl}>Email</label>
        <input className="lfield" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} style={{ marginBottom: 16 }} />

        <label style={lbl}>Password</label>
        <input className="lfield" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey} style={{ marginBottom: 22 }} />

        <button className="lpbtn" onClick={submit}>{isSignup ? "Create account" : "Sign in"} <ArrowRight size={15} style={{ verticalAlign: "-2px" }} /></button>

        <div style={{ marginTop: 18, fontSize: 13.5, color: C.muted, textAlign: "center" }}>
          {isSignup ? "Already have an account? " : "New to I2C? "}
          <button className="linklike" onClick={() => setMode(isSignup ? "login" : "signup")}>{isSignup ? "Log in" : "Create an account"}</button>
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 8, alignItems: "flex-start", background: C.amberSoft, border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px" }}>
          <Info size={14} color={C.amber} style={{ marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#92400e" }}>Demo {isSignup ? "sign-up" : "sign-in"} — fields are pre-filled. Your name sets the dashboard greeting; no real authentication runs.</div>
        </div>
      </div>
    </div>
  );
}

// ==================== ONBOARDING (after signup → populates Business profile) ====================
const SELECT_FIELD_KEYS = ["type", "cuisine", "size", "batchFormat", "currency"];

function Onboarding({ user, initial, onDone }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState(() => {
    const blank = {};
    SELECT_FIELD_KEYS.forEach((k) => { blank[k] = ""; });
    return { ...initial, ...blank };
  });
  const [customMode, setCustomMode] = useState({});
  const set = (k, v) => setP({ ...p, [k]: v });

  const steps = [
    {
      title: "Tell us about your business",
      sub: "This sets up your profile. You can change any of it later in Settings.",
      fields: [
        { k: "name", label: "Business name", type: "text" },
        { k: "type", label: "Business type", type: "select", options: ["Restaurant & catering", "Restaurant", "Catering", "Home food business", "Cloud kitchen", "Multi-site brand", "Private chef", "Other"] },
        { k: "cuisine", label: "Main cuisine", type: "select", options: ["West African", "Caribbean", "South Asian", "Middle Eastern", "European", "Other"] },
      ],
    },
    {
      title: "How you cook and cost",
      sub: "A couple of defaults so recipes and costs match how your kitchen runs.",
      fields: [
        { k: "size", label: "Team size", type: "select", options: ["Just me", "1–10 staff", "11–30 staff", "30+ staff"] },
        { k: "batchFormat", label: "Default batch format", type: "select", options: ["Large tray", "Medium tray", "Large pot", "Individual portions", "Other / Custom"], allowCustom: true },
        { k: "currency", label: "Currency", type: "select", options: ["GBP (£)", "USD ($)", "EUR (€)", "NGN (₦)"] },
      ],
    },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.paper, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", color: C.ink, padding: 24 }}>
      <style>{`
        .obfield { box-sizing:border-box; width:100%; border:1px solid ${C.line}; border-radius:10px; padding:11px 12px; font-size:14px; font-family:inherit; background:#fff; }
        .obfield:focus { outline:none; border-color:${C.indigo}; box-shadow:0 0 0 3px ${C.indigoSoft}; }
      `}</style>
      <div className="card" style={{ width: "100%", maxWidth: 520, padding: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: 12 }}>I2C</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Welcome, {user.firstName} 👋</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {steps.map((_, i) => <div key={i} style={{ width: 24, height: 5, borderRadius: 99, background: i <= step ? C.indigo : C.line }} />)}
          </div>
        </div>

        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{cur.title}</h2>
        <p style={{ margin: "0 0 22px", color: C.muted, fontSize: 13.5 }}>{cur.sub}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cur.fields.map((f) => {
            const isCustom = f.allowCustom && customMode[f.k];
            const selectValue = isCustom ? "Other / Custom" : p[f.k];
            return (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                {f.type === "select" ? (
                  <select className="obfield" value={selectValue} onChange={(e) => {
                    const val = e.target.value;
                    const nowCustom = f.allowCustom && val === "Other / Custom";
                    if (f.allowCustom) setCustomMode({ ...customMode, [f.k]: nowCustom });
                    set(f.k, nowCustom ? "" : val);
                  }}>
                    <option value="" disabled>Select</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="obfield" value={p[f.k]} onChange={(e) => set(f.k, e.target.value)} />
                )}
                {f.allowCustom && selectValue === "Other / Custom" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl}>Name your batch format</label>
                    <input className="obfield" placeholder="e.g. Event batch, Full gastro, Half gastro, Full cooler, Prep batch"
                      value={p[f.k]} onChange={(e) => set(f.k, e.target.value)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
          {step > 0 ? <button className="gbtn" onClick={() => setStep(step - 1)}>Back</button> : <span />}
          {last ? (
            <button className="pbtn" onClick={() => onDone(p)}>Finish setup <ArrowRight size={16} /></button>
          ) : (
            <button className="pbtn" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button>
          )}
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button style={{ background: "none", border: "none", color: C.muted, fontSize: 12.5, fontWeight: 600 }} onClick={() => onDone(p)}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}

function screenTitle(v, step) {
  const map = {
    dashboard: "Dashboard", create: "Create Recipe", recipes: "Recipes",
    costing: "Costing", production: "Production Plan", ingredients: "Ingredients & Suppliers",
    reports: "Reports", locations: "Locations", settings: "Settings",
    recipeDetail: "Recipe", staff: "Staff Recipe View", staffLibrary: "Recipes",
  };
  return map[v] || "I2C";
}

// ---------- small shared bits ----------
function Stepline({ active }) {
  const steps = ["Capture", "Clarify", "Standardise", "Review"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 22 }}>
      {steps.map((s, i) => {
        const done = i < active, cur = i === active;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, display: "grid", placeItems: "center", background: done ? C.indigo : cur ? "#fff" : "#fff", border: `2px solid ${done || cur ? C.indigo : C.line}`, color: done ? "#fff" : C.indigo }}>
                {done ? <Check size={13} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: cur ? 700 : 500, color: done || cur ? C.ink : C.muted }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < active ? C.indigo : C.line, margin: "0 12px" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Metric({ label, value, tone }) {
  const col = tone === "red" ? C.red : tone === "amber" ? C.amber : C.ink;
  return (
    <div className="card lift" style={{ padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: col, letterSpacing: "-.02em" }}>{value}</div>
    </div>
  );
}

// ==================== SCREEN 1: DASHBOARD ====================
function Dashboard({ role, isStaff, user, go }) {
  if (isStaff) return <StaffLibrary onOpen={() => {}} />;
  const firstName = (user && user.firstName) || "there";
  const recents = [
    ["Jollof Rice", "Approved", "100 portions", "02 May 2025", "£31.40"],
    ["Egusi Soup", "Needs Clarification", "—", "01 May 2025", "—"],
    ["Fried Rice", "Approved", "80 portions", "28 Apr 2025", "£24.15"],
    ["Moi Moi", "Approved", "120 portions", "27 Apr 2025", "£18.70"],
    ["Ofada Rice", "Approved", "70 portions", "25 Apr 2025", "£26.30"],
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>Hello, {firstName} 👋</h1>
          <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 14 }}>Here's what's happening in your kitchen today.</p>
        </div>
        <button className="pbtn" onClick={() => go("create")}><Sparkles size={16} /> Create Recipe</button>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <Metric label="Total Recipes" value="128" />
        <Metric label="Need Review" value="6" tone="red" />
        <Metric label="Cost Changes" value="12" tone="amber" />
        <Metric label="Ingredient Alerts" value="8" tone="amber" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Recipes</h2>
          <button className="gbtn" onClick={() => go("recipes")}>View all recipes <ChevronRight size={15} /></button>
        </div>
        <table>
          <thead>
            <tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em" }}>
              <th style={th}>RECIPE NAME</th><th style={th}>STATUS</th><th style={th}>YIELD</th><th style={th}>LAST UPDATED</th><th style={{ ...th, textAlign: "right" }}>COST / 100 PORTIONS</th>
            </tr>
          </thead>
          <tbody>
            {recents.map((r, i) => (
              <tr key={i} className="rowline">
                <td style={{ ...td, fontWeight: 600, cursor: "pointer", color: C.indigo }} onClick={() => go("create")}>{r[0]}</td>
                <td style={td}>
                  <span className="chip" style={r[1] === "Approved" ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{r[1]}</span>
                </td>
                <td style={{ ...td, color: C.muted }}>{r[2]}</td>
                <td style={{ ...td, color: C.muted }}>{r[3]}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const th = { padding: "6px 10px" };
const td = { padding: "12px 10px", fontSize: 13.5 };

// ==================== SCREENS 2–7: CREATE FLOW ====================
function CreateFlow(props) {
  const { step, setStep, importStep, setImportStep } = props;
  // Import branch takes over the create area when active
  if (importStep) return <ImportFlow {...props} />;
  return (
    <div>
      <Stepline active={stepIndex(step)} />
      {step === "choose" && <Capture setStep={setStep} startImport={() => setImportStep("choose")} />}
      {step === "captured" && <Captured setStep={setStep} />}
      {step === "analysis" && <Analysis setStep={setStep} />}
      {step === "clarify" && <Clarify {...props} />}
      {step === "pricing" && <Pricing {...props} />}
      {step === "knowledge" && <Knowledge {...props} />}
      {step === "standard" && <Standard {...props} captureData={buildStandardCaptureData(props)} captureBaseYield="150 portions" captureBatchFormat="Event batch" captureMethod={CAPTURE_METHOD} />}
    </div>
  );
}
const stepIndex = (s) => ({ choose: 0, captured: 0, analysis: 1, clarify: 1, pricing: 1, knowledge: 1, standard: 2 }[s]);

// Screen 2 — capture options
function Capture({ setStep, startImport }) {
  const [picked, setPicked] = useState("speak");
  const opts = [
    { id: "speak", icon: Mic, t: "Speak Recipe", d: "Record or describe the recipe by voice." },
    { id: "type", icon: Keyboard, t: "Type or Paste", d: "Enter or paste the recipe" },
    { id: "photo", icon: Camera, t: "Upload Photo", d: "Ingredient packaging or notes" },
    { id: "import", icon: FileUp, t: "Import Existing", d: "Excel, CSV or document" },
  ];
  const next = () => { if (picked === "import") startImport(); else setStep("captured"); };
  return (
    <div className="card" style={{ padding: 26, maxWidth: 820, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, textAlign: "center" }}>Create a new recipe</h2>
      <p style={{ margin: "0 0 22px", color: C.muted, textAlign: "center", fontSize: 14 }}>
        Speak, type and photo can be combined in one session. Already have a recipe? Import it instead.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {opts.map((o) => {
          const Icon = o.icon; const on = picked === o.id;
          return (
            <button key={o.id} onClick={() => setPicked(o.id)}
              style={{
                textAlign: "left", padding: 16, borderRadius: 14, border: `2px solid ${on ? C.indigo : C.line}`,
                background: on ? C.indigoSoft : "#fff",
              }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: on ? C.indigo : C.indigoSoft, display: "grid", placeItems: "center", marginBottom: 12 }}>
                <Icon size={20} color={on ? "#fff" : C.indigo} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.t}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{o.d}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button className="gbtn">Cancel</button>
        <button className="pbtn" onClick={next}>Next <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

// ===== BRANCH A: Import existing structured recipe =====
function ImportFlow(props) {
  const { importStep, setImportStep, importClarified, setImportClarified, setStep, go } = props;

  const structured = [
    { name: "Parboiled Rice", qty: "25 kg", ok: true },
    { name: "Tomatoes (800 g tin)", qty: "2 tins", ok: true },
    { name: "Vegetable Oil", qty: "2.5 L", ok: true },
    { name: "Onions", qty: "3 kg", ok: true },
    { name: "Seasoning Cube", qty: "5 pcs", ok: true },
    { name: "Stock", qty: "1 bag", ok: false }, // the single ambiguous field
  ];
  const resolvedCount = structured.filter((r) => r.ok).length + (importClarified ? 1 : 0);

  const reset = () => { setImportStep(null); setImportClarified(false); };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Stepline active={importStep === "done" ? 3 : importStep === "analysed" ? 1 : 0} />

      {importStep === "choose" && (
        <div className="card" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FileUp size={18} color={C.indigo} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Import existing recipe</h2>
          </div>
          <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Upload a spreadsheet or document. I2C reads the structure and only asks about anything that's still unclear.</p>
          <div style={{ border: `2px dashed ${C.indigo}`, borderRadius: 14, background: C.indigoSoft, padding: "34px 20px", textAlign: "center" }}>
            <FileUp size={30} color={C.indigo} />
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 15 }}>Drop a file or choose one</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Excel, CSV, Word or PDF · demo file provided</div>
            <button className="pbtn" style={{ marginTop: 16 }} onClick={() => setImportStep("analysed")}>
              <FileUp size={15} /> Upload “Jollof_Rice_recipe.xlsx”
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button className="gbtn" onClick={reset}>Back to capture</button>
          </div>
        </div>
      )}

      {importStep === "analysed" && (
        <div className="card" style={{ padding: 26 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Import analysed — Jollof_Rice_recipe.xlsx</h2>
          <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 14 }}>
            This recipe is mostly structured already, so most of it needs no clarification.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <span className="chip" style={{ color: C.green, background: C.greenSoft, fontSize: 12, padding: "5px 11px" }}>{structured.filter(r => r.ok).length} fields ready</span>
            <span className="chip" style={{ color: importClarified ? C.green : C.amber, background: importClarified ? C.greenSoft : C.amberSoft, fontSize: 12, padding: "5px 11px" }}>
              {importClarified ? "0 fields need clarification" : "1 field needs clarification"}
            </span>
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
            {structured.map((r, i) => {
              const done = r.ok || importClarified;
              return (
                <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${C.line}` : "none", background: !r.ok && !importClarified ? C.amberSoft : "#fff" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", marginRight: 12, background: done ? C.greenSoft : "#fff", border: done ? "none" : `1px solid #fde68a` }}>
                    {done ? <Check size={14} color={C.green} /> : <AlertTriangle size={14} color={C.amber} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{r.name}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: done ? C.ink : C.amber }}>
                    {r.ok ? r.qty : importClarified ? "5 L (Chicken Stock)" : '"1 bag" — unclear'}
                  </div>
                </div>
              );
            })}
          </div>

          {!importClarified ? (
            <div style={{ marginTop: 16, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Clarify: “Stock — 1 bag”</div>
              <div style={{ color: C.muted, fontSize: 13, margin: "3px 0 12px" }}>Only this field is ambiguous. What does one bag of stock mean here?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["5 L (Chicken Stock)", "2.5 L", "10 L"].map((o, idx) => (
                  <button key={o} onClick={() => setImportClarified(true)}
                    style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${idx === 0 ? C.indigo : C.line}`, background: idx === 0 ? C.indigoSoft : "#fff", fontWeight: 600, fontSize: 13, color: idx === 0 ? C.indigoDeep : C.ink }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, background: C.greenSoft, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: C.green, fontWeight: 600 }}>
              ✓ All fields resolved. This recipe is ready to use — no full clarification journey needed.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button className="gbtn" onClick={() => setImportStep("choose")}>Back</button>
            <button className="pbtn" disabled={!importClarified} onClick={() => setImportStep("done")}
              style={{ opacity: importClarified ? 1 : .5, cursor: importClarified ? "pointer" : "not-allowed" }}>
              Finish import <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {importStep === "done" && (
        <div className="card" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Check size={18} color={C.green} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Recipe imported</h2>
          </div>
          <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 14 }}>
            Jollof Rice is now in your library and connected to Ingredients &amp; Suppliers, so costing, scaling, production, reports, versioning and staff access all work.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            {[["Costing", Calculator], ["Scaling", CalendarRange], ["Staff access", Users]].map(([t, Icon]) => (
              <div key={t} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={16} color={C.indigo} /><span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="gbtn" onClick={reset}>Import another</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="gbtn" onClick={() => { reset(); go("costing"); }}>Go to costing</button>
              <button className="pbtn" onClick={() => { reset(); go("recipes"); }}>View in Recipes <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Screen 3 — informal capture (voice + photo + note)
function Captured({ setStep }) {
  const [note, setNote] = useState("For our jollof rice, use one bag of rice, two big tins of tomato paste, two boxes of tatashe, one box of fresh tomatoes, a quarter box of Scotch bonnet, 3 kg of white onions, half a drum of vegetable oil, 4 jugs of chicken stock, 1 sachet of curry, 1 sachet of thyme, half a sachet of chicken seasoning powder, some bay leaves and salt to taste. This makes our normal 150-guest event batch. First wash the rice and leave it to drain. Blend the tatashe, tomatoes and Scotch bonnet. Heat the oil, add the chopped onions and fry the tomato paste, then add the blended pepper and let everything cook down properly. Add the curry, thyme, chicken seasoning, bay leaves and some of the salt. Add the chicken stock and let it come together, then add the rice. Cover it and cook until the rice is done and has absorbed the sauce. Check the salt towards the end and adjust if needed.");
  const [photo, setPhoto] = useState({ name: "rice-25kg.jpg", url: null }); // seeded demo photo
  const fileRef = React.useRef(null);
  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto({ name: f.name, url });
  };
  return (
    <div className="card" style={{ padding: 26, maxWidth: 820, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>Captured recipe</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.indigoSoft, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <button style={{ width: 42, height: 42, borderRadius: 99, border: "none", background: C.indigo, display: "grid", placeItems: "center" }}><Play size={18} color="#fff" /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.indigoDeep, marginBottom: 6 }}>Spoken recipe · 01:33</div>
          <div style={{ height: 6, background: "#c7d2fe", borderRadius: 99, position: "relative" }}><div style={{ width: "38%", height: "100%", background: C.indigo, borderRadius: 99 }} /></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Transcript / typed note (editable)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13.5, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
        </div>
        <div style={{ width: 150 }}>
          <label style={lbl}>Packaging photo</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            title="Click to upload a photo"
            style={{ width: "100%", border: `1px dashed ${C.indigo}`, borderRadius: 10, height: 96, background: photo.url ? "#000" : C.indigoSoft, color: C.indigo, fontSize: 11, textAlign: "center", padding: 0, overflow: "hidden", position: "relative" }}>
            {photo.url ? (
              <>
                <img src={photo.url} alt="packaging" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.55)", color: "#fff", padding: "3px 4px", fontSize: 10 }}>Change photo</span>
              </>
            ) : (
              <span style={{ display: "grid", placeItems: "center", height: "100%" }}><span><Camera size={22} /><br />{photo.name}<br /><span style={{ opacity: .7 }}>Click to upload</span></span></span>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="gbtn" onClick={() => setStep("choose")}>Back</button>
        <button className="pbtn" onClick={() => setStep("analysis")}><Sparkles size={16} /> Analyse recipe</button>
      </div>
    </div>
  );
}
const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 };
const subInput = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 500 };

// Screen 4 — analysis result (clear vs unclear)
function Analysis({ setStep }) {
  const clear = ["White onions — 3 kg"];
  const unclear = [
    '"one bag of rice" — bag size undefined',
    '"two big tins of tomato paste" — tin size undefined',
    '"two boxes of tatashe" — ingredient meaning and box size undefined',
    '"one box of fresh tomatoes" — box size undefined',
    '"quarter box of Scotch bonnet" — box size undefined',
    '"half a drum of vegetable oil" — drum size undefined',
    '"four jugs of chicken stock" — jug size undefined',
    '"one sachet of curry" — sachet size undefined',
    '"one sachet of thyme" — sachet size undefined',
    '"half sachet of chicken seasoning powder" — sachet size undefined',
    '"some bay leaves" — quantity undefined',
    '"salt to taste" — quantity undefined',
  ];
  return (
    <div className="card" style={{ padding: 26, maxWidth: 820, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Analysis complete</h2>
      <p style={{ margin: "0 0 20px", color: C.muted, fontSize: 14 }}>We separated what's clear from what needs your confirmation. I2C won't guess quantities.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, background: C.greenSoft }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Check size={15} /> Clear ({clear.length})</div>
          {clear.map((x) => <div key={x} style={{ fontSize: 13, padding: "6px 0", color: C.ink }}>{x}</div>)}
        </div>
        <div style={{ border: `1px solid #fde68a`, borderRadius: 12, padding: 16, background: C.amberSoft }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.amber, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={15} /> Needs clarification ({unclear.length})</div>
          {unclear.map((x) => <div key={x} style={{ fontSize: 13, padding: "6px 0", color: C.ink }}>{x}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
        <button className="gbtn" onClick={() => setStep("captured")}>Back</button>
        <button className="pbtn" onClick={() => setStep("clarify")}>Resolve {unclear.length} items <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

// Screen 5 + 6 — clarification with "Remember this" (the differentiator)
function halveWeight(s) {
  const m = /([\d.]+)\s*(g|kg)/i.exec(s || "");
  if (!m) return "";
  const half = parseFloat(m[1]) / 2;
  const unit = m[2].toLowerCase();
  return `${half % 1 === 0 ? half : half.toFixed(1)} ${unit}`;
}

function ClarifyPhoto({ id, clarifyPhotos, setClarifyPhotos }) {
  const fileRef = React.useRef(null);
  const photo = clarifyPhotos[id];
  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setClarifyPhotos({ ...clarifyPhotos, [id]: { name: f.name, url } });
  };
  return (
    <div style={{ marginTop: 10 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      <button onClick={() => fileRef.current && fileRef.current.click()}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px dashed ${C.indigo}`, borderRadius: 8, padding: "6px 12px", background: photo ? C.indigoSoft : "#fff", color: C.indigo, fontSize: 12.5, fontWeight: 600 }}>
        <Camera size={14} /> {photo ? `Photo added: ${photo.name}` : "Take / upload packaging photo"}
      </button>
    </div>
  );
}

function Clarify({ clarify, setClarify, remember, setRemember, clarifyPhotos, setClarifyPhotos, setStep }) {
  const Q = [
    { id: "rice", field: "rice", q: '"one bag of rice"', sub: "Which size bag do you usually use?", opts: ["25 kg bag", "50 kg bag", "10 kg bag"] },
    { id: "tomatoPaste", field: "tomatoPaste", q: '"two big tins of tomato paste"', sub: "Which tomato paste tin size do you mean?", opts: ["2.2 kg tin", "800 g tin", "400 g tin"] },
    { id: "tatashe", field: "tatashe", q: '"two boxes of tatashe"', sub: "Tatashe (red bell pepper) — which box size do you mean?", opts: ["5 kg box", "10 kg box", "2.5 kg box"] },
    { id: "freshTomatoes", field: "freshTomatoes", q: '"one box of fresh tomatoes"', sub: "Which box size do you mean?", opts: ["6 kg box", "10 kg box", "3 kg box"] },
    { id: "scotchBonnet", field: "scotchBonnet", q: '"quarter box of Scotch bonnet"', sub: "How much is a quarter box?", opts: ["500 g", "1 kg", "250 g"] },
    { id: "oil", field: "oil", q: '"half a drum of vegetable oil"', sub: "How much is half a drum?", opts: ["10 L", "12.5 L", "20 L"] },
    { id: "chickenStock", field: "chickenStock", q: '"four jugs of chicken stock"', sub: "What size is the jug you use?", opts: ["1 L", "2 L", "500 ml"] },
    { id: "curry", field: "curry", q: '"one sachet of curry"', sub: "What size is the sachet you use?", opts: ["50 g", "100 g", "250 g", "Other / Enter weight"] },
    { id: "thyme", field: "thyme", q: '"one sachet of thyme"', sub: "What size is the sachet you use?", opts: ["25 g", "50 g", "100 g", "Other / Enter weight"] },
    { id: "chickenSeasoning", field: "chickenSeasoningFull", deriveHalf: true, q: '"half sachet of chicken seasoning powder"', sub: "What size is one full sachet?", opts: ["50 g", "100 g", "250 g", "Other / Enter weight"] },
    { id: "bayLeaves", field: "bayLeaves", q: '"some bay leaves"', sub: "How many bay leaves do you normally use for this 150-guest batch?", opts: ["10 leaves", "15 leaves", "20 leaves", "Other / Enter number"], photo: false, remember: false },
  ];
  const isOtherOpt = (o) => /^Other/.test(o);
  const updateField = (item, value) => {
    const next = { ...clarify, [item.field]: value };
    if (item.deriveHalf) next.chickenSeasoning = halveWeight(value);
    setClarify(next);
  };
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Smart clarification</h2>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Confirm each item. Turn on “Remember” to reuse it automatically next time — this is your business knowledge.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Q.map((item) => {
          const presetOpts = item.opts.filter((o) => !isOtherOpt(o));
          const currentVal = clarify[item.field];
          const hasOther = item.opts.some(isOtherOpt);
          const isCustom = hasOther && !presetOpts.includes(currentVal);
          const showPhoto = item.photo !== false;
          const showRemember = item.remember !== false;
          return (
            <div key={item.id} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{item.q}</div>
              <div style={{ color: C.muted, fontSize: 13, margin: "3px 0 12px" }}>{item.sub}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {item.opts.map((o) => {
                  const isOther = isOtherOpt(o);
                  const on = isOther ? isCustom : currentVal === o;
                  return (
                    <button key={o} onClick={() => updateField(item, isOther ? "" : o)}
                      style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${on ? C.indigo : C.line}`, background: on ? C.indigoSoft : "#fff", fontWeight: 600, fontSize: 13, color: on ? C.indigoDeep : C.ink }}>
                      {on && <Check size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />}{o}
                    </button>
                  );
                })}
              </div>
              {isCustom && (
                <input autoFocus placeholder={item.id === "bayLeaves" ? "e.g. 12 leaves" : "e.g. 70 g"} value={currentVal}
                  onChange={(e) => updateField(item, e.target.value)}
                  style={{ marginTop: 10, width: "100%", border: `1.5px solid ${C.indigo}`, borderRadius: 8, padding: "8px 11px", fontSize: 13.5, fontFamily: "inherit" }} />
              )}
              {item.deriveHalf && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: C.indigoDeep, background: C.indigoSoft, borderRadius: 8, padding: "8px 10px" }}>
                  I2C will use <b>{clarify.chickenSeasoning || "—"}</b> (half of the {clarify.chickenSeasoningFull || "confirmed"} sachet) for this recipe — calculated automatically.
                </div>
              )}
              {showPhoto && <ClarifyPhoto id={item.id} clarifyPhotos={clarifyPhotos} setClarifyPhotos={setClarifyPhotos} />}
              {showRemember && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, fontSize: 13, fontWeight: 600, color: C.ink, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!remember[item.id]} onChange={(e) => setRemember({ ...remember, [item.id]: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.indigo }} />
                  Remember this for my business
                </label>
              )}
            </div>
          );
        })}

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>"salt to taste"</div>
          <div style={{ color: C.muted, fontSize: 13, margin: "3px 0 12px" }}>To make this recipe reproducible, approximately how much salt do you normally use for this 150-guest batch?</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Amount</span>
              <input type="number" min="0" step="0.1" value={clarify.saltAmount}
                onChange={(e) => setClarify({ ...clarify, saltAmount: e.target.value })}
                style={{ width: 80, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "7px 9px", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Unit</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["g", "kg", "tbsp", "Other"].map((u) => {
                  const on = clarify.saltUnit === u;
                  return (
                    <button key={u} onClick={() => setClarify({ ...clarify, saltUnit: u })}
                      style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${on ? C.indigo : C.line}`, background: on ? C.indigoSoft : "#fff", fontWeight: 600, fontSize: 13, color: on ? C.indigoDeep : C.ink }}>
                      {on && <Check size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />}{u}
                    </button>
                  );
                })}
              </div>
            </div>
            {clarify.saltUnit === "Other" && (
              <input autoFocus placeholder="e.g. pinches" value={clarify.saltUnitOther || ""}
                onChange={(e) => setClarify({ ...clarify, saltUnitOther: e.target.value })}
                style={{ width: 130, border: `1.5px solid ${C.indigo}`, borderRadius: 8, padding: "7px 9px", fontSize: 13.5, fontFamily: "inherit" }} />
            )}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Info size={13} style={{ marginTop: 1 }} />
            This will be saved for this recipe so another team member can reproduce the same batch.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button className="gbtn" onClick={() => setStep("analysis")}>Back</button>
        <button className="pbtn" onClick={() => setStep("pricing")}>Confirm all <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

// NEW STEP — Ingredient costs (pricing origin for a first-time user with no catalogue)
function toLitres(s) {
  const m = /([\d.]+)\s*(ml|l)\b/i.exec(s || "");
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return /ml/i.test(m[2]) ? n / 1000 : n;
}
function parseLeavesCount(s) {
  const m = /([\d.]+)/.exec(s || "");
  return m ? parseFloat(m[1]) : 0;
}
function saltGrams(amount, unit) {
  const n = parseFloat(amount) || 0;
  if (unit === "kg") return n * 1000;
  if (unit === "tbsp") return n * 18; // approx grams per tablespoon of salt
  return n; // "g" or "Other" — best effort
}
function scaleWeightStr(s, factor) {
  const m = /([\d.]+)\s*(kg|g)\b/i.exec(s || "");
  if (!m) return s;
  const val = Math.round(parseFloat(m[1]) * factor * 100) / 100;
  return `${val} ${m[2].toLowerCase()}`;
}
function packSizeLitres(choice, other) {
  if (choice === "1 L") return 1;
  if (choice === "5 L") return 5;
  if (choice === "Other") return parseFloat(other) || 0;
  return 0;
}
// Scripted output of the "Create sub-recipe" flow — this prototype's costing values
// are pre-scripted demo data, consistent with the rest of the capture flow.
const SUB_RECIPE_YIELD_L = 10;
const SUB_RECIPE_BATCH_COST = 31.41;

// Builds the ingredient/cost rows for the Standard-recipe review at the end of the
// capture flow, from the same clarify/pricing state as the Ingredient costs step —
// kept separate from baseIngredients/USE_FRAC, which belong to the pre-existing
// persisted Jollof Rice recipe shown elsewhere (Recipes, Costing, Reports).
function buildStandardCaptureData({ clarify, packPrices, subs, stockSupply, stockSourceMode, stockLinkedName, stockPackSize, stockPackSizeOther }) {
  const parseWeight = (s, factor) => {
    const m = /([\d.]+)\s*(kg|g)\b/i.exec(s || "");
    if (!m) return { amount: 0, unit: "g" };
    return { amount: Math.round(parseFloat(m[1]) * factor * 100) / 100, unit: m[2].toLowerCase() };
  };
  const priceFrac = (name, frac) => (packPrices[name] || 0) * frac;
  const saltUnitLabel = clarify.saltUnit === "Other" ? (clarify.saltUnitOther || "unit") : clarify.saltUnit;
  const bayLeavesCount = parseLeavesCount(clarify.bayLeaves);
  const rice = parseWeight(clarify.rice, 1);
  const tomatoPaste = parseWeight(clarify.tomatoPaste, 2);
  const tatashe = parseWeight(clarify.tatashe, 2);
  const freshTomatoes = parseWeight(clarify.freshTomatoes, 1);
  const scotchBonnet = parseWeight(clarify.scotchBonnet, 1);
  const curry = parseWeight(clarify.curry, 1);
  const thyme = parseWeight(clarify.thyme, 1);
  const chickenSeasoning = parseWeight(clarify.chickenSeasoning, 1);

  const rows = [
    { name: "Parboiled Rice", amount: rice.amount, unit: rice.unit, cost: priceFrac("Rice (Parboiled)", 1) },
    { name: "Tomato Paste", amount: tomatoPaste.amount, unit: tomatoPaste.unit, cost: priceFrac("Tomato Paste", 2) },
    { name: "Tatashe", amount: tatashe.amount, unit: tatashe.unit, cost: priceFrac("Tatashe (Red Bell Pepper)", 2) },
    { name: "Fresh Tomatoes", amount: freshTomatoes.amount, unit: freshTomatoes.unit, cost: priceFrac("Fresh Tomatoes", 1) },
    { name: "Scotch Bonnet", amount: scotchBonnet.amount, unit: scotchBonnet.unit, cost: priceFrac("Scotch Bonnet", 0.25) },
    { name: "White Onions", amount: 3, unit: "kg", cost: priceFrac("White Onions", 0.3) },
    { name: "Vegetable Oil", amount: toLitres(clarify.oil), unit: "L", cost: priceFrac("Vegetable Oil", 0.5) },
    { name: "Curry Powder", amount: curry.amount, unit: curry.unit, cost: priceFrac("Curry Powder", 1) },
    { name: "Thyme", amount: thyme.amount, unit: thyme.unit, cost: priceFrac("Thyme", 1) },
    { name: "Chicken Seasoning Powder", amount: chickenSeasoning.amount, unit: chickenSeasoning.unit, cost: priceFrac("Chicken Seasoning Powder", 0.5) },
    { name: "Bay Leaves", amount: bayLeavesCount, unit: "leaves", cost: priceFrac("Bay Leaves", bayLeavesCount / 50) },
    { name: "Salt", amount: parseFloat(clarify.saltAmount) || 0, unit: saltUnitLabel, cost: priceFrac("Cooking Salt", saltGrams(clarify.saltAmount, clarify.saltUnit) / 750) },
  ];

  const totalStockL = toLitres(clarify.chickenStock) * 4;
  const subRecipeCostPerL = SUB_RECIPE_BATCH_COST / SUB_RECIPE_YIELD_L;
  const linkedExistingUnitCost = stockLinkedName && subs && subs[stockLinkedName] ? subUnitCost(subs[stockLinkedName]) : 0;
  const stockSourced = stockSupply === "inhouse" && (stockSourceMode === "created-new" || stockSourceMode === "linked-existing");
  const stockUnitCost = stockSourceMode === "created-new" ? subRecipeCostPerL : stockSourceMode === "linked-existing" ? linkedExistingUnitCost : 0;
  const stockPackL = packSizeLitres(stockPackSize, stockPackSizeOther);
  const stockCost = stockSourced ? stockUnitCost * totalStockL
    : stockSupply === "purchased" && stockPackL > 0 ? ((packPrices["Chicken Stock"] || 0) / stockPackL) * totalStockL
    : 0;
  rows.push({ name: "Chicken Stock", amount: totalStockL, unit: "L", cost: stockCost, isSub: true });

  const total = rows.reduce((s, r) => s + Math.round(r.cost * 100) / 100, 0);

  const stockSub = stockSourced ? (
    stockSourceMode === "created-new"
      ? { name: "Chicken Stock", batchYield: SUB_RECIPE_YIELD_L, batchUnit: "L", batchCost: SUB_RECIPE_BATCH_COST, usedL: totalStockL, usedCost: stockCost }
      : { name: stockLinkedName, batchYield: subs[stockLinkedName].yieldQty, batchUnit: subs[stockLinkedName].yieldUnit, batchCost: subBatchCost(subs[stockLinkedName]), usedL: totalStockL, usedCost: stockCost }
  ) : null;

  return { rows, total, stockSub };
}

function Pricing({
  packPrices, setPackPrices, clarify, subs,
  stockSupply, setStockSupply,
  stockSourceMode, setStockSourceMode,
  stockLinkedName, setStockLinkedName,
  stockPackSize, setStockPackSize,
  stockPackSizeOther, setStockPackSizeOther,
  setStep,
}) {
  const [sourceModal, setSourceModal] = useState(null); // null | "choose" | "create"
  const [linkPicker, setLinkPicker] = useState(false);

  // pack context: how much a pack costs and how much the recipe uses, so we can show derived batch cost.
  const saltUnitLabel = clarify.saltUnit === "Other" ? (clarify.saltUnitOther || "unit") : clarify.saltUnit;
  const packMeta = {
    "Rice (Parboiled)":          { pack: clarify.rice,          use: scaleWeightStr(clarify.rice, 1),          useFrac: 1 },
    "Tomato Paste":               { pack: clarify.tomatoPaste,   use: scaleWeightStr(clarify.tomatoPaste, 2),   useFrac: 2 },
    "Tatashe (Red Bell Pepper)":  { pack: clarify.tatashe,       use: scaleWeightStr(clarify.tatashe, 2),       useFrac: 2 },
    "Fresh Tomatoes":             { pack: clarify.freshTomatoes, use: scaleWeightStr(clarify.freshTomatoes, 1), useFrac: 1 },
    "Scotch Bonnet":              { pack: "2 kg box",            use: clarify.scotchBonnet,                     useFrac: 0.25 },
    "White Onions":                { pack: "10 kg sack",          use: "3 kg",                                    useFrac: 0.3 },
    "Vegetable Oil":              { pack: "20 L drum",           use: clarify.oil,                              useFrac: 0.5 },
    "Curry Powder":                { pack: `${clarify.curry} sachet`, use: clarify.curry,                        useFrac: 1 },
    "Thyme":                      { pack: `${clarify.thyme} sachet`,  use: clarify.thyme,                        useFrac: 1 },
    "Chicken Seasoning Powder":   { pack: `${clarify.chickenSeasoningFull} sachet`, use: clarify.chickenSeasoning, useFrac: 0.5 },
    "Bay Leaves":                  { pack: "50-leaf pack",        use: clarify.bayLeaves,                        useFrac: parseLeavesCount(clarify.bayLeaves) / 50 },
    "Cooking Salt":                { pack: "750 g pack",          use: `${clarify.saltAmount} ${saltUnitLabel}`, useFrac: saltGrams(clarify.saltAmount, clarify.saltUnit) / 750 },
  };
  const names = Object.keys(packMeta);
  const set = (n, val) => setPackPrices({ ...packPrices, [n]: val === "" ? 0 : Math.max(0, parseFloat(val) || 0) });
  const lineCost = (n) => (packPrices[n] || 0) * packMeta[n].useFrac;

  // Chicken Stock is costed differently depending on how it's sourced, so it's kept
  // out of packMeta and rendered as its own block (the "sub-recipe layer").
  const jugL = toLitres(clarify.chickenStock);
  const totalStockL = jugL * 4;
  const subRecipeCostPerL = SUB_RECIPE_BATCH_COST / SUB_RECIPE_YIELD_L;
  const linkedExistingUnitCost = stockLinkedName && subs && subs[stockLinkedName] ? subUnitCost(subs[stockLinkedName]) : 0;
  const stockUnitCost = stockSourceMode === "created-new" ? subRecipeCostPerL
    : stockSourceMode === "linked-existing" ? linkedExistingUnitCost
    : 0;
  const stockPackL = packSizeLitres(stockPackSize, stockPackSizeOther);
  const stockSourced = stockSupply === "inhouse" && (stockSourceMode === "created-new" || stockSourceMode === "linked-existing");
  const stockPriced = stockSourced || (stockSupply === "purchased" && stockPackL > 0 && (packPrices["Chicken Stock"] || 0) > 0);
  const stockCost = stockSourced ? stockUnitCost * totalStockL
    : stockSupply === "purchased" && stockPackL > 0 ? ((packPrices["Chicken Stock"] || 0) / stockPackL) * totalStockL
    : 0;

  const total = names.reduce((s, n) => s + Math.round(lineCost(n) * 100) / 100, 0) + Math.round(stockCost * 100) / 100;
  const anyEntered = names.some((n) => packPrices[n] > 0) || stockPriced;
  const allEntered = names.every((n) => packPrices[n] > 0) && stockPriced;

  const openSourceChoice = () => { setSourceModal("choose"); setLinkPicker(false); };
  const linkExisting = (name) => { setStockLinkedName(name); setStockSourceMode("linked-existing"); setSourceModal(null); setLinkPicker(false); };
  const saveNewSubRecipe = () => { setStockSourceMode("created-new"); setSourceModal(null); };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Calculator size={18} color={C.indigo} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Ingredient costs</h2>
      </div>
      <p style={{ margin: "0 0 4px", color: C.muted, fontSize: 14 }}>
        Prices below are pulled from your ingredient catalogue where available — edit any of them here.
        {!stockPriced && " Chicken Stock still needs a costing decision."}
      </p>

      <div className="card" style={{ padding: 4, marginTop: 14 }}>
        <table>
          <thead><tr style={{ color: C.muted, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
            <th style={th}>INGREDIENT</th><th style={th}>PACK</th><th style={th}>USED IN RECIPE</th>
            <th style={{ ...th }}>PACK PRICE (£)</th><th style={{ ...th, textAlign: "right" }}>RECIPE COST</th>
          </tr></thead>
          <tbody>
            {names.map((n) => {
              const has = packPrices[n] > 0;
              return (
                <tr key={n} className="rowline">
                  <td style={{ ...td, fontWeight: 600 }}>{n}</td>
                  <td style={{ ...td, color: C.muted }}>{packMeta[n].pack}</td>
                  <td style={{ ...td, color: C.muted }}>{packMeta[n].use}</td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${has ? C.indigo : C.line}`, borderRadius: 8, padding: "5px 9px", width: 120, background: "#fff" }}>
                      <span style={{ color: C.muted, fontSize: 13 }}>£</span>
                      <input
                        type="number" min="0" step="0.01" inputMode="decimal"
                        value={packPrices[n] ? packPrices[n] : ""}
                        placeholder="0.00"
                        onChange={(e) => set(n, e.target.value)}
                        style={{ border: "none", outline: "none", width: "100%", fontSize: 13.5, fontWeight: 600, color: C.ink }}
                      />
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: has ? C.ink : C.muted }}>
                    {money(lineCost(n))}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={5} style={{ padding: "14px 10px 10px", borderTop: `1px solid ${C.line}` }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>Chicken Stock — {totalStockL} L</div>
                {stockSourced ? (
                  <div style={{ fontSize: 12.5, color: C.muted }}>
                    Sourced: {stockSourceMode === "created-new" ? "House-made · Sub-recipe" : `Linked sub-recipe (${stockLinkedName})`}
                    {" · "}
                    <button onClick={openSourceChoice} style={{ background: "none", border: "none", color: C.indigo, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12.5 }}>Change</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 8 }}>How is this stock supplied?</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[["purchased", "Store-bought / purchased"], ["inhouse", "Made in house"]].map(([val, label]) => {
                        const on = stockSupply === val;
                        return (
                          <button key={val} onClick={() => { setStockSupply(val); if (val === "inhouse") openSourceChoice(); }}
                            style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${on ? C.indigo : C.line}`, background: on ? C.indigoSoft : "#fff", fontWeight: 600, fontSize: 13, color: on ? C.indigoDeep : C.ink }}>
                            {on && <Check size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />}{label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </td>
            </tr>
            {stockSupply === "purchased" && (
              <tr className="rowline">
                <td style={{ ...td, fontWeight: 600 }}>Chicken Stock (store-bought)</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["1 L", "5 L", "Other"].map((opt) => {
                      const on = stockPackSize === opt;
                      return (
                        <button key={opt} onClick={() => setStockPackSize(opt)}
                          style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${on ? C.indigo : C.line}`, background: on ? C.indigoSoft : "#fff", fontSize: 12, fontWeight: 600, color: on ? C.indigoDeep : C.ink }}>
                          {opt === "Other" ? "Other" : `${opt} carton`}
                        </button>
                      );
                    })}
                  </div>
                  {stockPackSize === "Other" && (
                    <input placeholder="litres" value={stockPackSizeOther} onChange={(e) => setStockPackSizeOther(e.target.value)}
                      style={{ marginTop: 6, width: 90, border: `1.5px solid ${C.indigo}`, borderRadius: 7, padding: "4px 8px", fontSize: 12.5, fontFamily: "inherit" }} />
                  )}
                </td>
                <td style={{ ...td, color: C.muted }}>{totalStockL} L</td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${(packPrices["Chicken Stock"] || 0) > 0 ? C.indigo : C.line}`, borderRadius: 8, padding: "5px 9px", width: 120, background: "#fff" }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>£</span>
                    <input
                      type="number" min="0" step="0.01" inputMode="decimal"
                      value={packPrices["Chicken Stock"] ? packPrices["Chicken Stock"] : ""}
                      placeholder="0.00"
                      onChange={(e) => set("Chicken Stock", e.target.value)}
                      style={{ border: "none", outline: "none", width: "100%", fontSize: 13.5, fontWeight: 600, color: C.ink }}
                    />
                  </div>
                </td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700, color: stockCost > 0 ? C.ink : C.muted }}>
                  {money(stockCost)}
                </td>
              </tr>
            )}
            {stockSourced && (
              <tr className="rowline">
                <td style={{ ...td, fontWeight: 600 }}>Chicken Stock</td>
                <td style={{ ...td, color: C.muted }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.indigoSoft, color: C.indigoDeep, borderRadius: 999, padding: "3px 9px", fontSize: 11.5, fontWeight: 700 }}>
                    <Link2 size={11} /> {stockSourceMode === "created-new" ? "House-made · Sub-recipe" : "Linked sub-recipe"}
                  </span>
                </td>
                <td style={{ ...td, color: C.muted }}>{totalStockL} L</td>
                <td style={{ ...td, color: C.muted }}>—</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700, color: C.ink }}>
                  {money(stockCost)}
                </td>
              </tr>
            )}
            <tr style={{ borderTop: `2px solid ${C.ink}` }}>
              <td style={{ ...td, fontWeight: 800 }} colSpan={4}>ESTIMATED BATCH COST (150-guest event batch)</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 800, color: anyEntered ? C.indigo : C.muted }}>{money(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
        {allEntered ? "All prices entered — recipe costing is ready." : anyEntered ? "Cost updates as you enter prices. Chicken Stock stays uncosted until you choose how it's supplied." : "Every cost is £0.00 until you add a price."}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button className="gbtn" onClick={() => setStep("clarify")}>Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="gbtn" onClick={() => setStep("knowledge")}>Skip for now</button>
          <button className="pbtn" onClick={() => setStep("knowledge")}>Continue <ArrowRight size={16} /></button>
        </div>
      </div>

      {sourceModal === "choose" && (
        <Modal onClose={() => setSourceModal(null)}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Chicken Stock</div>
          <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 18 }}>{totalStockL} L is used in this Jollof Rice recipe.</div>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>How would you like to cost it?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => setLinkPicker(!linkPicker)} className="card" style={{ textAlign: "left", padding: 14, cursor: "pointer", border: `1.5px solid ${linkPicker ? C.indigo : C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><Link2 size={15} color={C.indigo} /> Link existing sub-recipe</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>Use a Chicken Stock recipe already saved in your recipe library.</div>
            </button>
            {linkPicker && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 6 }}>
                {subs && Object.keys(subs).length ? Object.keys(subs).map((name) => (
                  <button key={name} onClick={() => linkExisting(name)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 12.5, fontWeight: 600 }}>
                    {name}
                  </button>
                )) : (
                  <div style={{ fontSize: 12.5, color: C.muted }}>No saved sub-recipes yet.</div>
                )}
              </div>
            )}
            <button onClick={() => setSourceModal("create")} className="card" style={{ textAlign: "left", padding: 14, cursor: "pointer", border: `1.5px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><Plus size={15} color={C.indigo} /> Create new sub-recipe</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>Add the ingredients and yield for your house-made Chicken Stock.</div>
            </button>
          </div>
        </Modal>
      )}

      {sourceModal === "create" && (
        <Modal onClose={() => setSourceModal(null)}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>Create sub-recipe</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>Name</label>
              <input defaultValue="Chicken Stock" style={subInput} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Batch yield</label>
                <input type="number" defaultValue="8" style={subInput} />
              </div>
              <div style={{ width: 90 }}>
                <label style={lbl}>Unit</label>
                <input defaultValue="L" disabled style={{ ...subInput, background: C.paper, color: C.muted }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, background: C.indigoSoft, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.muted }}>Finished yield</span><span style={{ fontWeight: 700 }}>{SUB_RECIPE_YIELD_L} L</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.muted }}>Estimated batch cost</span><span style={{ fontWeight: 700 }}>{money(SUB_RECIPE_BATCH_COST)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.muted }}>Estimated cost per litre</span><span style={{ fontWeight: 700 }}>{money(subRecipeCostPerL)}</span>
            </div>
            <div style={{ height: 1, background: "#c7d2fe", margin: "12px 0" }} />
            <div style={{ fontSize: 12.5, color: C.indigoDeep, marginBottom: 4 }}>Jollof uses {totalStockL} L, therefore:</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.indigoDeep }}>I2C calculates = {money(subRecipeCostPerL * totalStockL)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button className="gbtn" onClick={() => setSourceModal("choose")}>Back</button>
            <button className="pbtn" onClick={saveNewSubRecipe}>Save &amp; link to Jollof Rice <ArrowRight size={16} /></button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Screen 6 — Business Knowledge saved
function Knowledge({ clarify, remember, learned, setLearned, setStep }) {
  const allRows = [
    { id: "rice", k: "One bag of rice", v: clarify.rice },
    { id: "tomatoPaste", k: '"Big tin" of tomato paste', v: clarify.tomatoPaste },
    { id: "tatasheMeaning", k: "Tatashe", v: "Red bell / long red pepper", always: true },
    { id: "tatashe", k: "One box of tatashe", v: clarify.tatashe },
    { id: "freshTomatoes", k: "One box of fresh tomatoes", v: clarify.freshTomatoes },
    { id: "scotchBonnet", k: "One box of Scotch bonnet", v: "2 kg box" },
    { id: "oil", k: "One drum of vegetable oil", v: "20 L drum" },
    { id: "chickenStock", k: "One stock jug", v: clarify.chickenStock },
    { id: "curry", k: "One curry sachet", v: clarify.curry },
    { id: "thyme", k: "One thyme sachet", v: clarify.thyme },
    { id: "chickenSeasoning", k: "One chicken-seasoning sachet", v: clarify.chickenSeasoningFull },
  ];
  const rows = allRows.filter((r) => r.always || remember[r.id]);

  React.useEffect(() => { setLearned(rows); /* eslint-disable-next-line */ }, []);

  return (
    <div className="card" style={{ padding: 26, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <BookOpen size={18} color={C.violet} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Business knowledge updated</h2>
      </div>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>
        These confirmed meanings are specific to your business and can be reused in future recipes.
      </p>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.paper }}>
              <th style={{ textAlign: "left", padding: "11px 16px", fontSize: 12, fontWeight: 700, color: C.muted, borderBottom: `1px solid ${C.line}` }}>Confirmed business meaning</th>
              <th style={{ width: 90, borderBottom: `1px solid ${C.line}` }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.k}</span>
                  <ArrowRight size={14} color={C.muted} style={{ margin: "0 8px", verticalAlign: "-2px" }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.violet, textDecoration: "underline", textDecorationColor: "#ddd6fe" }}>{r.v}</span>
                </td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>
                  <span className="chip" style={{ color: C.violet, background: "#f5f3ff" }}>Saved</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
        <button className="gbtn" onClick={() => setStep("clarify")}>Back</button>
        <button className="pbtn" onClick={() => setStep("standard")}>Create standard recipe <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

// Screen 7 — Standard Recipe + approve
// shared pack-usage fractions so Pricing and Standard agree
const USE_FRAC = {
  "Parboiled Rice": 1, "Tomatoes (800 g tin)": 2, "Oil": 0.5,
  "Onions": 0.3, "Seasoning Cube": 0.05, "Salt": 0.035,
};

function Standard({ title, onBack, approved, setApproved, packPrices = {}, pricesEntered, subs, setSubs, linkedSubs, setLinkedSubs, basePortions = 100, setBasePortions, go, captureData, captureBaseYield, captureBatchFormat, captureMethod }) {
  const [openSub, setOpenSub] = useState(null);   // sub-recipe name being viewed/edited
  const [addOpen, setAddOpen] = useState(false);  // add-sub-recipe picker
  const [creating, setCreating] = useState(false); // create-new-sub form inside the picker
  const [newSub, setNewSub] = useState({ name: "", yieldQty: "", yieldUnit: "L", use: "", ing: "", price: "" });
  const [flash, setFlash] = useState(null);       // "recosted" banner after a propagated change
  const [editYield, setEditYield] = useState(false);
  const [steps, setSteps] = useState(() => (captureMethod ? captureMethod.slice() : method.slice()));
  const [editMethod, setEditMethod] = useState(false);
  const [addStepMode, setAddStepMode] = useState(null); // null | "speak" | "type" | "photo" | "import"
  const [recordingStep, setRecordingStep] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const methodPhotoRef = React.useRef(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [staffAccess, setStaffAccess] = useState({
    ingredients: true, method: true, yield: true, allergens: true, costs: false, supplierPrices: false,
  });
  const recipeName = title || "Jollof Rice";
  const yieldFactor = basePortions / 100; // amounts in baseIngredients are defined for 100 portions
  const isCapture = !!captureData;

  const ingCost = baseIngredients.reduce((s, r) => s + (packPrices[r.name] || 0) * (USE_FRAC[r.name] || 0) * yieldFactor, 0);
  const lineCost = (name) => (packPrices[name] || 0) * (USE_FRAC[name] || 0) * yieldFactor;
  // each linked sub contributes (its unit cost) × (amount this recipe uses) × yield factor
  const subCostOf = (l) => subUnitCost(subs[l.name]) * l.use * yieldFactor;
  const subsCost = linkedSubs.reduce((s, l) => s + subCostOf(l), 0);
  const total = isCapture ? captureData.total : ingCost + subsCost;
  const pct = (c) => (total > 0 ? ((c / total) * 100).toFixed(1) : "0.0");

  // Save an edited sub-recipe price → triggers parent recost + flag
  const saveSub = (name, newIngredients) => {
    setSubs({ ...subs, [name]: { ...subs[name], ingredients: newIngredients } });
    setOpenSub(null);
    setFlash(name);
  };
  const addSub = (name) => {
    if (!linkedSubs.some((l) => l.name === name)) {
      const p = PARENTS_OF[name]?.find((x) => x.recipe === "Jollof Rice");
      setLinkedSubs([...linkedSubs, { name, use: p ? p.use : 1, unit: subs[name].yieldUnit }]);
    }
    setAddOpen(false);
  };
  // Create a brand-new sub-recipe from the mini form, register it and link it.
  const createSub = () => {
    const nm = (newSub.name || "").trim();
    if (!nm || subs[nm]) return; // need a unique name
    const yieldQty = Math.max(0.01, parseFloat(newSub.yieldQty) || 1);
    const use = Math.max(0, parseFloat(newSub.use) || 0);
    const firstIng = (newSub.ing || "").trim() || "Main ingredient";
    const price = Math.max(0, parseFloat(newSub.price) || 0);
    const sub = { name: nm, yieldQty, yieldUnit: newSub.yieldUnit, ingredients: [{ name: firstIng, qty: `${yieldQty} ${newSub.yieldUnit}`, price }] };
    setSubs({ ...subs, [nm]: sub });
    setLinkedSubs([...linkedSubs, { name: nm, use, unit: newSub.yieldUnit }]);
    setNewSub({ name: "", yieldQty: "", yieldUnit: "L", use: "", ing: "", price: "" });
    setCreating(false);
    setAddOpen(false);
  };
  const removeSub = (name) => setLinkedSubs(linkedSubs.filter((l) => l.name !== name));
  const available = Object.keys(subs).filter((n) => !linkedSubs.some((l) => l.name === n));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {onBack && <button className="gbtn" style={{ marginBottom: 14 }} onClick={onBack}>← All recipes</button>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{recipeName} — Standard Recipe</h2>
        <span className="chip" style={approved ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{approved ? "Approved · v1.0" : "Draft — ready to review"}</span>
      </div>

      {flash && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.indigoSoft, border: `1px solid #c7d2fe`, borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
          <Link2 size={15} color={C.indigo} />
          <div style={{ fontSize: 13, color: C.indigoDeep }}>
            <b>{flash}</b> changed — this recipe was automatically recosted. New batch cost {money(total)}.
          </div>
          <button className="gbtn" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={() => setFlash(null)}>Dismiss</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 22, marginBottom: 14, fontSize: 13, alignItems: "flex-start" }}>
            <div>
              <span style={{ color: C.muted }}>Base yield</span>
              {isCapture ? (
                <div style={{ fontWeight: 700, marginTop: 2 }}>{captureBaseYield}</div>
              ) : editYield ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <input type="number" min="1" step="1" value={basePortions}
                    onChange={(e) => setBasePortions && setBasePortions(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 72, border: `1.5px solid ${C.indigo}`, borderRadius: 8, padding: "5px 8px", fontSize: 14, fontWeight: 700 }} autoFocus />
                  <span style={{ color: C.muted }}>portions</span>
                  <button className="gbtn" style={{ padding: "4px 9px" }} onClick={() => setEditYield(false)}><Check size={13} /></button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontWeight: 700 }}>{basePortions} portions</span>
                  {setBasePortions && <button className="gbtn" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => setEditYield(true)}>Edit</button>}
                </div>
              )}
            </div>
            <div title="The container or format one batch is cooked and served in">
              <span style={{ color: C.muted }}>Batch format</span>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{isCapture ? captureBatchFormat : `1 large tray = ${basePortions} portions`}</div>
            </div>
          </div>
          {!isCapture && !pricesEntered && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.amberSoft, border: "1px solid #fde68a", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
              <Info size={14} color={C.amber} />
              <div style={{ fontSize: 12.5, color: "#92400e" }}>
                No ingredient prices yet — costs show £0.00. Add prices in the Ingredient costs step or in Ingredients &amp; Suppliers.
              </div>
            </div>
          )}
          <table>
            <thead><tr style={{ color: C.muted, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
              <th style={th}>INGREDIENT</th><th style={th}>AMOUNT</th><th style={th}>UNIT</th><th style={{ ...th, textAlign: "right" }}>COST</th><th style={{ ...th, textAlign: "right" }}>%</th>
            </tr></thead>
            <tbody>
              {isCapture ? captureData.rows.map((r) => {
                const amt = r.amount;
                return (
                  <tr key={r.name} className="rowline" style={r.isSub ? { background: "#faf9ff" } : undefined}>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {r.isSub ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} />{r.name}</span> : r.name}
                    </td>
                    <td style={td}>{Number.isInteger(amt) ? amt : amt.toFixed(2)}</td>
                    <td style={{ ...td, color: C.muted }}>{r.unit}</td>
                    <td style={{ ...td, textAlign: "right", color: r.cost > 0 ? C.ink : C.muted }}>{money(r.cost)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted }}>{pct(r.cost)}%</td>
                  </tr>
                );
              }) : baseIngredients.map((r) => {
                const c = lineCost(r.name);
                const amt = r.amount * yieldFactor;
                return (
                  <tr key={r.name} className="rowline">
                    <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                    <td style={td}>{Number.isInteger(amt) ? amt : amt.toFixed(2)}</td>
                    <td style={{ ...td, color: C.muted }}>{r.unit}</td>
                    <td style={{ ...td, textAlign: "right", color: c > 0 ? C.ink : C.muted }}>{money(c)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted }}>{pct(c)}%</td>
                  </tr>
                );
              })}
              {/* linked sub-recipes appear as costed lines in the parent (capture mode already includes Chicken Stock inline above) */}
              {!isCapture && linkedSubs.map((l) => {
                const c = subCostOf(l);
                return (
                  <tr key={l.name} className="rowline" style={{ background: "#faf9ff" }}>
                    <td style={{ ...td, fontWeight: 600 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} />{l.name}</span>
                    </td>
                    <td style={td}>{Number.isInteger(l.use * yieldFactor) ? l.use * yieldFactor : (l.use * yieldFactor).toFixed(2)}</td>
                    <td style={{ ...td, color: C.muted }}>{l.unit}</td>
                    <td style={{ ...td, textAlign: "right" }}>{money(c)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted }}>{pct(c)}%</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${C.ink}` }}>
                <td style={{ ...td, fontWeight: 800 }} colSpan={3}>TOTAL COST</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 800, color: total > 0 ? C.ink : C.muted }}>{money(total)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{total > 0 ? "100%" : "—"}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Method</div>
              <button className="gbtn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditMethod((v) => !v)}>{editMethod ? "Done" : "Edit"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 99, background: C.indigoSoft, color: C.indigoDeep, fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  {editMethod ? (
                    <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
                      <input value={m} onChange={(e) => setSteps(steps.map((s, j) => j === i ? e.target.value : s))}
                        style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 9px", fontSize: 13, fontFamily: "inherit" }} />
                      <button className="gbtn" style={{ padding: "5px 8px", color: C.red, borderColor: "#fca5a5" }} onClick={() => setSteps(steps.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink, paddingTop: 2 }}>{m}</div>
                  )}
                </div>
              ))}
            </div>
            {editMethod && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  <button className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, borderStyle: "dashed" }} onClick={() => setSteps([...steps, ""])}><Plus size={13} /> Add step</button>
                  <button className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, background: addStepMode === "speak" ? C.indigoSoft : undefined }} onClick={() => setAddStepMode(addStepMode === "speak" ? null : "speak")}><Mic size={13} /> Speak</button>
                  <button className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, background: addStepMode === "type" ? C.indigoSoft : undefined }} onClick={() => setAddStepMode(addStepMode === "type" ? null : "type")}><Keyboard size={13} /> Type / Paste</button>
                  <button className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, background: addStepMode === "photo" ? C.indigoSoft : undefined }} onClick={() => setAddStepMode(addStepMode === "photo" ? null : "photo")}><Camera size={13} /> Upload Photo</button>
                  <button className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, background: addStepMode === "import" ? C.indigoSoft : undefined }} onClick={() => setAddStepMode(addStepMode === "import" ? null : "import")}><FileUp size={13} /> Import</button>
                </div>

                {addStepMode === "speak" && (
                  <div style={{ marginTop: 10, background: C.indigoSoft, borderRadius: 10, padding: 14 }}>
                    {!recordingStep ? (
                      <button className="pbtn" onClick={() => setRecordingStep(true)}><Mic size={14} /> Start recording</button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 99, background: C.red }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.indigoDeep }}>Listening…</span>
                        <button className="pbtn" style={{ marginLeft: "auto" }} onClick={() => {
                          setSteps([...steps, "Check the seasoning and adjust to taste."]);
                          setRecordingStep(false); setAddStepMode(null);
                        }}>Stop &amp; add step</button>
                      </div>
                    )}
                  </div>
                )}

                {addStepMode === "type" && (
                  <div style={{ marginTop: 10 }}>
                    <textarea rows={4} value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Type or paste one or more steps, one per line…"
                      style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                      <button className="gbtn" onClick={() => { setAddStepMode(null); setPasteText(""); }}>Cancel</button>
                      <button className="pbtn" onClick={() => {
                        const lines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean);
                        if (lines.length) setSteps([...steps, ...lines]);
                        setPasteText(""); setAddStepMode(null);
                      }}>Add steps</button>
                    </div>
                  </div>
                )}

                {addStepMode === "photo" && (
                  <div style={{ marginTop: 10, background: C.indigoSoft, borderRadius: 10, padding: 14 }}>
                    <input ref={methodPhotoRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { if (e.target.files && e.target.files[0]) { setSteps([...steps, "Method detected from photo — review and edit."]); setAddStepMode(null); } }} />
                    <button className="pbtn" onClick={() => methodPhotoRef.current && methodPhotoRef.current.click()}><Camera size={14} /> Choose photo</button>
                    <div style={{ fontSize: 12, color: C.indigoDeep, marginTop: 8 }}>Upload a photo of a handwritten or printed recipe and I2C will detect the steps.</div>
                  </div>
                )}

                {addStepMode === "import" && (
                  <div style={{ marginTop: 10, background: C.indigoSoft, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12.5, color: C.indigoDeep, marginBottom: 10 }}>Import method steps from an existing recipe.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["Egusi Soup", "Fried Rice", "Moi Moi"].map((n) => (
                        <button key={n} className="gbtn" style={{ padding: "6px 11px", fontSize: 12.5, background: "#fff" }}
                          onClick={() => { setSteps([...steps, `Imported from ${n} — review and edit.`]); setAddStepMode(null); }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isCapture ? (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Linked sub-recipes</div>
              {!captureData.stockSub && <div style={{ fontSize: 12.5, color: C.muted, padding: "6px 0" }}>No components linked yet.</div>}
              {captureData.stockSub && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{captureData.stockSub.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{captureData.stockSub.batchYield} {captureData.stockSub.batchUnit} batch · {money(captureData.stockSub.batchCost)}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{captureData.stockSub.usedL} {captureData.stockSub.batchUnit} used · {money(captureData.stockSub.usedCost)} allocated</div>
                  </div>
                  <button className="gbtn" style={{ padding: "5px 10px" }}>Open</button>
                </div>
              )}
              <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8, background: C.indigoSoft, borderRadius: 10, padding: "10px 12px" }}>
                <Link2 size={15} color={C.indigo} style={{ marginTop: 1 }} />
                <div style={{ fontSize: 12, color: C.indigoDeep }}>Open a component and change a price — every recipe that uses it is recosted automatically.</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Linked sub-recipes</div>
                <button className="gbtn" style={{ padding: "5px 10px" }} onClick={() => setAddOpen(true)}><Plus size={13} /> Add</button>
              </div>
              {linkedSubs.length === 0 && <div style={{ fontSize: 12.5, color: C.muted, padding: "6px 0" }}>No components linked yet.</div>}
              {linkedSubs.map((l) => (
                <div key={l.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{l.use} {l.unit} · {money(subCostOf(l))} · batch {money(subBatchCost(subs[l.name]))}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="gbtn" style={{ padding: "5px 10px" }} onClick={() => setOpenSub(l.name)}>Open</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8, background: C.indigoSoft, borderRadius: 10, padding: "10px 12px" }}>
                <Link2 size={15} color={C.indigo} style={{ marginTop: 1 }} />
                <div style={{ fontSize: 12, color: C.indigoDeep }}>Open a component and change a price — every recipe that uses it is recosted automatically.</div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Actions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button className="gbtn">Edit</button>
              <button className="gbtn">Duplicate</button>
              <button className="gbtn"><Download size={14} /> Export</button>
              <button className="gbtn" onClick={() => setPrintOpen(true)}><Printer size={14} /> Print recipe card</button>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Staff access</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 12.5, color: C.muted }}>Kitchen staff can view this recipe</div>
                <button className="gbtn" style={{ padding: "5px 10px", flexShrink: 0 }} onClick={() => setStaffModalOpen(true)}>Manage access</button>
              </div>
            </div>
            {!approved ? (
              <button className="pbtn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={() => setApproved(true)}><Check size={16} /> Approve recipe</button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ background: C.greenSoft, color: C.green, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>✓ Approved — now the current operational version</div>
                <button className="pbtn" style={{ width: "100%", justifyContent: "center" }} onClick={() => go("costing")}>Continue to operational use <ArrowRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff access — which parts of this recipe kitchen staff can see */}
      {staffModalOpen && (
        <Modal onClose={() => setStaffModalOpen(false)}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Staff access — {recipeName}</h3>
          <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13.5 }}>Choose what kitchen staff can see for this recipe.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              ["ingredients", "Ingredients & quantities"],
              ["method", "Preparation method"],
              ["yield", "Yield & batch format"],
              ["allergens", "Allergens"],
              ["costs", "Ingredient costs"],
              ["supplierPrices", "Supplier & purchase prices"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" checked={staffAccess[key]} onChange={(e) => setStaffAccess({ ...staffAccess, [key]: e.target.checked })} style={{ width: 16, height: 16, accentColor: C.indigo }} />
                {label}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button className="pbtn" onClick={() => setStaffModalOpen(false)}><Check size={15} /> Save access</button>
          </div>
        </Modal>
      )}

      {/* Print recipe card — staff-facing operational version, no costs or supplier prices */}
      {printOpen && (
        <Modal onClose={() => setPrintOpen(false)}>
          <h3 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800 }}>{recipeName}</h3>
          <div style={{ margin: "0 0 18px", color: C.muted, fontSize: 13.5 }}>
            {isCapture ? captureBaseYield : `${basePortions} portions`} · {isCapture ? captureBatchFormat : "Standard batch"} · v1.0
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Ingredients &amp; quantities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {(isCapture ? captureData.rows.filter((r) => !r.isSub) : baseIngredients.map((r) => ({ name: r.name, amount: r.amount * yieldFactor, unit: r.unit })))
              .map((r) => (
                <div key={r.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span>{r.name}</span><span style={{ fontWeight: 600 }}>{Number.isInteger(r.amount) ? r.amount : r.amount.toFixed(2)} {r.unit}</span>
                </div>
              ))}
          </div>

          {(() => {
            const stockRow = isCapture ? captureData.rows.find((r) => r.isSub) : linkedSubs.find((l) => l.name === "Chicken Stock");
            if (!stockRow) return null;
            const amt = isCapture ? stockRow.amount : stockRow.use * yieldFactor;
            const unit = isCapture ? stockRow.unit : stockRow.unit;
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} /> Linked Chicken Stock quantity</div>
                <div style={{ fontSize: 13.5 }}>{Number.isInteger(amt) ? amt : amt.toFixed(2)} {unit}</div>
              </div>
            );
          })()}

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Method</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {steps.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: C.indigo, flexShrink: 0 }}>{i + 1}.</span><span>{m}</span>
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Yield / batch information</div>
          <div style={{ fontSize: 13.5, marginBottom: 4 }}>{isCapture ? captureBaseYield : `${basePortions} portions`}</div>
          <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 18 }}>{isCapture ? captureBatchFormat : "Standard batch"}</div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="gbtn" onClick={() => setPrintOpen(false)}>Close</button>
            <button className="pbtn"><Printer size={15} /> Print</button>
          </div>
        </Modal>
      )}

      {/* Drill-down: view/edit a sub-recipe (demonstrates dependency) */}
      {openSub && (
        <SubRecipeModal
          sub={subs[openSub]}
          onClose={() => setOpenSub(null)}
          onSave={(ings) => saveSub(openSub, ings)}
          onRemove={() => { removeSub(openSub); setOpenSub(null); }}
        />
      )}

      {/* Add a sub-recipe */}
      {addOpen && (
        <Modal onClose={() => { setAddOpen(false); setCreating(false); }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Add a sub-recipe</h3>
          <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13.5 }}>Link an existing component, or create a new one. Its cost flows into this recipe.</p>

          {!creating && (
            <>
              {available.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>All existing components are already linked. Create a new one below.</div>}
              {available.map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{n}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Makes {subs[n].yieldQty} {subs[n].yieldUnit} · batch {money(subBatchCost(subs[n]))} · {money(subUnitCost(subs[n]))}/{subs[n].yieldUnit}</div>
                  </div>
                  <button className="pbtn" style={{ padding: "7px 13px" }} onClick={() => addSub(n)}>Link</button>
                </div>
              ))}
              <button className="gbtn" style={{ width: "100%", justifyContent: "center", marginTop: 6, borderStyle: "dashed" }} onClick={() => setCreating(true)}><Plus size={14} /> Create a new sub-recipe</button>
            </>
          )}

          {creating && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Sub-recipe name</label>
                  <input className="subin" value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} placeholder="e.g. Pepper Sauce" style={subInput} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Batch makes</label>
                    <input type="number" min="0" step="0.1" value={newSub.yieldQty} onChange={(e) => setNewSub({ ...newSub, yieldQty: e.target.value })} placeholder="e.g. 4" style={subInput} />
                  </div>
                  <div style={{ width: 92 }}>
                    <label style={lbl}>Unit</label>
                    <select value={newSub.yieldUnit} onChange={(e) => setNewSub({ ...newSub, yieldUnit: e.target.value })} style={{ ...subInput, padding: "9px 8px" }}>
                      <option>L</option><option>kg</option><option>g</option><option>portions</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Amount used in this recipe ({newSub.yieldUnit})</label>
                  <input type="number" min="0" step="0.1" value={newSub.use} onChange={(e) => setNewSub({ ...newSub, use: e.target.value })} placeholder="e.g. 2" style={subInput} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Main ingredient</label>
                    <input value={newSub.ing} onChange={(e) => setNewSub({ ...newSub, ing: e.target.value })} placeholder="e.g. Red peppers" style={subInput} />
                  </div>
                  <div style={{ width: 120 }}>
                    <label style={lbl}>Batch cost (£)</label>
                    <input type="number" min="0" step="0.01" value={newSub.price} onChange={(e) => setNewSub({ ...newSub, price: e.target.value })} placeholder="0.00" style={subInput} />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>You can add more ingredients and detail after creating it. This is enough to link and cost it.</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button className="gbtn" onClick={() => setCreating(false)}>Back</button>
                <button className="pbtn" disabled={!newSub.name.trim() || !!subs[newSub.name.trim()]} onClick={createSub}
                  style={{ opacity: (!newSub.name.trim() || subs[newSub.name.trim()]) ? .5 : 1, cursor: (!newSub.name.trim() || subs[newSub.name.trim()]) ? "not-allowed" : "pointer" }}>
                  <Plus size={15} /> Create &amp; link
                </button>
              </div>
              {newSub.name.trim() && subs[newSub.name.trim()] && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>A component with that name already exists.</div>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// Sub-recipe drill-down: shows composition + editable prices; saving recosts the parent
function SubRecipeModal({ sub, onClose, onSave, onRemove }) {
  const [ings, setIngs] = useState(sub.ingredients.map((i) => ({ ...i })));
  const batch = ings.reduce((s, i) => s + (i.price || 0), 0);
  const unit = batch / sub.yieldQty;
  const parents = PARENTS_OF[sub.name] || [];
  const setPrice = (idx, v) => setIngs(ings.map((it, i) => i === idx ? { ...it, price: v === "" ? 0 : Math.max(0, parseFloat(v) || 0) } : it));
  const changed = JSON.stringify(ings) !== JSON.stringify(sub.ingredients);

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link2 size={17} color={C.violet} />
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{sub.name}</h3>
        <span className="chip" style={{ color: C.violet, background: "#f5f3ff", marginLeft: 6 }}>Sub-recipe · makes {sub.yieldQty} {sub.yieldUnit}</span>
      </div>
      <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13 }}>Edit an ingredient price to see the dependency recost every recipe that uses this component.</p>

      <table>
        <thead><tr style={{ color: C.muted, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
          <th style={th}>INGREDIENT</th><th style={th}>AMOUNT</th><th style={{ ...th }}>COST (£)</th>
        </tr></thead>
        <tbody>
          {ings.map((i, idx) => (
            <tr key={i.name} className="rowline">
              <td style={{ ...td, fontWeight: 600 }}>{i.name}</td>
              <td style={{ ...td, color: C.muted }}>{i.qty}</td>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "5px 9px", width: 110 }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>£</span>
                  <input type="number" min="0" step="0.01" value={i.price || ""} onChange={(e) => setPrice(idx, e.target.value)}
                    style={{ border: "none", outline: "none", width: "100%", fontSize: 13.5, fontWeight: 600, color: C.ink }} />
                </div>
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: `2px solid ${C.ink}` }}>
            <td style={{ ...td, fontWeight: 800 }} colSpan={2}>BATCH COST · {money(unit)}/{sub.yieldUnit}</td>
            <td style={{ ...td, fontWeight: 800 }}>{money(batch)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 14, background: changed ? C.amberSoft : C.paper, border: `1px solid ${changed ? "#fde68a" : C.line}`, borderRadius: 10, padding: "11px 13px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: changed ? "#92400e" : C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={13} /> Used by {parents.length} recipe{parents.length === 1 ? "" : "s"} — {changed ? "these will be recosted on save" : "no changes yet"}
        </div>
        {parents.map((p) => (
          <div key={p.recipe} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
            <span style={{ fontWeight: 600 }}>{p.recipe}</span>
            <span style={{ color: C.muted }}>uses {p.use} {p.unit} → {money(unit * p.use)}{changed && <b style={{ color: C.amber }}> (was {money((subBatchCost(sub) / sub.yieldQty) * p.use)})</b>}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <button className="gbtn" style={{ color: C.red, borderColor: "#fca5a5" }} onClick={onRemove}>Unlink from recipe</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="gbtn" onClick={onClose}>Cancel</button>
          <button className="pbtn" disabled={!changed} onClick={() => onSave(ings)} style={{ opacity: changed ? 1 : .5, cursor: changed ? "pointer" : "not-allowed" }}>
            <Check size={15} /> Save &amp; recost linked recipes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== RECIPES (library) ====================
function Recipes({ go, onOpen }) {
  const rows = [
    ["Jollof Rice", "Approved", "v1.0", "100 portions", "£31.40"],
    ["Egusi Soup", "Needs Clarification", "—", "—", "—"],
    ["Fried Rice", "Approved", "v2.1", "80 portions", "£24.15"],
    ["Moi Moi", "Approved", "v1.3", "120 portions", "£18.70"],
    ["Chicken Stock", "Approved · sub-recipe", "v1.0", "10 L", "£31.41"],
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Recipes</h1><p style={{ margin: "5px 0 0", color: C.muted, fontSize: 14 }}>Your standardised recipe library and linked components. Select a recipe to view and edit it.</p></div>
        <button className="pbtn" onClick={() => go("create")}><Plus size={16} /> Create Recipe</button>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700 }}>
            <th style={th}>NAME</th><th style={th}>STATUS</th><th style={th}>VERSION</th><th style={th}>YIELD</th><th style={{ ...th, textAlign: "right" }}>BATCH COST</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="rowline" style={{ cursor: "pointer" }} onClick={() => onOpen(r[0])}>
                <td style={{ ...td, fontWeight: 600, color: C.indigo }}>{r[0]}</td>
                <td style={td}><span className="chip" style={r[1].startsWith("Approved") ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{r[1]}</span></td>
                <td style={{ ...td, color: C.muted }}>{r[2]}</td>
                <td style={{ ...td, color: C.muted }}>{r[3]}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{r[4]}</td>
                <td style={{ ...td, textAlign: "right" }}><ChevronRight size={16} color={C.muted} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== SCREEN 9: COSTING ====================
function Costing({ packPrices = {}, pricesEntered, priceBumped, go, captureData }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const lineCost = (name) => (packPrices[name] || 0) * (USE_FRAC[name] || 0);
  const total = captureData ? captureData.total : baseIngredients.reduce((s, r) => s + lineCost(r.name), 0);
  const basePortionsForCost = captureData ? 150 : BASE_PORTIONS;
  const perPortion = total / basePortionsForCost;
  const pct = (name) => (total > 0 ? (lineCost(name) / total) * 100 : 0);
  const breakdownRows = captureData
    ? captureData.rows.map((r) => ({ name: r.name, amountLabel: `${r.amount} ${r.unit}`, cost: r.cost, isSub: r.isSub })).sort((a, b) => b.cost - a.cost)
    : baseIngredients.map((r) => ({ name: r.name, amountLabel: `${r.amount} ${r.unit}`, cost: lineCost(r.name) }));

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Costing — Jollof Rice</h1>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Batch and portion cost from trusted quantities and your ingredient prices.</p>

      {!pricesEntered && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.amberSoft, border: "1px solid #fde68a", borderRadius: 10, padding: "11px 14px", marginBottom: 16 }}>
          <Info size={15} color={C.amber} />
          <div style={{ fontSize: 13, color: "#92400e" }}>No ingredient prices saved yet, so costs are £0.00. Add prices in Ingredients &amp; Suppliers to see live costing.</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <Metric label={captureData ? "Batch cost (150 portions)" : "Batch cost (100 portions)"} value={money(total)} />
        <Metric label="Cost per portion" value={money(perPortion)} />
        <Metric label="Cost change (30 days)" value={pricesEntered ? "+8.6%" : "—"} tone={pricesEntered ? "amber" : undefined} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Cost breakdown</div>
            <button className="gbtn" onClick={() => setShowBreakdown(true)}>View cost breakdown</button>
          </div>
          <table>
            <tbody>
              {breakdownRows.map((r) => {
                const p = total > 0 ? (r.cost / total) * 100 : 0;
                return (
                  <tr key={r.name} className="rowline">
                    <td style={{ ...td, fontWeight: 600 }}>
                      {r.isSub ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} />{r.name}</span> : r.name}
                    </td>
                    <td style={{ ...td, color: C.muted }}>{r.amountLabel}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600, color: r.cost > 0 ? C.ink : C.muted }}>{money(r.cost)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted, width: 120 }}>
                      <div style={{ background: C.line, borderRadius: 99, height: 6 }}><div style={{ width: p + "%", background: C.indigo, height: "100%", borderRadius: 99 }} /></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={17} color={C.amber} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Ingredient price alert</div>
          </div>
          {pricesEntered ? (
            <>
              {captureData ? (
                <>
                  <div style={{ fontSize: 13.5, color: C.ink, marginBottom: 6 }}>Parboiled Rice price increased by <b>8.7%</b>.</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>+£4.00 batch cost impact on this recipe.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13.5, color: C.ink, marginBottom: 6 }}>Tomatoes (800 g tin) price increased by <b>8%</b>.</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>+£2.70 batch cost impact on this recipe.</div>
                </>
              )}
              <button className="gbtn" style={{ width: "100%", justifyContent: "center" }}>View affected recipes <ChevronRight size={15} /></button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.muted }}>Price alerts appear once ingredient prices are saved and a later price change is detected.</div>
          )}
        </div>
      </div>

      {showBreakdown && (
        <Modal onClose={() => setShowBreakdown(false)}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Cost breakdown — Jollof Rice</h3>
          <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13.5 }}>Per-ingredient cost for the full batch and per portion.</p>
          <table>
            <thead><tr style={{ color: C.muted, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
              <th style={th}>INGREDIENT</th><th style={th}>AMOUNT</th><th style={{ ...th, textAlign: "right" }}>BATCH</th><th style={{ ...th, textAlign: "right" }}>PER PORTION</th><th style={{ ...th, textAlign: "right" }}>%</th>
            </tr></thead>
            <tbody>
              {breakdownRows.map((r) => {
                const p = total > 0 ? (r.cost / total) * 100 : 0;
                return (
                  <tr key={r.name} className="rowline">
                    <td style={{ ...td, fontWeight: 600 }}>
                      {r.isSub ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} />{r.name}</span> : r.name}
                    </td>
                    <td style={{ ...td, color: C.muted }}>{r.amountLabel}</td>
                    <td style={{ ...td, textAlign: "right", color: r.cost > 0 ? C.ink : C.muted }}>{money(r.cost)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted }}>{money(r.cost / basePortionsForCost)}</td>
                    <td style={{ ...td, textAlign: "right", color: C.muted }}>{p.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${C.ink}` }}>
                <td style={{ ...td, fontWeight: 800 }} colSpan={2}>TOTAL</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{money(total)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{money(perPortion)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{total > 0 ? "100%" : "—"}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <button className="gbtn" onClick={() => setShowBreakdown(false)}>Close</button>
            <button className="pbtn" onClick={() => { setShowBreakdown(false); go("reports"); }}>See cost trends</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== SCREEN 10: PRODUCTION / SCALING ====================
function Production({ scaled, target, setTarget, scaledCost, basePortions = 100, captureData }) {
  const isCapture = !!captureData;
  const captureBasePortions = 150;
  const captureScaledCost = isCapture ? captureData.total * (target / captureBasePortions) : 0;
  const captureScaled = isCapture ? captureData.rows.map((r) => ({ ...r, s: r.amount * (target / captureBasePortions) })) : [];
  const fmtCapture = (n) => (Number.isInteger(n) ? n : (Math.round(n * 100) / 100).toFixed(2));

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Production Plan — Jollof Rice</h1>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Scale by target portions and plan production. Quantities recompute live.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Scale recipe</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Base yield: {isCapture ? captureBasePortions : basePortions} portions · {money(isCapture ? captureData.total : BASE_COST)}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.indigo }}>{target}</div><div style={{ color: C.muted, fontWeight: 600 }}>portions</div>
          </div>
          <input type="range" min={20} max={400} step={10} value={target} onChange={(e) => setTarget(+e.target.value)} style={{ width: "100%", margin: "8px 0 4px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}><span>20</span><span>400</span></div>
          <div style={{ marginTop: 16, background: C.indigoSoft, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Scaled batch cost</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.indigoDeep }}>{money(isCapture ? captureScaledCost : scaledCost)}</div>
          </div>
          <button className="pbtn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}><CalendarRange size={16} /> Create production plan</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Scaled ingredients ({target} portions)</div>
          <table>
            <thead><tr style={{ color: C.muted, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
              <th style={th}>INGREDIENT</th><th style={{ ...th, textAlign: "right" }}>BASE ({isCapture ? captureBasePortions : basePortions})</th><th style={{ ...th, textAlign: "right" }}>SCALED</th>
            </tr></thead>
            <tbody>
              {isCapture ? captureScaled.map((r) => (
                <tr key={r.name} className="rowline">
                  <td style={{ ...td, fontWeight: 600 }}>
                    {r.isSub ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={13} color={C.violet} />{r.name}</span> : r.name}
                  </td>
                  <td style={{ ...td, textAlign: "right", color: C.muted }}>{r.amount} {r.unit}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: C.indigo }}>{fmtCapture(r.s)} {r.unit}</td>
                </tr>
              )) : scaled.map((r) => (
                <tr key={r.name} className="rowline">
                  <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ ...td, textAlign: "right", color: C.muted }}>{r.amount} {r.unit}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: C.indigo }}>{fmt(r.s)} {r.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(n < 10 ? 2 : 1));

// ==================== INGREDIENTS & SUPPLIERS (branches B & C) ====================
// Maps a catalogue product to the recipe-ingredient key it prices, so an edit here
// updates the same packPrices the Costing and recipe screens read.
const PRODUCT_TO_INGREDIENT = {
  "Long Grain Rice": "Parboiled Rice",
  "Tomato Product": "Tomatoes (800 g tin)",
  "Onions": "Onions",
  "Seasoning Cube": "Seasoning Cube",
  "Parboiled Rice": "Rice (Parboiled)",
  "Tomato Paste": "Tomato Paste",
  "Tatashe": "Tatashe (Red Bell Pepper)",
  "Fresh Tomatoes": "Fresh Tomatoes",
  "Scotch Bonnet": "Scotch Bonnet",
  "White Onions": "White Onions",
  "Vegetable Oil": "Vegetable Oil",
  "Curry Powder": "Curry Powder",
  "Thyme": "Thyme",
  "Chicken Seasoning Powder": "Chicken Seasoning Powder",
  "Bay Leaves": "Bay Leaves",
  "Chicken Parts": "Chicken Parts",
  "Fresh Ginger": "Fresh Ginger",
  "Garlic": "Garlic",
  "Salt": "Cooking Salt",
};

function Ingredients({ invoiceState, setInvoiceState, priceBumped, setPriceBumped, packPrices = {}, setPackPrices, go }) {
  const [showAffected, setShowAffected] = useState(false);
  const [editing, setEditing] = useState(null); // product name being edited

  // catalogue rows carry their supplier/pack/unit context; price comes from shared packPrices
  const catalogue = [
    { product: "Parboiled Rice", supplier: "Ade Foods Ltd", pack: "25 kg bag", unit: "kg", packQty: 25, move: "▲ 8.7%" },
    { product: "Tomato Paste", supplier: "Global Cash & Carry", pack: "2.2 kg tin", unit: "kg", packQty: 2.2, move: "— 0%" },
    { product: "Tatashe", supplier: "Market Fresh", pack: "5 kg box", unit: "kg", packQty: 5, move: "— 0%" },
    { product: "Fresh Tomatoes", supplier: "Market Fresh", pack: "6 kg box", unit: "kg", packQty: 6, move: "— 0%" },
    { product: "Scotch Bonnet", supplier: "Market Fresh", pack: "2 kg box", unit: "kg", packQty: 2, move: "— 0%" },
    { product: "White Onions", supplier: "Market Fresh", pack: "10 kg sack", unit: "kg", packQty: 10, move: "— 0%" },
    { product: "Vegetable Oil", supplier: "Ade Foods Ltd", pack: "20 L drum", unit: "L", packQty: 20, move: "— 0%" },
    { product: "Curry Powder", supplier: "Global Cash & Carry", pack: "100 g sachet", unit: "kg", packQty: 0.1, move: "— 0%" },
    { product: "Thyme", supplier: "Global Cash & Carry", pack: "50 g sachet", unit: "kg", packQty: 0.05, move: "— 0%" },
    { product: "Chicken Seasoning Powder", supplier: "Global Cash & Carry", pack: "100 g sachet", unit: "kg", packQty: 0.1, move: "— 0%" },
    { product: "Bay Leaves", supplier: "Global Cash & Carry", pack: "50-leaf pack", unit: "leaf", packQty: 50, move: "— 0%" },
    { product: "Chicken Parts", supplier: "Ade Foods Ltd", pack: "5 kg pack", unit: "kg", packQty: 5, move: "— 0%" },
    { product: "Fresh Ginger", supplier: "Market Fresh", pack: "1 kg pack", unit: "kg", packQty: 1, move: "— 0%" },
    { product: "Garlic", supplier: "Market Fresh", pack: "1 kg pack", unit: "kg", packQty: 1, move: "— 0%" },
    { product: "Salt", supplier: "Global Cash & Carry", pack: "750 g pack", unit: "kg", packQty: 0.75, move: "— 0%" },
  ];

  const priceOf = (product) => {
    const key = PRODUCT_TO_INGREDIENT[product];
    return packPrices[key] || 0;
  };
  const setPrice = (product, val) => {
    const key = PRODUCT_TO_INGREDIENT[product];
    if (!key || !setPackPrices) return;
    setPackPrices({ ...packPrices, [key]: val === "" ? 0 : Math.max(0, parseFloat(val) || 0) });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ingredients & Suppliers</h1><p style={{ margin: "5px 0 0", color: C.muted, fontSize: 14 }}>Catalogue, pack sizes and current prices. Edit a pack price to recost every recipe that uses it.</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="gbtn" onClick={() => setInvoiceState("uploaded")}><FileUp size={14} /> Upload receipt / invoice</button>
          <button className="pbtn"><Plus size={16} /> Add ingredient</button>
        </div>
      </div>

      {/* Branch C: cost-change banner after a confirmed price rise */}
      {priceBumped && (
        <div style={{ background: C.amberSoft, border: "1px solid #fde68a", borderRadius: 12, padding: "13px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} color={C.amber} />
          <div style={{ flex: 1, fontSize: 13.5, color: "#92400e" }}>
            <b>Long Grain Rice</b> price changed. This affects recipes that use it.
          </div>
          <button className="gbtn" onClick={() => setShowAffected(true)}>View affected recipes <ChevronRight size={15} /></button>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700 }}>
            <th style={th}>PRODUCT</th><th style={th}>SUPPLIER</th><th style={th}>PACK</th><th style={{ ...th, textAlign: "right" }}>PACK PRICE</th><th style={{ ...th, textAlign: "right" }}>UNIT COST</th><th style={{ ...th, textAlign: "right" }}>30-DAY</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {catalogue.map((r) => {
              const price = priceOf(r.product);
              const unitCost = price > 0 ? price / r.packQty : 0;
              const isEditing = editing === r.product;
              const bumped = priceBumped && r.product === "Parboiled Rice";
              return (
                <tr key={r.product} className="rowline" style={bumped ? { background: C.amberSoft } : undefined}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.product}</td>
                  <td style={{ ...td, color: C.muted }}>{r.supplier}</td>
                  <td style={{ ...td, color: C.muted }}>{r.pack}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {isEditing ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, border: `1.5px solid ${C.indigo}`, borderRadius: 8, padding: "4px 8px" }}>
                        <span style={{ color: C.muted, fontSize: 13 }}>£</span>
                        <input type="number" min="0" step="0.01" defaultValue={price || ""} autoFocus
                          onChange={(e) => setPrice(r.product, e.target.value)}
                          style={{ border: "none", outline: "none", width: 66, fontSize: 13.5, fontWeight: 600, textAlign: "right" }} />
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{price > 0 ? money(price) : "—"}</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "right", color: C.muted }}>{unitCost > 0 ? `£${unitCost.toFixed(2)}/${r.unit}` : "—"}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: r.move.startsWith("▲") ? C.red : C.muted }}>{r.move}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button className="gbtn" style={{ padding: "4px 10px" }} onClick={() => setEditing(isEditing ? null : r.product)}>
                      {isEditing ? <><Check size={13} /> Done</> : "Edit"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={13} /> Prices feed directly into recipe and sub-recipe costing. Updating a pack price automatically recosts recipes that use that ingredient.
        </div>
      </div>

      {/* Invoice upload + extraction-confirm modal (branches B & C share this) */}
      {invoiceState && (
        <Modal onClose={() => setInvoiceState(null)}>
          {invoiceState === "uploaded" && (
            <>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Invoice uploaded — extraction ready</h3>
              <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13.5 }}>I2C read the invoice. Confirm or correct the values before they update your catalogue.</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 130, flexShrink: 0, border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper, height: 150, display: "grid", placeItems: "center", color: C.muted, fontSize: 12, textAlign: "center", padding: 10 }}>
                  <div><FileUp size={22} /><br />ade-foods-invoice.pdf</div>
                </div>
                <div style={{ flex: 1 }}>
                  <ExtractRow label="Product" value="Long Grain Rice" />
                  <ExtractRow label="Supplier" value="Ade Foods Ltd" />
                  <ExtractRow label="Pack size" value="25 kg" />
                  <ExtractRow label="New price" value="£34.00" highlight />
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.muted, display: "flex", gap: 6, alignItems: "center" }}>
                <Info size={13} /> Extraction is simulated for the prototype. Nothing is trusted until you confirm.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
                <button className="gbtn" onClick={() => setInvoiceState(null)}>Cancel</button>
                <button className="pbtn" onClick={() => { if (setPackPrices) setPackPrices({ ...packPrices, "Parboiled Rice": 20.4 }); setPriceBumped(true); setInvoiceState("confirmed"); }}><Check size={15} /> Confirm & update catalogue</button>
              </div>
            </>
          )}
          {invoiceState === "confirmed" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Check size={18} color={C.green} /><h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Catalogue updated</h3></div>
              <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13.5 }}>Long Grain Rice is now £34.00. Price history updated and affected recipe costs recalculated.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="gbtn" onClick={() => { setInvoiceState(null); setShowAffected(true); }}>View affected recipes</button>
                <button className="pbtn" onClick={() => setInvoiceState(null)}>Done</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Affected recipes drawer */}
      {showAffected && (
        <Modal onClose={() => setShowAffected(false)}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Recipes affected by the rice price change</h3>
          <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13.5 }}>These recipes use Long Grain Rice. Their displayed batch cost has been updated.</p>
          {[["Jollof Rice", "£42.80", "£45.10"], ["Fried Rice", "£23.10", "£24.30"], ["Ofada Rice", "£26.30", "£27.40"]].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{r[0]}</div>
              <div style={{ fontSize: 13, color: C.muted, marginRight: 12 }}>{r[1]} → <b style={{ color: C.ink }}>{r[2]}</b></div>
              <span className="chip" style={{ color: C.red, background: "#fef2f2" }}>▲</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <button className="gbtn" onClick={() => { setShowAffected(false); go("reports"); }}>See cost trend in Reports</button>
            <button className="pbtn" onClick={() => setShowAffected(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExtractRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ width: 90, fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</div>
      <input defaultValue={value} style={{ flex: 1, border: `1.5px solid ${highlight ? C.indigo : C.line}`, borderRadius: 8, padding: "7px 10px", fontSize: 13.5, fontWeight: 600, color: highlight ? C.indigoDeep : C.ink }} />
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,16,40,.45)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 24, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        {children}
      </div>
    </div>
  );
}


// ==================== SCREEN 11: REPORTS ====================
function Reports({ priceBumped }) {
  const trend = [46.0, 46.0, 46.8, 48.1, 48.7, 49.4, 50.0];
  const max = Math.max(...trend), min = Math.min(...trend);
  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Reports & price impact</h1>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Operational trends over the last 90 days. Illustrative demo data.</p>
      {priceBumped && (
        <div style={{ background: C.indigoSoft, border: `1px solid #c7d2fe`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.indigoDeep, display: "flex", gap: 8, alignItems: "center" }}>
          <Info size={14} /> Reflects your recent Parboiled Rice invoice — 3 recipes recalculated.
        </div>
      )}
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <Metric label="Recipes affected by price changes" value="3" tone="amber" />
        <Metric label="Highest increase" value="+8.7%" tone="red" />
        <Metric label="Avg cost movement" value="+4.6%" tone="amber" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Parboiled Rice — price trend</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>£46.00 → £50.00 (<span style={{ color: C.red, fontWeight: 700 }}>+8.7%</span>) per 25 kg bag</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 150, padding: "0 4px" }}>
            {trend.map((v, i) => {
              const h = 30 + ((v - min) / (max - min || 1)) * 110;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: h, background: `linear-gradient(180deg,${C.violet},${C.indigo})`, borderRadius: "6px 6px 0 0" }} />
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>W{i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Recipe batch-cost movement</div>
          {[["Jollof Rice", "£185.93", "£189.93", "+2.2%"], ["Fried Rice", "£23.10", "£24.15", "+4.5%"], ["Chicken Stock", "£30.15", "£31.41", "+4.2%"]].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>{r[0]}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginRight: 12 }}>{r[1]} → {r[2]}</div>
              <span className="chip" style={{ color: C.red, background: "#fef2f2" }}>{r[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== TEAM (staff members — shown under Settings) ====================
const TEAM_MEMBERS = [
  { name: "Amaka Okafor", role: "Owner / Admin", email: "amaka@amaskitchen.co.uk", phone: "07700 900123", status: "Active", since: "Jan 2024" },
  { name: "David Mensah", role: "Manager / Head Chef", email: "david@amaskitchen.co.uk", phone: "07700 900456", status: "Active", since: "Mar 2024" },
  { name: "Grace Adeyemi", role: "Kitchen Staff", email: "grace@amaskitchen.co.uk", phone: "07700 900789", status: "Active", since: "Jun 2024" },
  { name: "Tunde Bello", role: "Kitchen Staff", email: "tunde@amaskitchen.co.uk", phone: "07700 900234", status: "Invited", since: "—" },
];

function Team() {
  const initials = (n) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Team members</div>
        <button className="pbtn" style={{ padding: "8px 13px" }}><Plus size={15} /> Invite member</button>
      </div>
      <p style={{ margin: "4px 0 14px", color: C.muted, fontSize: 13.5 }}>People with access to this business, their contact details and role.</p>
      <div className="card" style={{ padding: 8 }}>
        <table>
          <thead><tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700 }}>
            <th style={th}>NAME</th><th style={th}>ROLE</th><th style={th}>CONTACT</th><th style={th}>SINCE</th><th style={{ ...th, textAlign: "right" }}>STATUS</th>
          </tr></thead>
          <tbody>
            {TEAM_MEMBERS.map((m) => (
              <tr key={m.name} className="rowline">
                <td style={{ ...td, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 99, background: C.indigoSoft, color: C.indigoDeep, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center" }}>{initials(m.name)}</span>
                    {m.name}
                  </span>
                </td>
                <td style={{ ...td, color: C.muted }}>{m.role}</td>
                <td style={{ ...td, color: C.muted, fontSize: 12.5 }}>{m.email}<br />{m.phone}</td>
                <td style={{ ...td, color: C.muted }}>{m.since}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <span className="chip" style={m.status === "Active" ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} /> Each member's role controls what they can see and do. Roles can be changed by an owner.
      </div>
    </div>
  );
}

// ==================== MULTI-LOCATION ====================
function Locations() {
  const [selected, setSelected] = useState(null);
  const sites = [
    { name: "Birmingham", recipes: 42, status: "Current" },
    { name: "Manchester", recipes: 39, status: "2 updates pending" },
    { name: "London", recipes: 41, status: "Current" },
  ];
  const masters = [
    { name: "Jollof Rice", version: "v1.0", sites: { Birmingham: "Current", Manchester: "Update pending", London: "Current" } },
    { name: "Fried Rice", version: "v2.1", sites: { Birmingham: "Current", Manchester: "Update pending", London: "Current" } },
    { name: "Moi Moi", version: "v1.3", sites: { Birmingham: "Current", Manchester: "Current", London: "Current" } },
  ];
  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Locations</h1>
      <p style={{ margin: "0 0 18px", color: C.muted, fontSize: 14 }}>Central recipe governance across sites. Master recipes are set here; each site runs the current approved version.</p>

      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {sites.map((s) => (
          <div key={s.name} className="card lift" style={{ flex: 1, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Building2 size={17} color={C.indigo} /><div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{s.recipes}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>approved recipes</div>
            <span className="chip" style={s.status === "Current" ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Master recipes — version status by site</div>
        <table>
          <thead><tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700 }}>
            <th style={th}>MASTER RECIPE</th><th style={th}>VERSION</th><th style={{ ...th, textAlign: "center" }}>BIRMINGHAM</th><th style={{ ...th, textAlign: "center" }}>MANCHESTER</th><th style={{ ...th, textAlign: "center" }}>LONDON</th>
          </tr></thead>
          <tbody>
            {masters.map((m) => (
              <tr key={m.name} className="rowline" style={{ cursor: "pointer", background: selected === m.name ? C.indigoSoft : undefined }} onClick={() => setSelected(selected === m.name ? null : m.name)}>
                <td style={{ ...td, fontWeight: 600 }}>{m.name}</td>
                <td style={{ ...td, color: C.muted }}>{m.version}</td>
                {["Birmingham", "Manchester", "London"].map((site) => {
                  const st = m.sites[site]; const ok = st === "Current";
                  return <td key={site} style={{ ...td, textAlign: "center" }}>
                    <span className="chip" style={ok ? { color: C.green, background: C.greenSoft } : { color: C.amber, background: C.amberSoft }}>{ok ? "Current" : "Pending"}</span>
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {selected && (
          <div style={{ marginTop: 14, background: C.indigoSoft, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.indigoDeep, display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={14} /> <b>{selected}</b> master is approved centrally. Manchester is one version behind — push the current version to bring every site into line.
            <button className="pbtn" style={{ marginLeft: "auto", padding: "6px 12px" }}>Push to all sites</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} /> Multi-location control demonstrates cross-site consistency without a separate app.
      </div>
    </div>
  );
}

// ==================== SETTINGS (learned meanings + team + profile) ====================
function SettingsView({ learned, profile, setProfile }) {
  const [tab, setTab] = useState("knowledge");
  const [draft, setDraft] = useState(profile || {});
  const [saved, setSaved] = useState(false);
  const items = learned && learned.length ? learned.map(x => ({ k: x.k, v: x.v })) : LEARNED_MEANINGS_SEED;
  const tabs = [["knowledge", "Business knowledge"], ["team", "Team"], ["profile", "Business profile"]];
  const profileFields = [
    ["name", "Business name"], ["type", "Business type"], ["cuisine", "Main cuisine"],
    ["size", "Team size"], ["batchFormat", "Default batch format"], ["currency", "Currency"],
  ];
  const saveProfile = () => { if (setProfile) setProfile(draft); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Settings</h1>
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 14 }}>Manage learned meanings, your team and business profile.</p>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 20 }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: "transparent", border: "none", padding: "10px 14px", fontSize: 13.5, fontWeight: tab === id ? 700 : 500, color: tab === id ? C.indigo : C.muted, borderBottom: `2px solid ${tab === id ? C.indigo : "transparent"}`, marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "knowledge" && (
        <div className="card" style={{ padding: 20, maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <BookOpen size={17} color={C.violet} /><div style={{ fontWeight: 700, fontSize: 15 }}>Learned meanings</div>
          </div>
          {items.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.k}</div>
              <ArrowRight size={14} color={C.muted} style={{ margin: "0 10px" }} />
              <div style={{ fontWeight: 700, fontSize: 14, color: C.violet }}>{r.v}</div>
              <button className="gbtn" style={{ marginLeft: "auto", padding: "5px 11px" }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      {tab === "team" && <Team />}

      {tab === "profile" && (
        <div className="card" style={{ padding: 20, maxWidth: 560 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Business profile</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Set up when you created your account. Edit anything here.</div>
          {profileFields.map(([k, label], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <div style={{ width: 160, fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
              <input value={(draft && draft[k]) || ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px", fontSize: 13.5, fontWeight: 600 }} />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button className="pbtn" onClick={saveProfile}><Check size={15} /> Save profile</button>
            {saved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SCREEN 13: STAFF VIEW ====================
// Approved recipes visible to kitchen staff (no costs anywhere)
const STAFF_RECIPES = [
  {
    name: "Jollof Rice", yield: "100 portions", batch: "Large Tray", version: "1.0", updated: "02 May 2025",
    allergens: "None", notes: "Keep warm for service.",
    ingredients: baseIngredients.map((r) => ({ name: r.name, qty: `${r.amount} ${r.unit}` })),
    method,
  },
  {
    name: "Fried Rice", yield: "80 portions", batch: "Medium Tray", version: "2.1", updated: "28 Apr 2025",
    allergens: "Egg, Soy", notes: "Cook rice a day ahead for best texture.",
    ingredients: [
      { name: "Parboiled Rice", qty: "20 kg" }, { name: "Mixed Vegetables", qty: "4 kg" },
      { name: "Eggs", qty: "20 pcs" }, { name: "Oil", qty: "2 L" },
      { name: "Curry Powder", qty: "120 g" }, { name: "Seasoning Cube", qty: "8 pcs" },
    ],
    method: ["Boil and cool rice.", "Fry vegetables until tender.", "Scramble eggs separately.", "Combine rice, veg and eggs.", "Season and stir-fry on high heat.", "Serve hot."],
  },
  {
    name: "Moi Moi", yield: "120 portions", batch: "Batch Steam", version: "1.3", updated: "27 Apr 2025",
    allergens: "Fish", notes: "Steam upright to avoid spillage.",
    ingredients: [
      { name: "Peeled Beans", qty: "12 kg" }, { name: "Red Bell Pepper", qty: "3 kg" },
      { name: "Onions", qty: "2 kg" }, { name: "Oil", qty: "2 L" },
      { name: "Sardines", qty: "24 tins" }, { name: "Seasoning Cube", qty: "10 pcs" },
    ],
    method: ["Blend beans, peppers and onions.", "Whisk in oil and seasoning.", "Fold in flaked sardines.", "Pour into containers.", "Steam 45–60 minutes until set."],
  },
  {
    name: "Ofada Rice", yield: "70 portions", batch: "Medium Pot", version: "1.0", updated: "25 Apr 2025",
    allergens: "None", notes: "Serve with ayamase sauce.",
    ingredients: [
      { name: "Ofada Rice", qty: "18 kg" }, { name: "Locust Beans", qty: "500 g" },
      { name: "Green Peppers", qty: "3 kg" }, { name: "Palm Oil", qty: "3 L" },
      { name: "Assorted Meat", qty: "6 kg" }, { name: "Seasoning Cube", qty: "8 pcs" },
    ],
    method: ["Parboil and rinse ofada rice.", "Bleach palm oil, add locust beans.", "Add blended peppers and meat.", "Simmer sauce until thick.", "Serve rice with sauce."],
  },
];

// Staff library — browse all approved recipes (read-only, no create, no costs)
function StaffLibrary({ onOpen }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Recipes</h1>
        <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 14 }}>Current approved recipes for the kitchen. Tap one to view ingredients and method.</p>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr style={{ textAlign: "left", color: C.muted, fontSize: 11.5, fontWeight: 700 }}>
            <th style={th}>RECIPE</th><th style={th}>YIELD</th><th style={th}>VERSION</th><th style={th}>UPDATED</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {STAFF_RECIPES.map((r) => (
              <tr key={r.name} className="rowline" style={{ cursor: "pointer" }} onClick={() => onOpen(r)}>
                <td style={{ ...td, fontWeight: 600, color: C.indigo }}>{r.name}</td>
                <td style={{ ...td, color: C.muted }}>{r.yield}</td>
                <td style={td}><span className="chip" style={{ color: C.green, background: C.greenSoft }}>Approved · v{r.version}</span></td>
                <td style={{ ...td, color: C.muted }}>{r.updated}</td>
                <td style={{ ...td, textAlign: "right" }}><ChevronRight size={16} color={C.muted} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} /> As kitchen staff you can view recipes but not create or edit them. Costs and supplier data are hidden.
      </div>
    </div>
  );
}

// Staff recipe detail (read-only)
function StaffView({ recipe, onBack }) {
  const r = recipe || STAFF_RECIPES[0];
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {onBack && (
        <button className="gbtn" style={{ marginBottom: 14 }} onClick={onBack}>← All recipes</button>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Utensils size={20} color={C.indigo} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{r.name} — Staff Recipe</h1>
        </div>
        <button className="gbtn"><Eye size={15} /> Kitchen Display</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
          {[["Yield", r.yield], ["Batch format", r.batch], ["Version", `${r.version} (Approved)`], ["Updated", r.updated]].map((x) => (
            <div key={x[0]}><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{x[0]}</div><div style={{ fontWeight: 700, fontSize: 14 }}>{x[1]}</div></div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Ingredients</div>
          <table>
            <tbody>
              {r.ingredients.map((ing) => (
                <tr key={ing.name} className="rowline">
                  <td style={{ ...td, fontWeight: 600 }}>{ing.name}</td>
                  <td style={{ ...td, textAlign: "right", color: C.ink }}>{ing.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 14, display: "flex", gap: 24 }}>
            <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Allergens</div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.allergens}</div></div>
            <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Notes</div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.notes}</div></div>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Method</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {r.method.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: 99, background: C.indigoSoft, color: C.indigoDeep, fontSize: 12.5, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: C.ink, paddingTop: 2 }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <button className="gbtn"><Printer size={14} /> Print recipe card</button>
        <button className="gbtn"><Share2 size={14} /> Share with staff</button>
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} /> Costs, margins and supplier data are hidden from kitchen staff by default.
      </div>
    </div>
  );
}
