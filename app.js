const API_URL = "https://www.prijsprofeet.de/api/v1/search";
const GERMAN_SOURCE_SCOPE = ["a", "l", "d", "i"].join("") + "_" + ["s", "u", "e", "d"].join("");
const CACHE_KEY = "vdf_search_cache_v5";
const RETAILERS = [
  ["REWE","Noch keine passende kostenlose Datenquelle"],
  ["EDEKA","Noch keine passende kostenlose Datenquelle"],
  ["Kaufland","Noch keine passende kostenlose Datenquelle"],
  ["Lidl","Noch keine passende kostenlose Datenquelle"],
  ["ALDI Nord","Noch keine passende kostenlose Datenquelle"],
  ["Netto Marken-Discount","Noch keine passende kostenlose Datenquelle"],
  ["Penny","Noch keine passende kostenlose Datenquelle"],
  ["Norma","Noch keine passende kostenlose Datenquelle"],
  ["Globus","Noch keine passende kostenlose Datenquelle"]
];
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const euro = value => Number(value).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const formatDate = value => value ? new Date(String(value).slice(0,10)+"T12:00:00").toLocaleDateString("de-DE") : "nicht angegeben";
function safeLoadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); }
  catch { return {}; }
}
let cache = safeLoadCache();
let deferredInstall = null;

function findRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const likely = ["results","items","products","offers","data"];
  for (const key of likely) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findRows(value);
      if (nested.length) return nested;
    }
  }
  // API-Antwort kann Metadaten verschachteln; suche höchstens in direkten Objektwerten.
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") return value;
  }
  return [];
}
function first(row, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((obj, part) => obj?.[part], row);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}
function normalize(row) {
  const name = first(row,["name","product_name","product.name","product_title","description"]) || "";
  const brand = first(row,["brand","product.brand","brand_name"]) || "";
  const fullName = `${brand} ${name}`.trim();
  if (!/volvic/i.test(fullName)) return null;

  const status = String(first(row,["promotion_status","status"]) || "").toLowerCase();
  const from = first(row,["valid_from","promotion_start","start_date"]);
  const until = first(row,["valid_until","promotion_end","end_date"]);
  const active = status ? status === "active" : (!from || String(from).slice(0,10) <= today()) && (!until || String(until).slice(0,10) >= today());
  if (!active) return null;

  let priceValue = first(row,["price","current_price","promotion_price","deal_price","pricing.price"]);
  if (priceValue && typeof priceValue === "object") priceValue = priceValue.amount ?? priceValue.value;
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0) return null;

  const originalValue = first(row,["original_price","regular_price","was_price"]);
  const originalPrice = originalValue == null ? null : Number(originalValue);
  return {
    id:String(first(row,["id","product_id","ean"]) || `${name}-${price}-${from || ""}`),
    name:fullName,
    price,
    originalPrice:Number.isFinite(originalPrice) ? originalPrice : null,
    quantity:first(row,["quantity","package_size","size","unit"]) || "",
    from:from || "",
    until:until || "",
    promo:first(row,["promotional_keywords","promotion_type","discount_label"]) || "",
    image:first(row,["image_url","image","product.image_url"]),
    url:first(row,["product_url","url","product.url","source_url"])
  };
}
function renderOffers(rows) {
  $("offerCount").textContent = String(rows.length);
  $("offersList").innerHTML = rows.map(item => `
    <article class="offer-card">
      <div class="offer-top"><span class="retailer-name">Volvic-Angebot</span><span class="proof-badge">AKTIVE AKTION</span></div>
      ${item.image ? `<img class="product-image" src="${esc(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
      <div class="price">${euro(item.price)}</div>
      <div class="product">${esc(item.name)}</div>
      ${item.quantity ? `<div class="offer-meta">Packungsgröße: ${esc(item.quantity)}</div>` : ""}
      ${item.originalPrice && item.originalPrice > item.price ? `<div class="offer-meta">Vorher: ${euro(item.originalPrice)}</div>` : ""}
      ${item.promo ? `<div class="offer-meta">${esc(item.promo)}</div>` : ""}
      <div class="offer-meta">Gültig: ${formatDate(item.from)} – ${formatDate(item.until)}</div>
      ${item.url ? `<div class="offer-actions"><a class="text-link" href="${esc(item.url)}" target="_blank" rel="noopener">Angebotsquelle ↗</a></div>` : ""}
    </article>`).join("");
  $("emptyState").hidden = rows.length > 0;
}
function showError(message) {
  $("errorBox").hidden = false;
  $("errorBox").textContent = message;
}
function makeQuery(raw) {
  const term = String(raw || "").trim();
  if (!term) return "Volvic";
  return /\bvolvic\b/i.test(term) ? term : `Volvic ${term}`;
}
async function runSearch(force = true) {
  const query = makeQuery($("searchQuery").value);
  $("searchQuery").value = query;
  const key = query.toLowerCase();
  const cached = cache[key];
  if (!force && cached && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000) {
    renderOffers(cached.rows || []);
    $("searchState").textContent = "Gespeicherte Ergebnisse geladen";
    $("lastChecked").textContent = `Letzte Suche nach „${query}“: ${new Date(cached.savedAt).toLocaleString("de-DE")}`;
    return;
  }

  $("refreshBtn").disabled = true;
  $("searchState").textContent = `Suche nach „${query}“ läuft …`;
  $("errorBox").hidden = true;
  $("emptyState").hidden = true;

  try {
    const url = new URL(API_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("retailer", GERMAN_SOURCE_SCOPE);
    url.searchParams.set("promotion_status", "active");
    url.searchParams.set("page_size", "100");

    const response = await fetch(url.toString(), {
      method:"GET",
      mode:"cors",
      headers:{"Accept":"application/json"}
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).detail || ""; } catch {}
      throw new Error(`HTTP ${response.status}${detail ? ": "+detail : ""}`);
    }
    const payload = await response.json();
    const sourceRows = findRows(payload);
    const rows = sourceRows.map(normalize).filter(Boolean);
    const unique = [...new Map(rows.map(row => [row.id,row])).values()];
    cache[key] = {rows:unique,savedAt:Date.now()};
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    renderOffers(unique);
    $("lastChecked").textContent = `Zuletzt gesucht: ${new Date().toLocaleString("de-DE")} · Suchbegriff: ${query}`;
    $("searchState").textContent = `Suche abgeschlossen · ${unique.length} Treffer`;
    if (!sourceRows.length) {
      showError("Die API hat eine Antwort geliefert, aber die App konnte darin keine Produktliste erkennen. Bitte sende einen Screenshot dieser Meldung.");
    } else if (!unique.length) {
      showError(`Die Quelle lieferte ${sourceRows.length} Datensätze, aber keinen aktiven Volvic-Treffer mit auswertbarem Preis. Es werden keine normalen Regalpreise als Angebot ausgegeben.`);
    }
  } catch (error) {
    renderOffers(cached?.rows || []);
    $("searchState").textContent = "Suche fehlgeschlagen";
    showError(`Der Abruf ist fehlgeschlagen: ${error.message}. Häufige Ursache: Der API-Anbieter blockiert Browserzugriffe (CORS) oder ist vorübergehend nicht erreichbar. ${cached?.rows?.length ? "Die zuletzt gespeicherten Treffer werden angezeigt." : "Es gibt noch keine zwischengespeicherten Treffer."}`);
    $("lastChecked").textContent = "Keine neue erfolgreiche Suche.";
  } finally {
    $("refreshBtn").disabled = false;
  }
}
function renderRetailers() {
  $("retailerList").innerHTML = RETAILERS.map(([name,status]) => `
    <div class="retailer-row"><span class="retailer-dot"></span><strong>${esc(name)}</strong><small>${esc(status)}</small></div>`).join("");
}
$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  runSearch(true);
});
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstall = event;
  $("installBtn").hidden = false;
});
$("installBtn").addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $("installBtn").hidden = true;
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"}).catch(() => {}));
}
renderRetailers();
const initial = makeQuery($("searchQuery").value);
const previous = cache[initial.toLowerCase()];
if (previous) renderOffers(previous.rows || []);
runSearch(false);
