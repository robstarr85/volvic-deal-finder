const RETAILERS = [
  {name:"REWE",abbr:"RW",url:"https://www.rewe.de/angebote/",search:"https://www.google.com/search?q=site%3Arewe.de%2Fangebote+%22Volvic+Eistee%22"},
  {name:"EDEKA",abbr:"ED",url:"https://www.edeka.de/angebote/",search:"https://www.google.com/search?q=site%3Aedeka.de+%22Volvic+Eistee%22+Angebot"},
  {name:"Kaufland",abbr:"KF",url:"https://filiale.kaufland.de/prospekte.html",search:"https://www.google.com/search?q=site%3Akaufland.de+%22Volvic+Eistee%22+Angebot"},
  {name:"Lidl",abbr:"LI",url:"https://www.lidl.de/c/online-prospekte/s10005610",search:"https://www.google.com/search?q=site%3Alidl.de+%22Volvic+Eistee%22"},
  {name:"ALDI Nord",abbr:"AN",url:"https://www.aldi-nord.de/prospekte.html",search:"https://www.google.com/search?q=site%3Aaldi-nord.de+%22Volvic+Eistee%22"},
  {name:"ALDI Süd",abbr:"AS",url:"https://www.aldi-sued.de/de/angebote.html",search:"https://www.google.com/search?q=site%3Aaldi-sued.de+%22Volvic+Eistee%22"},
  {name:"Netto Marken-Discount",abbr:"NE",url:"https://www.netto-online.de/angebote",search:"https://www.google.com/search?q=site%3Anetto-online.de+%22Volvic+Eistee%22"},
  {name:"Penny",abbr:"PE",url:"https://www.penny.de/angebote",search:"https://www.google.com/search?q=site%3Apenny.de+%22Volvic+Eistee%22"},
  {name:"Norma",abbr:"NO",url:"https://www.norma-online.de/de/angebote",search:"https://www.google.com/search?q=site%3Anorma-online.de+%22Volvic+Eistee%22"},
  {name:"Globus",abbr:"GL",url:"https://www.globus.de/maerkte/angebote.php",search:"https://www.google.com/search?q=Globus+%22Volvic+Eistee%22+Angebot"}
];
const STORE_KEY="vdf_offers_v1", SETTINGS_KEY="vdf_settings_v1";
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let offers=JSON.parse(localStorage.getItem(STORE_KEY)||"[]");
let settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{"postalCode":"","radius":25}');
let deferredInstall=null;

function saveOffers(){localStorage.setItem(STORE_KEY,JSON.stringify(offers));renderOffers();}
function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300);}
function safeUrl(v){try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?u.href:null}catch{return null}}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function euro(cents){return (cents/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});}
function formatDate(s){if(!s)return "";return new Date(s+"T12:00:00").toLocaleDateString("de-DE");}
function isCurrent(o){return o.validFrom<=today()&&o.validUntil>=today();}
function renderOffers(){
  const active=offers.filter(o=>o.verified&&isCurrent(o)).sort((a,b)=>a.priceCents-b.priceCents);
  $("offerCount").textContent=active.length;
  $("offersList").innerHTML=active.map(o=>`<article class="offer-card">
    <div class="offer-top"><span class="retailer-name">${escapeHtml(o.retailer)}</span><span class="proof-badge">BELEG HINTERLEGT</span></div>
    <div class="price">${euro(o.priceCents)}</div>
    <div class="product">Volvic Eistee ${escapeHtml(o.variant)} ${escapeHtml(o.size)}</div>
    <div class="offer-meta">${escapeHtml(o.storeName)} · ${escapeHtml(o.postalCode)} ${escapeHtml(o.city)}</div>
    <div class="offer-meta">Gültig: ${formatDate(o.validFrom)} – ${formatDate(o.validUntil)}</div>
    <div class="offer-actions"><a class="text-link" href="${escapeHtml(o.sourceUrl)}" target="_blank" rel="noopener">Beleg öffnen ↗</a><button class="delete-btn" data-delete="${o.id}">Entfernen</button></div>
  </article>`).join("");
  $("emptyState").hidden=active.length>0;
  $("offersList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{offers=offers.filter(o=>o.id!==b.dataset.delete);saveOffers();toast("Angebot entfernt.");}));
}
function renderSources(){
  $("sourceList").innerHTML=RETAILERS.map(r=>`<article class="source-card">
    <div class="source-logo">${r.abbr}</div>
    <div class="source-info"><strong>${r.name}</strong><small>Prospekt / Händlerseite · Volvic-Eistee-Suche</small></div>
    <div class="source-actions"><a href="${r.url}" target="_blank" rel="noopener">Prospekt ↗</a><a href="${r.search}" target="_blank" rel="noopener">Produkt suchen ↗</a></div>
  </article>`).join("");
  $("retailer").innerHTML=RETAILERS.map(r=>`<option>${r.name}</option>`).join("");
}
function switchTab(tab){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  ["offers","sources","add"].forEach(p=>$(`${p}Panel`).hidden=p!==tab);
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.go)));
$("postalCode").value=settings.postalCode||"";
$("radius").value=String(settings.radius||25);
$("saveArea").addEventListener("click",()=>{
  const plz=$("postalCode").value.trim();
  if(plz&&!/^\d{5}$/.test(plz)){toast("Bitte eine fünfstellige PLZ eingeben.");return;}
  settings={postalCode:plz,radius:Number($("radius").value)};saveSettings();toast("Suchgebiet lokal gespeichert.");
});
$("refreshLabel").addEventListener("click",()=>{localStorage.setItem("vdf_last_source_open",new Date().toISOString());$("lastChecked").textContent="Quellenprüfung gestartet: "+new Date().toLocaleString("de-DE")+" · Bitte Händler einzeln öffnen.";switchTab("sources");});
const last=localStorage.getItem("vdf_last_source_open");
if(last)$("lastChecked").textContent="Letzte manuell gestartete Quellenprüfung: "+new Date(last).toLocaleString("de-DE");
$("parseText").addEventListener("click",()=>{
  const text=$("sourceText").value;
  const valid=/volvic/i.test(text)&&/eis[\s-]?tee/i.test(text);
  if(!valid){$("parseMessage").className="parse-message bad";$("parseMessage").textContent="Kein eindeutiger Treffer: Der Text muss sowohl „Volvic“ als auch „Eistee“ enthalten. Wasser und andere Volvic-Produkte werden ausgeschlossen.";return;}
  const priceMatch=text.match(/(\d{1,2}[,.]\d{2})\s*€/);
  const dates=[...text.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/g)].map(m=>`${m[3].length===2?"20"+m[3]:m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`);
  const variantMatch=text.match(/Volvic\s+Eistee\s+([A-Za-zÄÖÜäöüß-]+)/i);
  const sizeMatch=text.match(/\b(\d+(?:[,.]\d+)?\s*(?:ml|l))\b/i);
  if(priceMatch)$("price").value=priceMatch[1].replace(",",".");
  if(variantMatch)$("variant").value=variantMatch[1];
  if(sizeMatch)$("size").value=sizeMatch[1];
  if(dates.length>=2){$("validFrom").value=dates[0];$("validUntil").value=dates[1];}
  $("parseMessage").className="parse-message good";
  $("parseMessage").textContent="Volvic Eistee erkannt. Erkannte Angaben wurden übernommen, bitte Preis und Zeitraum anhand der Originalquelle prüfen und ergänzen.";
});
$("offerForm").addEventListener("submit",e=>{
  e.preventDefault();
  const sourceUrl=safeUrl($("sourceUrl").value.trim());
  const price=Number($("price").value.replace(",","."));
  const from=$("validFrom").value, until=$("validUntil").value;
  const plz=$("storePostal").value.trim();
  if(!sourceUrl){toast("Bitte einen gültigen Beleg-Link eintragen.");return;}
  if(!Number.isFinite(price)||price<=0){toast("Bitte einen gültigen Aktionspreis eintragen.");return;}
  if(!from||!until||until<from){toast("Bitte einen gültigen Angebotszeitraum eintragen.");return;}
  if(!/^\d{5}$/.test(plz)){toast("Bitte eine fünfstellige Filial-PLZ eintragen.");return;}
  if(!$("verifiedCheck").checked){toast("Bitte den Beleg bestätigen.");return;}
  const offer={
    id:crypto.randomUUID(),retailer:$("retailer").value,productName:"Volvic Eistee",
    variant:$("variant").value.trim(),size:$("size").value.trim(),
    priceCents:Math.round(price*100),validFrom:from,validUntil:until,
    city:$("city").value.trim(),postalCode:plz,storeName:$("storeName").value.trim(),
    sourceUrl,verified:true,createdAt:new Date().toISOString()
  };
  if(!offer.variant||!offer.city||!offer.storeName){toast("Bitte Sorte, Ort und Filiale ergänzen.");return;}
  offers.push(offer);saveOffers();$("offerForm").reset();$("sourceText").value="";$("parseMessage").textContent="";$("verifiedCheck").checked=false;toast("Belegtes Angebot lokal gespeichert.");switchTab("offers");
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderSources();renderOffers();
