const API = "https://www.prijsprofeet.de/api/v1/search?q=Volvic&retailer=aldi_sued&page_size=100&promotion_status=active";
const CACHE_KEY = "vdf_auto_offers_v1";
const CHECK_KEY = "vdf_auto_last_check_v1";
const RETAILERS = [
  ["ALDI Süd","Automatische Suche aktiv"],
  ["REWE","Datenquelle noch nicht verfügbar"],
  ["EDEKA","Datenquelle noch nicht verfügbar"],
  ["Kaufland","Datenquelle noch nicht verfügbar"],
  ["Lidl","Datenquelle noch nicht verfügbar"],
  ["ALDI Nord","Datenquelle noch nicht verfügbar"],
  ["Netto Marken-Discount","Datenquelle noch nicht verfügbar"],
  ["Penny","Datenquelle noch nicht verfügbar"],
  ["Norma","Datenquelle noch nicht verfügbar"],
  ["Globus","Datenquelle noch nicht verfügbar"]
];
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const money = v => Number.isFinite(Number(v)) ? Number(v).toLocaleString("de-DE",{style:"currency",currency:"EUR"}) : "Preis nicht angegeben";
const date = v => v ? new Date(v+"T12:00:00").toLocaleDateString("de-DE") : "unbekannt";
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let deferredInstall = null;
let cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");

function pickArray(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["results","items","products","data","offers"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  for (const key of ["data","result","response"]) {
    const nested = data?.[key];
    if (nested && typeof nested === "object") {
      for (const child of ["results","items","products","offers"]) {
        if (Array.isArray(nested[child])) return nested[child];
      }
    }
  }
  return [];
}
function normalize(row) {
  const name = row.name || row.product_name || row.product?.name || row.title || "";
  const brand = row.brand || row.product?.brand || "";
  const status = String(row.promotion_status || row.status || "").toLowerCase();
  const from = row.valid_from || row.start_date || row.promotion_start || "";
  const until = row.valid_until || row.end_date || row.promotion_end || "";
  const price = row.price ?? row.current_price ?? row.promotion_price;
  const isVolvic = /volvic/i.test(`${brand} ${name}`);
  const isActive = status ? status === "active" : (!from || from <= today()) && (!until || until >= today());
  if (!isVolvic || !isActive || price == null) return null;
  return {
    id: String(row.product_id || row.id || `${name}-${price}-${from}`),
    name,
    price: Number(price),
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    quantity: row.quantity || row.package_size || row.size || "",
    from, until,
    promotion: row.promotional_keywords || row.promotion || row.promotion_type || "",
    image: row.image_url || row.image || "",
    productUrl: row.product_url || row.url || ""
  };
}
function renderOffers(rows) {
  $("offerCount").textContent = rows.length;
  $("offersList").innerHTML = rows.map(o => `
    <article class="offer-card">
      <div class="offer-top"><span class="retailer-name">ALDI Süd</span><span class="proof-badge">AKTIVE AKTION</span></div>
      ${o.image ? `<img class="product-image" src="${esc(o.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
      <div class="price">${money(o.price)}</div>
      <div class="product">${esc(o.name)}</div>
      ${o.quantity ? `<div class="offer-meta">Packungsgröße: ${esc(o.quantity)}</div>` : ""}
      ${o.originalPrice && o.originalPrice > o.price ? `<div class="offer-meta">Statt ${money(o.originalPrice)}</div>` : ""}
      ${o.promotion ? `<div class="offer-meta">${esc(o.promotion)}</div>` : ""}
      <div class="offer-meta">Gültig: ${date(o.from)} – ${date(o.until)}</div>
      ${o.productUrl ? `<div class="offer-actions"><a class="text-link" href="${esc(o.productUrl)}" target="_blank" rel="noopener">Produktquelle ↗</a></div>` : ""}
    </article>`).join("");
  $("emptyState").hidden = rows.length > 0;
}
function showError(message) {
  $("errorBox").hidden = false;
  $("errorBox").textContent = message;
}
async function searchOffers(force=false) {
  const last = Number(localStorage.getItem(CHECK_KEY) || 0);
  if (!force && cached.length && Date.now()-last < 24*60*60*1000) {
    renderOffers(cached);
    $("lastChecked").textContent = `Letzte erfolgreiche Suche: ${new Date(last).toLocaleString("de-DE")} · Zwischengespeicherte Ergebnisse`;
    $("searchState").textContent = "Daten aktuell";
    return;
  }
  $("refreshBtn").disabled = true;
  $("searchState").textContent = "Suche läuft …";
  $("errorBox").hidden = true;
  $("emptyState").hidden = true;
  try {
    const response = await fetch(API, {method:"GET", mode:"cors", headers:{"Accept":"application/json"}});
    if (!response.ok) throw new Error(`Die Angebotsquelle antwortet mit HTTP ${response.status}.`);
    const data = await response.json();
    const rows = pickArray(data).map(normalize).filter(Boolean);
    const unique = [...new Map(rows.map(x=>[x.id,x])).values()];
    cached = unique;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    localStorage.setItem(CHECK_KEY, String(Date.now()));
    renderOffers(cached);
    $("lastChecked").textContent = `Zuletzt gesucht: ${new Date().toLocaleString("de-DE")} · Quelle: PrijsProfeet · ALDI Süd`;
    $("searchState").textContent = "Suche abgeschlossen";
    if (!cached.length && pickArray(data).length === 0) {
      showError("Die Angebotsquelle hat ein unerwartetes Datenformat geliefert. Bitte später erneut versuchen.");
    }
  } catch (err) {
    renderOffers(cached);
    $("searchState").textContent = "Suche fehlgeschlagen";
    showError(`Automatische Suche momentan nicht möglich: ${err.message} Falls dieser Fehler dauerhaft auftritt, kann die API den Browserzugriff (CORS) blockieren oder vorübergehend nicht erreichbar sein. ${cached.length ? "Die zuletzt gespeicherten Treffer werden weiterhin angezeigt." : "Es liegen noch keine gespeicherten Treffer vor."}`);
    const lastSuccess = Number(localStorage.getItem(CHECK_KEY)||0);
    $("lastChecked").textContent = lastSuccess ? `Letzte erfolgreiche Suche: ${new Date(lastSuccess).toLocaleString("de-DE")}` : "Noch keine erfolgreiche Suche.";
  } finally {
    $("refreshBtn").disabled = false;
  }
}
function renderRetailers() {
  $("retailerList").innerHTML = RETAILERS.map(([name,status],i)=>`
    <div class="retailer-row"><span class="retailer-dot ${i===0?"available":""}"></span><strong>${esc(name)}</strong><small>${esc(status)}</small></div>`).join("");
}
$("refreshBtn").addEventListener("click",()=>searchOffers(true));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderRetailers();
renderOffers(cached);
const last = Number(localStorage.getItem(CHECK_KEY)||0);
if (last) $("lastChecked").textContent = `Letzte erfolgreiche Suche: ${new Date(last).toLocaleString("de-DE")}`;
searchOffers(false);
