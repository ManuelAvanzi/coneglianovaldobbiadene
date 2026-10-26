// Stile cartografico "illustrato" per i Colli di Conegliano Valdobbiadene.
// Tegole vettoriali: OpenFreeMap (schema OpenMapTiles, dati OpenStreetMap), nessuna chiave richiesta.
// Rilievo: AWS Terrain Tiles (Mapzen terrarium), nessuna chiave richiesta.

export const PALETTE = {
  terra: '#EFE6C8',        // pergamena di fondo
  terraAlta: '#DCD3A6',    // colline (sopra 300 m, via landcover/hillshade)
  bosco: '#8FA564',
  boscoScuro: '#6F8A4C',
  prato: '#D3D59A',
  vigna: '#CFCF93',
  vignaRiga: '#A9AB6A',
  urbano: '#E6D7B8',
  industria: '#DDD2C2',
  parco: '#BFCF8C',
  acqua: '#8EC5E3',
  acquaScura: '#5E9EC4',
  fiume: '#7DB6D8',
  esterno: '#36434B',      // fuori dal territorio DOCG (come il grigio della mappa illustrata)
  confine: '#8C1C2C',
  autostrada: '#E9C35A',
  autostradaBordo: '#8E6E1F',
  stradaStatale: '#FFFFFF',
  stradaBordo: '#A89C7E',
  stradaMinore: '#FBF6E8',
  ferrovia: '#4A4A4A',
  edificio: '#D9C7A3',
  edificioBordo: '#B8A478',
  testo: '#2F3B42',
  testoRosso: '#9C1220',
  alone: 'rgba(255, 250, 235, 0.92)',
  principale: '#C8102E',
  variante: '#F08A24',
  fregona: '#8B4A1A',
  collalto: '#2E9E4F',
  storica: '#E36C8E',
};

export const COLORE_ITINERARIO = {
  principale: PALETTE.principale, variante: PALETTE.variante, fregona: PALETTE.fregona,
  collalto: PALETTE.collalto, storica: PALETTE.storica,
};

export const NOME_ITINERARIO = {
  principale: 'Percorso principale', storica: 'La via storica del Prosecco', variante: 'Storia e cultura tra Serravalle e Follina',
  collalto: 'Il feudo dei Collalto', fregona: 'Torchiato di Fregona',
};

// Soglie di zoom dei livelli di dettaglio (usate dallo stile e dall'interfaccia).
export const LIVELLI = [
  { id: 'territorio', nome: 'Territorio', da: 0, cosa: 'Confine DOCG, città, percorso principale' },
  { id: 'paesi', nome: 'Paesi', da: 11, cosa: 'Paesi, luoghi da visitare, tutti gli itinerari' },
  { id: 'borghi', nome: 'Borghi', da: 12.5, cosa: 'Frazioni, nomi delle strade, cantine' },
  { id: 'dettaglio', nome: 'Dettaglio', da: 14, cosa: 'Edifici in 3D, nomi delle cantine, località' },
];

const FONT = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold'];
const FONT_ITALIC = ['Noto Sans Italic'];
const nomeIt = ['coalesce', ['get', 'name:it'], ['get', 'name']];

export function creaStile({ base = '.' } = {}) {
  const DEM = { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: 'Rilievo: Mapzen / AWS Terrain Tiles' };
  return {
    version: 8,
    name: 'Colli Conegliano Valdobbiadene',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      osm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap, OpenFreeMap' },
      dem: DEM,
      ombre: { ...DEM },
      territorio: { type: 'geojson', data: `${base}/data/territorio.geojson` },
      maschera: { type: 'geojson', data: `${base}/data/maschera.geojson` },
      comuni: { type: 'geojson', data: `${base}/data/comuni.geojson` },
      itinerari: { type: 'geojson', data: `${base}/data/itinerari.geojson` },
      luoghi: { type: 'geojson', data: `${base}/data/luoghi.geojson` },
      cantine: { type: 'geojson', data: `${base}/data/cantine.geojson` },
    },
    layers: [
      { id: 'sfondo', type: 'background', paint: { 'background-color': PALETTE.terra } },

      // ── Copertura del suolo ──
      { id: 'landcover-prato', type: 'fill', source: 'osm', 'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['grass', 'farmland']]],
        paint: { 'fill-color': PALETTE.prato, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.35, 13, 0.55] } },
      { id: 'landcover-vigneto', type: 'fill', source: 'osm', 'source-layer': 'landcover',
        filter: ['==', ['get', 'subclass'], 'vineyard'],
        paint: { 'fill-pattern': 'vigneto', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.55, 13, 0.9] } },
      { id: 'landcover-bosco', type: 'fill', source: 'osm', 'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 9, PALETTE.bosco, 14, PALETTE.boscoScuro], 'fill-opacity': 0.85 } },
      { id: 'landuse-urbano', type: 'fill', source: 'osm', 'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood', 'quarter']]],
        paint: { 'fill-color': PALETTE.urbano, 'fill-opacity': 0.8 } },
      { id: 'landuse-industria', type: 'fill', source: 'osm', 'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['industrial', 'commercial', 'retail', 'railway']]],
        paint: { 'fill-color': PALETTE.industria, 'fill-opacity': 0.7 } },
      { id: 'landuse-parco', type: 'fill', source: 'osm', 'source-layer': 'park',
        paint: { 'fill-color': PALETTE.parco, 'fill-opacity': 0.6 } },

      // ── Acque ──
      { id: 'acqua', type: 'fill', source: 'osm', 'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': PALETTE.acqua, 'fill-outline-color': PALETTE.acquaScura } },
      { id: 'fiumi', type: 'line', source: 'osm', 'source-layer': 'waterway', minzoom: 10,
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'line-color': PALETTE.fiume, 'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 10, ['match', ['get', 'class'], 'river', 1.2, 0.4], 16, ['match', ['get', 'class'], 'river', 7, 2]] } },

      // ── Rilievo (ombreggiatura sopra le campiture, sotto le strade) ──
      { id: 'ombre', type: 'hillshade', source: 'ombre',
        paint: { 'hillshade-exaggeration': ['interpolate', ['linear'], ['zoom'], 9, 0.45, 14, 0.25], 'hillshade-shadow-color': '#5E4D2E', 'hillshade-highlight-color': '#FFF9E6', 'hillshade-accent-color': '#7E6E44', 'hillshade-illumination-direction': 320 } },

      // ── Territorio DOCG: esterno scurito e confini ──
      { id: 'maschera', type: 'fill', source: 'maschera',
        paint: { 'fill-color': PALETTE.esterno, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.72, 13, 0.5, 16, 0.3] } },
      { id: 'comuni-confini', type: 'line', source: 'comuni', minzoom: 11,
        paint: { 'line-color': PALETTE.confine, 'line-width': 0.8, 'line-dasharray': [3, 3], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 0.5] } },
      { id: 'territorio-confine', type: 'line', source: 'territorio',
        paint: { 'line-color': PALETTE.confine, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 14, 3], 'line-opacity': 0.9 } },

      // ── Strade ──
      { id: 'strade-minori', type: 'line', source: 'osm', 'source-layer': 'transportation', minzoom: 12,
        filter: ['all', ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['match', ['get', 'class'], 'track', '#C9B98F', PALETTE.stradaMinore], 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.6, 16, 4], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 13, 1] } },
      { id: 'strade-bordo', type: 'line', source: 'osm', 'source-layer': 'transportation', minzoom: 10,
        filter: ['all', ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.stradaBordo, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 1.4, 14, 4.5, 17, 12] } },
      { id: 'strade', type: 'line', source: 'osm', 'source-layer': 'transportation', minzoom: 10,
        filter: ['all', ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.stradaStatale, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 0.8, 14, 3, 17, 9] } },
      { id: 'autostrada-bordo', type: 'line', source: 'osm', 'source-layer': 'transportation',
        filter: ['all', ['==', ['get', 'class'], 'motorway'], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.autostradaBordo, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 2.2, 14, 7, 17, 16] } },
      { id: 'autostrada', type: 'line', source: 'osm', 'source-layer': 'transportation',
        filter: ['all', ['==', ['get', 'class'], 'motorway'], ['!=', ['get', 'brunnel'], 'tunnel']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.autostrada, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 1.2, 14, 4.5, 17, 12] } },
      { id: 'ferrovia', type: 'line', source: 'osm', 'source-layer': 'transportation', minzoom: 10,
        filter: ['all', ['==', ['get', 'class'], 'rail'], ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'line-color': PALETTE.ferrovia, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 3] } },
      { id: 'ferrovia-traversine', type: 'line', source: 'osm', 'source-layer': 'transportation', minzoom: 12,
        filter: ['all', ['==', ['get', 'class'], 'rail'], ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 16, 1.8], 'line-dasharray': [4, 4] } },

      // ── Edifici in 3D (solo al livello "Dettaglio") ──
      { id: 'edifici-3d', type: 'fill-extrusion', source: 'osm', 'source-layer': 'building', minzoom: 14,
        paint: { 'fill-extrusion-color': PALETTE.edificio, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.8, 0.9] } },

      // ── Itinerari della Strada del Prosecco ──
      { id: 'itinerari-alone', type: 'line', source: 'itinerari',
        filter: ['!=', ['get', 'tipo'], 'storica'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.alone, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 4, 13, 8, 16, 14], 'line-opacity': 0.75 } },
      { id: 'itinerari', type: 'line', source: 'itinerari',
        filter: ['!=', ['get', 'tipo'], 'storica'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['match', ['get', 'tipo'], 'principale', PALETTE.principale, 'variante', PALETTE.variante, 'fregona', PALETTE.fregona, 'collalto', PALETTE.collalto, PALETTE.principale],
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 13, 4, 16, 7],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, ['case', ['==', ['get', 'tipo'], 'principale'], 1, 0], 11, 1] } },
      { id: 'itinerari-storica', type: 'line', source: 'itinerari', minzoom: 10.5,
        filter: ['==', ['get', 'tipo'], 'storica'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': PALETTE.storica, 'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 1.5, 14, 3], 'line-dasharray': [1.5, 2], 'line-offset': ['interpolate', ['linear'], ['zoom'], 10.5, 4, 14, 8], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 11.5, 1] } },

      // ── Nomi: acque, strade, cime ──
      { id: 'nomi-acqua', type: 'symbol', source: 'osm', 'source-layer': 'water_name', minzoom: 11,
        layout: { 'text-field': nomeIt, 'text-font': FONT_ITALIC, 'text-size': 11, 'symbol-placement': 'line' },
        paint: { 'text-color': PALETTE.acquaScura, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1 } },
      { id: 'nomi-fiumi', type: 'symbol', source: 'osm', 'source-layer': 'waterway', minzoom: 12,
        layout: { 'text-field': nomeIt, 'text-font': FONT_ITALIC, 'text-size': 11, 'symbol-placement': 'line', 'symbol-spacing': 400 },
        paint: { 'text-color': PALETTE.acquaScura, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1 } },
      { id: 'nomi-strade', type: 'symbol', source: 'osm', 'source-layer': 'transportation_name', minzoom: 12.5,
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'minor', 'trunk']]],
        layout: { 'text-field': nomeIt, 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 12.5, 9, 16, 12], 'symbol-placement': 'line', 'symbol-spacing': 350, 'text-letter-spacing': 0.02 },
        paint: { 'text-color': '#5A5243', 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.2 } },
      { id: 'sigle-strade', type: 'symbol', source: 'osm', 'source-layer': 'transportation_name', minzoom: 10,
        filter: ['all', ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]], ['has', 'ref']],
        layout: { 'text-field': ['get', 'ref'], 'text-font': FONT_BOLD, 'text-size': 10, 'symbol-placement': 'line', 'symbol-spacing': 500, 'text-rotation-alignment': 'viewport', 'text-pitch-alignment': 'viewport' },
        paint: { 'text-color': '#FFFFFF', 'text-halo-color': PALETTE.autostradaBordo, 'text-halo-width': 2 } },
      { id: 'cime', type: 'symbol', source: 'osm', 'source-layer': 'mountain_peak', minzoom: 11.5,
        filter: ['all', ['==', ['get', 'class'], 'peak'], ['has', 'name']],
        layout: { 'text-field': ['concat', nomeIt, '\n', ['get', 'ele'], ' m'], 'text-font': FONT_ITALIC, 'text-size': 10, 'text-offset': [0, 0.6], 'text-anchor': 'top' },
        paint: { 'text-color': '#6B5A3A', 'text-halo-color': PALETTE.alone, 'text-halo-width': 1 } },

      // ── Cantine (OpenStreetMap) ──
      { id: 'cantine', type: 'symbol', source: 'cantine', minzoom: 12.5,
        layout: { 'icon-image': ['match', ['get', 'tipo'], 'enoteca', 'badge-enoteca', 'badge-cantina'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 12.5, 0.32, 14, 0.5, 17, 0.7],
          'text-field': ['step', ['zoom'], '', 14, ['get', 'nome']], 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 17, 12], 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-max-width': 9, 'text-optional': true, 'icon-allow-overlap': false },
        paint: { 'text-color': '#4F3A14', 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.2, 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0, 13.2, 1] } },

      // ── Località OSM minori (riempiono il livello Dettaglio) ──
      { id: 'localita-osm', type: 'symbol', source: 'osm', 'source-layer': 'place', minzoom: 14,
        filter: ['in', ['get', 'class'], ['literal', ['hamlet', 'locality', 'isolated_dwelling', 'neighbourhood']]],
        layout: { 'text-field': nomeIt, 'text-font': FONT_ITALIC, 'text-size': 11 },
        paint: { 'text-color': '#5A5243', 'text-halo-color': PALETTE.alone, 'text-halo-width': 1 } },

      // ── Luoghi curati: paesi e frazioni (etichette per livello) ──
      { id: 'frazioni', type: 'symbol', source: 'luoghi', minzoom: 12.5,
        filter: ['all', ['in', ['get', 'tipo'], ['literal', ['frazione', 'paese']]], ['>=', ['get', 'tier'], 3]],
        layout: { 'text-field': ['get', 'nome'], 'text-font': FONT_BOLD, 'text-size': ['interpolate', ['linear'], ['zoom'], 12.5, 11, 16, 14], 'text-transform': 'uppercase', 'text-letter-spacing': 0.06, 'symbol-sort-key': ['get', 'tier'] },
        paint: { 'text-color': PALETTE.testoRosso, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.5 } },
      { id: 'frazioni-minime', type: 'symbol', source: 'luoghi', minzoom: 14,
        filter: ['all', ['==', ['get', 'tipo'], 'frazione'], ['==', ['get', 'tier'], 4]],
        layout: { 'text-field': ['get', 'nome'], 'text-font': FONT_BOLD, 'text-size': 11, 'text-transform': 'uppercase', 'text-letter-spacing': 0.06 },
        paint: { 'text-color': PALETTE.testoRosso, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.5 } },
      { id: 'paesi', type: 'symbol', source: 'luoghi', minzoom: 11,
        filter: ['all', ['==', ['get', 'tipo'], 'paese'], ['==', ['get', 'tier'], 2]],
        layout: { 'icon-image': 'badge-citta', 'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.2, 14, 0.3], 'text-field': ['get', 'nome'], 'text-font': FONT_BOLD, 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 12, 15, 16], 'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-offset': [0, 0.7], 'text-anchor': 'top', 'symbol-sort-key': ['get', 'tier'] },
        paint: { 'text-color': PALETTE.testoRosso, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.6, 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 11.6, 1], 'text-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 11.6, 1] } },
      { id: 'citta', type: 'symbol', source: 'luoghi',
        filter: ['==', ['get', 'tier'], 1],
        layout: { 'icon-image': 'badge-citta', 'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.28, 14, 0.4], 'text-field': ['get', 'nome'], 'text-font': FONT_BOLD, 'text-size': ['interpolate', ['linear'], ['zoom'], 9, 13, 14, 19], 'text-transform': 'uppercase', 'text-letter-spacing': 0.1, 'text-offset': [0, 0.8], 'text-anchor': 'top', 'symbol-sort-key': 0 },
        paint: { 'text-color': PALETTE.testoRosso, 'text-halo-color': PALETTE.alone, 'text-halo-width': 2 } },

      // ── Luoghi da visitare: icone illustrate ──
      { id: 'luoghi-icone', type: 'symbol', source: 'luoghi', minzoom: 10,
        filter: ['==', ['get', 'tipo'], 'luogo'],
        layout: { 'icon-image': ['concat', 'badge-', ['get', 'cat']], 'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 0.85, 16, 1.1], 'icon-anchor': 'bottom', 'icon-offset': [0, 4],
          'text-field': ['step', ['zoom'], '', 11, ['get', 'nome']], 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 15, 13], 'text-anchor': 'top', 'text-offset': [0, 0.3], 'text-max-width': 8, 'text-optional': true, 'symbol-sort-key': ['get', 'tier'],
          'icon-pitch-alignment': 'viewport', 'icon-rotation-alignment': 'viewport' },
        paint: { 'text-color': PALETTE.testo, 'text-halo-color': PALETTE.alone, 'text-halo-width': 1.5, 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 10.6, 1] } },
    ],
  };
}
