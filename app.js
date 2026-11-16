const API_BASE = "https://www.prijsprofeet.de/api/v1/search";
const CACHE_KEY = "vdf_auto_search_cache_v2";
const CHECK_KEY = "vdf_auto_last_check_v2";
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
const date = v => v ? new Date(v+"T12:00:00").toLocaleDateString("de-DE") : "Zeitraum nicht angegeben";
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let deferredInstall = null;
let cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

function asArray(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["results","items","products","offers"]) if (Array.isArray(data?.[key])) return data[key];
  for (const key of ["data","result","response"]) {
    const nested = data?.[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      for (const child of ["results","items","products","offers"]) if (Array.isArray(nested[child])) return nested[child];
    }
  }
  return [];
}
function field(row, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((obj,k)=>obj?.[k],row);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}
function normalize(row) {
  const name = field(row,["name","product_name","product.name","title","description"]) || "";
  const brand = field(row,["brand","product.brand"]) || "";
  const text = `${brand} ${name}`;
  const status = String(field(row,["promotion_status","status","deal_status"]) || "").toLowerCase();
  const from = field(row,["valid_from","start_date","promotion_start","validity.start","promotion.valid_from"]);
  const until = field(row,["valid_until","end_date","promotion_end","validity.end","promotion.valid_until"]);
  const rawPrice = field(row,["price","current_price","promotion_price","deal_price","prices.promotion","pricing.price","offer_price"]);
  const price = typeof rawPrice === "object" ? Number(rawPrice.amount ?? rawPrice.value) : Number(rawPrice);
  const isVolvic = /volvic/i.test(text);
  const isActive = status ? ["active","current","running"].includes(status) : (!from || String(from).slice(0,10)<=today()) && (!until || String(until).slice(0,10)>=today());
  if (!isVolvic || !isActive || !Number.isFinite(price) || price<=0) return null;
  const image = field(row,["image_url","image","product.image_url"]);
  const productUrl = field(row,["product_url","url","product.url","source_url"]);
  return {
    id:String(field(row,["id","product_id","ean"]) || `${name}-${price}-${from||""}`),
    name, brand, price,
    originalPrice:field(row,["original_price","regular_price","was_price"]),
    quantity:field(row,["quantity","package_size","size","unit"]),
    from:from ? String(from).slice(0,10) : "",
    until:until ? String(until).slice(0,10) : "",
    promotion:field(row,["promotion_type","promotion","mechanic","discount_label"]) || "",
    image, productUrl
  };
}
function renderOffers(rows) {
  $("offerCount").textContent = rows.length;
  $("offersList").innerHTML = rows.map(o => `
    <article class="offer-card">
      <div class="offer-top"><span class="retailer-name">ALDI Süd</span><span class="proof-badge">ANGEBOTSDATEN</span></div>
      ${o.image ? `<img class="product-image" src="${esc(o.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
      <div class="price">${money(o.price)}</div>
      <div class="product">${esc(o.name)}</div>
      ${o.quantity ? `<div class="offer-meta">Packungsgröße: ${esc(o.quantity)}</div>` : ""}
      ${o.originalPrice ? `<div class="offer-meta">Vorheriger Preis: ${money(o.originalPrice)}</div>` : ""}
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
function buildQuery(input) {
  const term = input.trim();
  if (!term) return "Volvic";
  return /\bvolvic\b/i.test(term) ? term : `Volvic ${term}`;
}
async function searchOffers(force=false) {
  const userText = $("searchQuery").value;
  const query = buildQuery(userText);
  const cacheKey = query.toLowerCase();
  const entry = cache[cacheKey];
  const last = Number(entry?.checkedAt || 0);
  if (!force && entry && Date.now()-last < 24*60*60*1000) {
    renderOffers(entry.rows || []);
    $("lastChecked").textContent = `Letzte Suche nach „${query}“: ${new Date(last).toLocaleString("de-DE")} · Zwischengespeicherte Ergebnisse`;
    $("searchState").textContent = "Zwischengespeichert";
    return;
  }
  $("refreshBtn").disabled = true;
  $("searchState").textContent = `Suche nach „${query}“ läuft …`;
  $("errorBox").hidden = true;
  $("emptyState").hidden = true;
  try {
    const url = new URL(API_BASE);
    url.searchParams.set("q",query);
    url.searchParams.set("retailer","aldi_sued");
    url.searchParams.set("promotion_status","active");
    url.searchParams.set("page_size","100");
    const response = await fetch(url.toString(), {method:"GET",mode:"cors",headers:{"Accept":"application/json"}});
    if (!response.ok) throw new Error(`Die Angebotsquelle antwortet mit HTTP ${response.status}.`);
    const data = await response.json();
    const sourceRows = asArray(data);
    const rows = sourceRows.map(normalize).filter(Boolean);
    const unique = [...new Map(rows.map(x=>[x.id,x])).values()];
    cache[cacheKey] = {rows:unique,checkedAt:Date.now()};
    localStorage.setItem(CACHE_KEY,JSON.stringify(cache));
    localStorage.setItem(CHECK_KEY,String(Date.now()));
    renderOffers(unique);
    $("lastChecked").textContent = `Zuletzt gesucht: ${new Date().toLocaleString("de-DE")} · Suchbegriff: ${query} · Quelle: PrijsProfeet`;
    $("searchState").textContent = "Suche abgeschlossen";
    if (!sourceRows.length) showError("Die Datenquelle hat für diese Suchanfrage keine Angebotsdatensätze geliefert.");
    else if (!unique.length) showError("Die Datenquelle hat Treffer geliefert, aber keiner ließ sich als aktives Volvic-Angebot mit Preis erkennen. Die API-Feldstruktur könnte sich geändert haben.");
  } catch (err) {
    const oldRows = entry?.rows || [];
    renderOffers(oldRows);
    $("searchState").textContent = "Suche fehlgeschlagen";
    showError(`Automatische Suche momentan nicht möglich: ${err.message} Prüfe die Verbindung. Falls die API den Browserzugriff blockiert (CORS), ist ein kostenloser Proxy/Backend-Dienst erforderlich. ${oldRows.length ? "Die zuletzt gespeicherten Treffer werden angezeigt." : "Es liegen für diese Suche noch keine gespeicherten Treffer vor."}`);
    $("lastChecked").textContent = last ? `Letzte erfolgreiche Suche: ${new Date(last).toLocaleString("de-DE")}` : "Noch keine erfolgreiche Suche.";
  } finally {
    $("refreshBtn").disabled = false;
  }
}
function renderRetailers() {
  $("retailerList").innerHTML = RETAILERS.map(([name,status],i)=>`
    <div class="retailer-row"><span class="retailer-dot ${i===0?"available":""}"></span><strong>${esc(name)}</strong><small>${esc(status)}</small></div>`).join("");
}
$("refreshBtn").addEventListener("click",()=>searchOffers(true));
$("searchQuery").addEventListener("keydown",e=>{if(e.key==="Enter")searchOffers(true);});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderRetailers();
const initialQuery = buildQuery($("searchQuery").value);
const cachedInitial = cache[initialQuery.toLowerCase()]?.rows || [];
renderOffers(cachedInitial);
const last = Number(cache[initialQuery.toLowerCase()]?.checkedAt || 0);
if (last) $("lastChecked").textContent = `Letzte erfolgreiche Suche: ${new Date(last).toLocaleString("de-DE")}`;
searchOffers(false);
