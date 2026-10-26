// Costruisce i dati geografici della webapp a partire da fonti aperte:
//   - Nominatim (OpenStreetMap) per affinare le coordinate dei luoghi   -> data/luoghi.geojson
//   - OSRM (rete stradale OpenStreetMap) per i tracciati degli itinerari -> data/itinerari.geojson
//   - Overpass (OpenStreetMap) per i confini dei 15 comuni DOCG          -> data/territorio.geojson + data/maschera.geojson
//   - Overpass per le cantine (craft=winery)                             -> data/cantine.geojson
// Ogni risposta è messa in cache in data/cache/ così i rerun sono immediati.
// Uso:  node tools/build-data.mjs [--no-cache]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import osmtogeojson from 'osmtogeojson';
import * as turf from '@turf/turf';
import { LUOGHI, ITINERARI, COMUNI_DOCG, BBOX } from './luoghi.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const CACHE = path.join(DATA, 'cache');
fs.mkdirSync(CACHE, { recursive: true });
const NO_CACHE = process.argv.includes('--no-cache');
const UA = 'coneglianovaldobbiadene-webapp/0.1 (uso didattico; manuel.92.avanzi@gmail.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[dati]', ...a);

async function cached(key, fn) {
  const f = path.join(CACHE, key + '.json');
  if (!NO_CACHE && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = await fn();
  fs.writeFileSync(f, JSON.stringify(v));
  return v;
}

async function getJSON(url, opts = {}, tentativi = 3) {
  for (let i = 1; i <= tentativi; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, ...opts });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === tentativi) throw e;
      log(`  tentativo ${i} fallito (${e.message}), riprovo…`);
      await sleep(2000 * i);
    }
  }
}

function dentroBBox(lat, lon) {
  return lat >= BBOX.s && lat <= BBOX.n && lon >= BBOX.w && lon <= BBOX.e;
}

// ── 1. Luoghi: geocodifica con Nominatim ───────────────────────────────
async function geocodifica() {
  log('Geocodifica luoghi…');
  const feats = [];
  for (const L of LUOGHI) {
    let lat = L.lat, lon = L.lon, fonte = 'stima';
    try {
      const res = await cached('nominatim_' + L.id, async () => {
        const u = new URL('https://nominatim.openstreetmap.org/search');
        u.searchParams.set('q', L.q || L.nome);
        u.searchParams.set('format', 'jsonv2');
        u.searchParams.set('limit', '5');
        u.searchParams.set('countrycodes', 'it');
        u.searchParams.set('viewbox', `${BBOX.w},${BBOX.n},${BBOX.e},${BBOX.s}`);
        u.searchParams.set('bounded', '1');
        const j = await getJSON(u.toString());
        await sleep(1100); // limite Nominatim: 1 richiesta al secondo
        return j;
      });
      // Prendo il primo risultato entro 6 km dalla stima (evita omonimi).
      const ok = (res || []).map((r) => ({ lat: +r.lat, lon: +r.lon, tipo: r.type, cls: r.class, nome: r.display_name }))
        .filter((r) => dentroBBox(r.lat, r.lon))
        .map((r) => ({ ...r, d: turf.distance([L.lon, L.lat], [r.lon, r.lat]) }))
        .filter((r) => r.d < 6)
        .sort((a, b) => a.d - b.d);
      if (ok.length) { lat = ok[0].lat; lon = ok[0].lon; fonte = 'osm'; }
      else log(`  ${L.id}: nessun risultato affidabile, tengo la stima`);
    } catch (e) {
      log(`  ${L.id}: errore geocodifica (${e.message}), tengo la stima`);
    }
    feats.push(turf.point([+lon.toFixed(5), +lat.toFixed(5)], {
      id: L.id, nome: L.nome, tipo: L.tipo, cat: L.cat || null, tier: L.tier, desc: L.desc || '', fonte,
    }));
  }
  const fc = turf.featureCollection(feats);
  fs.writeFileSync(path.join(DATA, 'luoghi.geojson'), JSON.stringify(fc));
  log(`  ${feats.length} luoghi (${feats.filter((f) => f.properties.fonte === 'osm').length} da OSM)`);
  return fc;
}

// ── 2. Itinerari: tracciato stradale OSRM ──────────────────────────────
async function itinerari(luoghi) {
  log('Itinerari su rete stradale (OSRM)…');
  const byId = Object.fromEntries(luoghi.features.map((f) => [f.properties.id, f.geometry.coordinates]));
  const feats = [];
  for (const it of ITINERARI) {
    const pts = it.tappe.map((id) => { if (!byId[id]) throw new Error('tappa sconosciuta: ' + id); return byId[id]; });
    try {
      const j = await cached('osrm_' + it.id, async () => {
        const coords = pts.map((c) => c.join(',')).join(';');
        const u = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&continue_straight=false`;
        const r = await getJSON(u);
        await sleep(500);
        return r;
      });
      if (j.code !== 'Ok') throw new Error(j.code);
      const route = j.routes[0];
      feats.push(turf.feature(route.geometry, { id: it.id, nome: it.nome, tipo: it.tipo, km: +(route.distance / 1000).toFixed(1), fonte: 'osrm' }));
      log(`  ${it.id}: ${(route.distance / 1000).toFixed(1)} km`);
    } catch (e) {
      log(`  ${it.id}: OSRM non disponibile (${e.message}), uso la spezzata tra le tappe`);
      feats.push(turf.lineString(pts, { id: it.id, nome: it.nome, tipo: it.tipo, km: null, fonte: 'spezzata' }));
    }
  }
  fs.writeFileSync(path.join(DATA, 'itinerari.geojson'), JSON.stringify(turf.featureCollection(feats)));
}

// ── 3. Territorio: confini dei comuni DOCG (Overpass) ──────────────────
const OVERPASS_MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];
async function overpass(key, query) {
  return cached(key, async () => {
    let err;
    for (const url of OVERPASS_MIRRORS) {
      try {
        const r = await getJSON(url, { method: 'POST', body: 'data=' + encodeURIComponent(query) }, 2);
        await sleep(1000);
        return r;
      } catch (e) { err = e; log(`  mirror ${new URL(url).host} non risponde (${e.message})`); }
    }
    throw err;
  });
}

async function territorio() {
  log('Confini dei comuni DOCG (Overpass)…');
  const b = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
  const nomi = COMUNI_DOCG.map((n) => n.replace(/'/g, "\\'")).join('|');
  const q = `[out:json][timeout:90];rel["boundary"="administrative"]["admin_level"="8"]["name"~"^(${nomi})$"](${b});out geom;`;
  try {
    const osm = await overpass('overpass_comuni', q);
    const gj = osmtogeojson(osm);
    const polys = gj.features.filter((f) => /Polygon/.test(f.geometry.type));
    log(`  ${polys.length} comuni trovati: ${polys.map((f) => f.properties.name).sort().join(', ')}`);
    const comuni = turf.featureCollection(polys.map((f) => turf.feature(f.geometry, { nome: f.properties.name })));
    fs.writeFileSync(path.join(DATA, 'comuni.geojson'), JSON.stringify(comuni));
    let unione = turf.union(turf.featureCollection(polys.map((f) => turf.feature(f.geometry))));
    unione = turf.simplify(unione, { tolerance: 0.0003, highQuality: true });
    fs.writeFileSync(path.join(DATA, 'territorio.geojson'), JSON.stringify(turf.featureCollection([turf.feature(unione.geometry, { nome: 'Conegliano Valdobbiadene DOCG' })])));
    // Maschera: tutto il mondo meno il territorio (per scurire l'esterno come nella mappa illustrata)
    const mondo = turf.polygon([[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]]);
    const maschera = turf.difference(turf.featureCollection([mondo, unione]));
    fs.writeFileSync(path.join(DATA, 'maschera.geojson'), JSON.stringify(turf.featureCollection([maschera])));
  } catch (e) {
    log(`  Overpass non disponibile (${e.message}): uso un riquadro di ripiego`);
    const box = turf.bboxPolygon([BBOX.w + 0.03, BBOX.s + 0.03, BBOX.e - 0.03, BBOX.n - 0.03]);
    fs.writeFileSync(path.join(DATA, 'territorio.geojson'), JSON.stringify(turf.featureCollection([box])));
    const mondo = turf.polygon([[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]]);
    fs.writeFileSync(path.join(DATA, 'maschera.geojson'), JSON.stringify(turf.featureCollection([turf.difference(turf.featureCollection([mondo, box]))])));
  }
}

// ── 4. Cantine (Overpass craft=winery) ─────────────────────────────────
async function cantine() {
  log('Cantine (Overpass craft=winery)…');
  const b = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
  const q = `[out:json][timeout:90];(nwr["craft"="winery"](${b});nwr["shop"="wine"]["craft"!="winery"](${b}););out center tags;`;
  try {
    const osm = await overpass('overpass_cantine', q);
    const feats = [];
    for (const el of osm.elements) {
      const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
      if (lat == null || !el.tags?.name) continue;
      feats.push(turf.point([+lon.toFixed(5), +lat.toFixed(5)], {
        id: el.type[0] + el.id, nome: el.tags.name, tipo: el.tags.craft === 'winery' ? 'cantina' : 'enoteca',
        sito: el.tags.website || el.tags['contact:website'] || null,
        via: [el.tags['addr:street'], el.tags['addr:housenumber']].filter(Boolean).join(' ') || null,
        comune: el.tags['addr:city'] || null,
      }));
    }
    fs.writeFileSync(path.join(DATA, 'cantine.geojson'), JSON.stringify(turf.featureCollection(feats)));
    log(`  ${feats.length} cantine/enoteche con nome`);
  } catch (e) {
    log(`  Overpass non disponibile (${e.message}): cantine.geojson vuoto`);
    fs.writeFileSync(path.join(DATA, 'cantine.geojson'), JSON.stringify(turf.featureCollection([])));
  }
}

const luoghi = await geocodifica();
await itinerari(luoghi);
await territorio();
await cantine();
log('Fatto. File in', DATA);
