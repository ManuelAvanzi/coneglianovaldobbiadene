// Icone a tratto (SVG) per i luoghi della mappa. Vengono rasterizzate e caricate come
// immagini di MapLibre, così i simboli hanno collisione e dissolvenza native.
// Ogni icona è disegnata in una viewBox 24x24 con stroke; il badge tondo è aggiunto a runtime.

export const ICONE = {
  castello: '<path d="M5 20V8h2V6h2v2h2V6h2v2h2V6h2v2h2v12"/><path d="M5 20h14"/><path d="M10 20v-5h4v5"/>',
  abbazia: '<path d="M4 20V11l4-3 4 3 4-3 4 3v9"/><path d="M4 20h16"/><path d="M8 20v-5M12 20v-5M16 20v-5"/><path d="M8 11v-1M16 11v-1"/><path d="M12 4v3M10.5 5.5h3"/>',
  villa: '<path d="M3 11l9-6 9 6"/><path d="M5 11v9h14v-9"/><path d="M9 20v-5h2v5M13 20v-5h2v5"/><path d="M3 20h18"/>',
  lago: '<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M8 5l2 2M16 5l-2 2"/>',
  grotta: '<path d="M3 20V12a9 9 0 0 1 18 0v8"/><path d="M8 20v-5a4 4 0 0 1 8 0v5"/><path d="M3 20h18"/>',
  mulino: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7 7l10 10M17 7L7 17"/>',
  pieve: '<path d="M6 20V10l6-4 6 4v10"/><path d="M4 20h16"/><path d="M12 6V3M10.5 4.5h3"/><path d="M10 20v-4h4v4"/>',
  loggia: '<path d="M3 20V9h18v11"/><path d="M3 9l9-5 9 5"/><path d="M6 20v-6a2 2 0 0 1 4 0v6M14 20v-6a2 2 0 0 1 4 0v6"/><path d="M3 20h18"/>',
  campanile: '<path d="M8 21V7l4-4 4 4v14"/><path d="M10 12h4M10 16h4"/><path d="M12 7v1"/><path d="M6 21h12"/>',
  chiesa: '<path d="M5 21V12l7-5 7 5v9"/><path d="M12 7V3M10 4.5h4"/><path d="M10 21v-5h4v5"/><path d="M4 21h16"/>',
  zona: '<circle cx="12" cy="8" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="12" cy="16" r="2.5"/><path d="M12 5.5V2M12 2c2 0 3 1 4 2"/>',
  cantina: '<path d="M8 3h8v5l2 3v10H6V11l2-3z"/><path d="M9 14h6M9 17h6"/>',
  enoteca: '<path d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M12 13v7M9 20h6"/>',
  scuola: '<path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12.5V17c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5"/><path d="M21 10v6"/>',
  citta: '<circle cx="12" cy="12" r="5"/>',
  cerca: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  chiudi: '<path d="M6 6l12 12M18 6L6 18"/>',
  mira: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  piu: '<path d="M12 5v14M5 12h14"/>',
  meno: '<path d="M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  strada: '<path d="M4 20c4-6 12-6 16-12"/><path d="M4 12c3 0 5-4 8-4"/>',
  vigna: '<path d="M4 20V9M10 20V9M16 20V9M20 20V9"/><path d="M4 12h16M4 16h16"/>',
  edificio: '<path d="M4 20V8l5-3v15M9 20V5l6 3v12M15 20V8l5 3v9"/><path d="M3 20h18"/>',
  rilievo: '<path d="M2 20l6-10 4 6 3-4 7 8z"/><path d="M8 10l2 3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
};

export function svgIcona(nome, { size = 24, colore = 'currentColor', spessore = 1.8 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${colore}" stroke-width="${spessore}" stroke-linecap="round" stroke-linejoin="round">${ICONE[nome] || ''}</svg>`;
}

// Badge tondo con icona dentro, per i simboli sulla mappa.
export function svgBadge(nome, { size = 44, sfondo = '#FFFBF0', bordo = '#9C1220', tratto = '#9C1220', spessore = 2 } = {}) {
  const r = size / 2;
  const pad = size * 0.22;
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="${sfondo}" stroke="${bordo}" stroke-width="${spessore}"/>
  <g transform="translate(${pad} ${pad}) scale(${inner / 24})" fill="none" stroke="${tratto}" stroke-width="${(spessore * 24) / inner}" stroke-linecap="round" stroke-linejoin="round">${ICONE[nome] || ''}</g>
</svg>`;
}

// Rasterizza un SVG e lo registra in MapLibre come immagine (pixelRatio 2 per nitidezza su retina).
export function caricaImmagineSvg(map, id, svg, pixelRatio = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio }); resolve(); };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// Trama a righe diagonali per i vigneti (filari).
export function patternVigneto(base = '#CFCF93', riga = '#A9AB6A') {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  g.strokeStyle = riga; g.lineWidth = 1.6;
  g.beginPath();
  for (let i = -16; i <= 32; i += 6) { g.moveTo(i, 16); g.lineTo(i + 16, 0); }
  g.stroke();
  return g.getImageData(0, 0, 16, 16);
}
