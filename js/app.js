import { creaStile, PALETTE, LIVELLI, COLORE_ITINERARIO, NOME_ITINERARIO } from './stile.js';
import { ICONE, svgIcona, svgBadge, patternVigneto } from './icone.js';

// ── Camera: veduta assonometrica fissa ────────────────────────────────
const INCLINAZIONE = 38;   // gradi: veduta dall'alto leggermente inclinata, fissa (non si può ruotare né raddrizzare)
const ORIENTAMENTO = 0;    // nord in alto, fisso
const LIMITI = [[11.45, 45.52], [12.95, 46.32]];  // oltre non si può andare (largo abbastanza per il telefono in verticale)
const ZOOM_MIN = 8.7, ZOOM_MAX = 17;

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// Icone inline nell'interfaccia
document.querySelectorAll('[data-icona]').forEach((e) => { e.innerHTML = svgIcona(e.dataset.icona); });

// ── Dati ──────────────────────────────────────────────────────────────
const [luoghi, itinerari, territorio] = await Promise.all([
  fetch('data/luoghi.geojson').then((r) => r.json()),
  fetch('data/itinerari.geojson').then((r) => r.json()),
  fetch('data/territorio.geojson').then((r) => r.json()),
]);
const luogoPerId = Object.fromEntries(luoghi.features.map((f) => [f.properties.id, f]));

// ── Immagini dei simboli (badge SVG rasterizzati prima di creare la mappa) ──
const CATEGORIE = ['castello', 'abbazia', 'villa', 'lago', 'grotta', 'mulino', 'pieve', 'loggia', 'campanile', 'chiesa', 'zona', 'scuola', 'cantina', 'enoteca', 'citta'];
const immagini = {};
await Promise.all(CATEGORIE.map((c) => new Promise((ok) => {
  const img = new Image();
  const opts = c === 'citta' ? { size: 36, sfondo: PALETTE.testoRosso, bordo: '#FFFBF0', tratto: '#FFFBF0', spessore: 3 }
    : c === 'cantina' || c === 'enoteca' ? { size: 40, sfondo: '#FFF7DF', bordo: '#8A6A1F', tratto: '#8A6A1F', spessore: 2 }
    : { size: 52 };
  img.onload = () => { immagini['badge-' + c] = img; ok(); };
  img.onerror = () => ok();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgBadge(c, opts));
})));
const vigneto = patternVigneto(PALETTE.vigna, PALETTE.vignaRiga);

// ── Mappa ─────────────────────────────────────────────────────────────
const bb = bboxDi(territorio);
const map = new maplibregl.Map({
  container: 'mappa',
  style: creaStile(),
  center: [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2],
  zoom: 10.2,
  pitch: INCLINAZIONE, bearing: ORIENTAMENTO,
  minPitch: INCLINAZIONE, maxPitch: INCLINAZIONE,
  minZoom: ZOOM_MIN, maxZoom: ZOOM_MAX,
  maxBounds: LIMITI,
  dragRotate: false, pitchWithRotate: false, touchPitch: false,
  attributionControl: { compact: true },
  fadeDuration: 400,
  locale: { 'Map.Title': 'Mappa', 'NavigationControl.ZoomIn': 'Avvicina', 'NavigationControl.ZoomOut': 'Allontana' },
});
map.touchZoomRotate.disableRotation();
try { map.keyboard.disableRotation(); } catch { /* versioni senza il metodo */ }

function aggiungiImmagini() {
  if (!map.hasImage('vigneto')) map.addImage('vigneto', vigneto);
  for (const [id, img] of Object.entries(immagini)) if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
}
map.on('styleimagemissing', aggiungiImmagini);
map.on('style.load', aggiungiImmagini);

map.on('load', () => {
  map.setTerrain({ source: 'dem', exaggeration: 1.45 });
  aggiornaLivello();
});

// Avviso se le tegole non arrivano (niente Internet)
let avvisato = false;
map.on('error', (e) => {
  const msg = e?.error?.message || '';
  console.error('[mappa]', msg, e?.error);
  if (!avvisato && /tiles|planet|fonts|terrarium|Failed to fetch|NetworkError/i.test(msg)) {
    avvisato = true;
    avviso('La cartografia di base non si carica: serve una connessione a Internet (tegole OpenFreeMap e rilievo AWS).', 8000);
  }
});

function bboxDi(fc) {
  let w = 180, s = 90, e = -180, n = -90;
  const visita = (c) => { if (typeof c[0] === 'number') { w = Math.min(w, c[0]); e = Math.max(e, c[0]); s = Math.min(s, c[1]); n = Math.max(n, c[1]); } else c.forEach(visita); };
  fc.features.forEach((f) => visita(f.geometry.coordinates));
  return [w, s, e, n];
}

const MOBILE = window.matchMedia('(max-width: 760px)');
function paddingPannello() {
  if (MOBILE.matches) return { top: 24, bottom: altezzaFoglio() + 16, left: 16, right: 16 };
  return { top: 40, bottom: 40, left: 400, right: 60 };
}

// Zoom che fa stare il riquadro nello spazio libero (in pianta, senza inclinazione).
function zoomPerRiquadro(b, pad) {
  const w = map.getContainer().clientWidth - pad.left - pad.right;
  const h = map.getContainer().clientHeight - pad.top - pad.bottom;
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const dx = (b[2] - b[0]) / 360;
  const dy = (merc(b[3]) - merc(b[1])) / (2 * Math.PI);
  return Math.min(Math.log2(w / (512 * dx)), Math.log2(h / (512 * dy)));
}

function vistaIniziale(anima = true) {
  const pad = paddingPannello();
  // Con la veduta inclinata la parte alta dello schermo mostra molto più territorio: alzo lo zoom in pianta.
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomPerRiquadro(bb, pad) + (MOBILE.matches ? 0.05 : 0.1)));
  const opzioni = { center: [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2 - 0.006], zoom, pitch: INCLINAZIONE, bearing: ORIENTAMENTO, padding: pad, duration: anima ? 1400 : 0, essential: true };
  anima ? map.easeTo(opzioni) : map.jumpTo(opzioni);
}
vistaIniziale(false);

// ── Livelli di dettaglio ──────────────────────────────────────────────
const olLivelli = $('#livelli');
LIVELLI.forEach((L, i) => {
  const li = el('li');
  const b = el('button', null, L.nome);
  b.type = 'button';
  b.addEventListener('click', () => {
    const z = i === LIVELLI.length - 1 ? L.da + 0.6 : (L.da + LIVELLI[i + 1].da) / 2;
    map.easeTo({ zoom: Math.max(ZOOM_MIN, z), pitch: INCLINAZIONE, bearing: ORIENTAMENTO, duration: 900, essential: true });
  });
  li.appendChild(b);
  olLivelli.appendChild(li);
});
function livelloCorrente(z) { let cur = LIVELLI[0]; for (const L of LIVELLI) if (z >= L.da) cur = L; return cur; }
function aggiornaLivello() {
  const L = livelloCorrente(map.getZoom());
  [...olLivelli.querySelectorAll('button')].forEach((b, i) => b.setAttribute('aria-current', LIVELLI[i] === L ? 'true' : 'false'));
  $('#livello-cosa').textContent = L.cosa;
}
map.on('zoom', aggiornaLivello);

// ── Elenchi: luoghi da visitare, paesi ────────────────────────────────
const NOME_TIPO = { citta: 'Città', paese: 'Paese', frazione: 'Borgo', luogo: 'Luogo da visitare', cantina: 'Cantina', enoteca: 'Enoteca' };
const NOME_CAT = { castello: 'Castello', abbazia: 'Abbazia', villa: 'Villa', lago: 'Lago', grotta: 'Grotte', mulino: 'Mulino', pieve: 'Pieve', loggia: 'Loggia', campanile: 'Campanile', chiesa: 'Chiesa', zona: 'Zona vitata', scuola: 'Scuola' };
const ZOOM_TIPO = { citta: 13.2, paese: 13.6, frazione: 14.2, luogo: 14.8, cantina: 15.5, enoteca: 15.5 };

const ulLuoghi = $('#elenco-luoghi'), ulPaesi = $('#elenco-paesi');
const vociElenco = [];
const ordinati = [...luoghi.features].sort((a, b) => a.properties.tier - b.properties.tier || a.properties.nome.localeCompare(b.properties.nome, 'it'));
for (const f of ordinati) {
  const p = f.properties;
  const li = el('li');
  const b = el('button');
  b.type = 'button';
  b.dataset.id = p.id;
  if (p.tipo === 'luogo') {
    b.innerHTML = `<span class="icona">${svgIcona(p.cat)}</span><span>${p.nome}</span><small>${NOME_CAT[p.cat] || ''}</small>`;
    ulLuoghi.appendChild(li);
  } else {
    if (p.tier > 3) continue;  // le frazioni minime restano solo sulla mappa
    b.innerHTML = `<span${p.tipo === 'citta' ? ' class="citta"' : ''}>${p.nome}</span>`;
    ulPaesi.appendChild(li);
  }
  b.addEventListener('click', () => vaiA(f));
  li.appendChild(b);
  vociElenco.push({ li, b, testo: (p.nome + ' ' + (NOME_CAT[p.cat] || '') + ' ' + (p.desc || '')).toLowerCase() });
}

function vaiA(f, zoom) {
  const p = f.properties;
  map.flyTo({ center: f.geometry.coordinates, zoom: zoom ?? ZOOM_TIPO[p.tipo] ?? 14, pitch: INCLINAZIONE, bearing: ORIENTAMENTO, speed: 0.9, curve: 1.4, essential: true, padding: paddingPannello() });
  mostraScheda(p);
  evidenzia(p.id);
  if (MOBILE.matches) foglio('spia');
}
function evidenzia(id) {
  vociElenco.forEach(({ b }) => b.classList.toggle('attivo', b.dataset.id === id));
}

// ── Ricerca ───────────────────────────────────────────────────────────
const cerca = $('#cerca');
cerca.addEventListener('input', () => {
  const q = cerca.value.trim().toLowerCase();
  vociElenco.forEach(({ li, testo }) => { li.hidden = q.length > 0 && !testo.includes(q); });
});
cerca.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const prima = vociElenco.find(({ li }) => !li.hidden);
    if (prima) vaiA(luogoPerId[prima.b.dataset.id]);
  }
  if (e.key === 'Escape') { cerca.value = ''; cerca.dispatchEvent(new Event('input')); }
});

// ── Legenda itinerari (con km reali) ──────────────────────────────────
const kmPerTipo = {};
for (const f of itinerari.features) kmPerTipo[f.properties.tipo] = (kmPerTipo[f.properties.tipo] || 0) + (f.properties.km || 0);
const tipiAttivi = new Set(Object.keys(NOME_ITINERARIO));
const ulItin = $('#elenco-itinerari');
for (const tipo of Object.keys(NOME_ITINERARIO)) {
  const li = el('li');
  const km = kmPerTipo[tipo] ? `${Math.round(kmPerTipo[tipo])} km` : '';
  li.innerHTML = `<label><input type="checkbox" checked><span class="tratto${tipo === 'storica' ? ' tratteggio' : ''}" style="--colore:${COLORE_ITINERARIO[tipo]}"></span><span>${NOME_ITINERARIO[tipo]}</span><small>${km}</small></label>`;
  li.querySelector('input').addEventListener('change', (e) => {
    e.target.checked ? tipiAttivi.add(tipo) : tipiAttivi.delete(tipo);
    const filtro = ['in', ['get', 'tipo'], ['literal', [...tipiAttivi]]];
    map.setFilter('itinerari', ['all', ['!=', ['get', 'tipo'], 'storica'], filtro]);
    map.setFilter('itinerari-alone', ['all', ['!=', ['get', 'tipo'], 'storica'], filtro]);
    map.setFilter('itinerari-storica', ['all', ['==', ['get', 'tipo'], 'storica'], filtro]);
  });
  ulItin.appendChild(li);
}

// ── Strati della mappa ────────────────────────────────────────────────
const STRATI = [
  { id: 'vigneti', nome: 'Vigneti', icona: 'vigna', layers: ['landcover-vigneto'] },
  { id: 'cantine', nome: 'Cantine', icona: 'cantina', layers: ['cantine'], nota: 'da zoom Borghi' },
  { id: 'edifici', nome: 'Edifici in 3D', icona: 'edificio', layers: ['edifici-3d'], nota: 'da zoom Dettaglio' },
  { id: 'rilievo', nome: 'Rilievo', icona: 'rilievo', terreno: true },
  { id: 'comuni', nome: 'Confini dei comuni', icona: 'strada', layers: ['comuni-confini', 'territorio-confine'] },
];
const ulStrati = $('#elenco-strati');
for (const s of STRATI) {
  const li = el('li');
  li.innerHTML = `<label><input type="checkbox" checked><span class="icona">${svgIcona(s.icona)}</span><span>${s.nome}</span>${s.nota ? `<small>${s.nota}</small>` : ''}</label>`;
  li.querySelector('input').addEventListener('change', (e) => {
    if (s.terreno) { map.setTerrain(e.target.checked ? { source: 'dem', exaggeration: 1.45 } : null); return; }
    s.layers.forEach((id) => map.setLayoutProperty(id, 'visibility', e.target.checked ? 'visible' : 'none'));
  });
  ulStrati.appendChild(li);
}

// ── Interazione con i simboli ─────────────────────────────────────────
const LAYER_CLICCABILI = ['luoghi-icone', 'citta', 'paesi', 'frazioni', 'frazioni-minime', 'cantine'];
map.on('mousemove', (e) => {
  if (MOBILE.matches) return;
  const hit = map.queryRenderedFeatures(e.point, { layers: LAYER_CLICCABILI.filter((l) => map.getLayer(l)) });
  $('#mappa').classList.toggle('puntatore', hit.length > 0);
});
map.on('click', (e) => {
  const hit = map.queryRenderedFeatures(e.point, { layers: LAYER_CLICCABILI.filter((l) => map.getLayer(l)) });
  if (MOBILE.matches && statoFoglio() !== 'spia') foglio('spia');
  if (!hit.length) { chiudiScheda(); evidenzia(null); return; }
  const f = hit[0];
  const p = f.properties;
  if (f.layer.id === 'cantine') { mostraScheda(p); evidenzia(null); return; }
  const orig = luogoPerId[p.id];
  if (orig) { mostraScheda(orig.properties); evidenzia(p.id); if (map.getZoom() < (ZOOM_TIPO[p.tipo] || 14) - 1.5) vaiA(orig); }
});

// ── Scheda ────────────────────────────────────────────────────────────
const scheda = $('#scheda');
function mostraScheda(p) {
  $('#scheda-tipo').textContent = p.tipo === 'luogo' ? (NOME_CAT[p.cat] || NOME_TIPO.luogo) : (NOME_TIPO[p.tipo] || '');
  $('#scheda-nome').textContent = p.nome;
  const testo = p.desc || (p.tipo === 'cantina' ? 'Cantina censita su OpenStreetMap.' : p.tipo === 'enoteca' ? 'Enoteca censita su OpenStreetMap.' : 'Tappa della Strada del Prosecco e Vini dei Colli Conegliano Valdobbiadene.');
  $('#scheda-testo').textContent = testo;
  const extra = [];
  if (p.via) extra.push(p.via + (p.comune ? ', ' + p.comune : ''));
  if (p.sito) { const u = /^https?:/.test(p.sito) ? p.sito : 'https://' + p.sito; extra.push(`<a href="${u}" target="_blank" rel="noopener">Sito web</a>`); }
  if (p.fonte === 'stima') extra.push('Posizione approssimata.');
  $('#scheda-extra').innerHTML = extra.join(' · ');
  $('#scheda-extra').hidden = extra.length === 0;
  scheda.hidden = false;
  if (MOBILE.matches) foglio('spia');
}
function chiudiScheda() { scheda.hidden = true; }
$('#scheda-chiudi').addEventListener('click', () => { chiudiScheda(); evidenzia(null); });

// ── Comandi ───────────────────────────────────────────────────────────
$('#zoom-piu').addEventListener('click', () => map.zoomIn({ duration: 400 }));
$('#zoom-meno').addEventListener('click', () => map.zoomOut({ duration: 400 }));
$('#vista-iniziale').addEventListener('click', () => { vistaIniziale(true); chiudiScheda(); evidenzia(null); });

// ── Foglio dal basso (telefono): tre posizioni, spia / mezzo / aperto ──
const pannello = $('#pannello');
const STATI = ['spia', 'mezzo', 'aperto'];
function altezzaFoglio() {
  // altezza della parte sempre visibile (maniglia + titolo + ricerca + livelli)
  if (!MOBILE.matches) return 0;
  const spia = document.querySelector('#pannello .spia');
  return spia ? spia.offsetHeight : 200;
}
function foglio(stato) {
  STATI.forEach((s) => pannello.classList.toggle(s, s === stato));
  pannello.style.transform = '';
  pannello.dataset.stato = stato;
  document.documentElement.style.setProperty('--spia', altezzaFoglio() + 'px');
}
function statoFoglio() { return pannello.dataset.stato || 'spia'; }
foglio('spia');
window.addEventListener('resize', () => foglio(statoFoglio()));
MOBILE.addEventListener('change', () => { foglio('spia'); vistaIniziale(false); });

// trascinamento con il dito sulla maniglia / testata
let trascino = null;
const maniglia = pannello.querySelector('.maniglia');
maniglia.addEventListener('pointerdown', (e) => {
  trascino = { y0: e.clientY, h: pannello.getBoundingClientRect().height, start: pannello.getBoundingClientRect().top, mosso: false };
  pannello.style.transition = 'none';
  maniglia.setPointerCapture(e.pointerId);
});
maniglia.addEventListener('pointermove', (e) => {
  if (!trascino) return;
  const dy = e.clientY - trascino.y0;
  if (Math.abs(dy) > 4) trascino.mosso = true;
  const top = Math.max(window.innerHeight * 0.08, trascino.start + dy);
  pannello.style.transform = `translateY(${top - (window.innerHeight - trascino.h)}px)`;
});
function fineTrascino(e) {
  if (!trascino) return;
  pannello.style.transition = '';
  const t = trascino; trascino = null;
  if (!t.mosso) { foglio(statoFoglio() === 'spia' ? 'aperto' : 'spia'); return; }
  const top = pannello.getBoundingClientRect().top;
  const visibile = window.innerHeight - top;
  const h = window.innerHeight;
  foglio(visibile < h * 0.38 ? 'spia' : visibile < h * 0.72 ? 'mezzo' : 'aperto');
}
maniglia.addEventListener('pointerup', fineTrascino);
maniglia.addEventListener('pointercancel', fineTrascino);
cerca.addEventListener('focus', () => { if (MOBILE.matches && statoFoglio() === 'spia') foglio('mezzo'); });
pannello.querySelectorAll('.sezione h2').forEach((h) => h.addEventListener('click', () => { if (MOBILE.matches && statoFoglio() !== 'aperto') foglio('aperto'); }));

function avviso(testo, ms = 4000) {
  const a = $('#avviso');
  a.textContent = testo; a.hidden = false;
  clearTimeout(a._t); a._t = setTimeout(() => { a.hidden = true; }, ms);
}

// Per il collaudo dalla console: __colli.map, __colli.vaiA('castelbrando')
window.__colli = { map, vaiA: (id, z) => vaiA(luogoPerId[id], z), luoghi, itinerari, LIVELLI, ICONE };
