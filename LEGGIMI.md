# Colli di Conegliano Valdobbiadene — mappa dinamica

Webapp con la mappa della Strada del Prosecco e dei Colli Conegliano Valdobbiadene
in **veduta dall'alto leggermente inclinata e fissa** (38°, nord in alto, rotazione bloccata):
si può solo spostare e zoomare. È pensata **prima di tutto per lo smartphone**: foglio dal
basso con maniglia (tre posizioni: spia, mezzo, aperto), ricerca e livelli sempre a portata di
pollice, zoom col pizzico; su schermi larghi il foglio diventa il pannello laterale. Con lo zoom i contenuti compaiono e scompaiono per
livelli: Territorio → Paesi → Borghi → Dettaglio.

## Avvio

Doppio clic su `AVVIA.bat` (installa le dipendenze e scarica i dati la prima volta),
oppure:

```
npm install
npm run dati      # scarica/aggiorna i dati geografici (serve Internet, ~2 min)
npm start         # http://localhost:5300
```

Serve una connessione a Internet anche durante l'uso: la cartografia di base
(OpenFreeMap) e il rilievo (AWS Terrain Tiles) arrivano in streaming, senza chiavi.

## Da dove vengono i dati (`tools/build-data.mjs`)

| File | Fonte | Note |
|---|---|---|
| `data/luoghi.geojson` | elenco curato in `tools/luoghi.mjs`, coordinate affinate con Nominatim (OSM) | 86 luoghi: città, paesi, frazioni, luoghi da visitare con descrizione |
| `data/itinerari.geojson` | OSRM (rete stradale OpenStreetMap) tra le tappe di `tools/luoghi.mjs` | 10 tratte, km reali; tappe ricavate dalla **mappa ufficiale** `Mappa-StradaProsecco-Touring.pdf` e dalla pagina «Da Conegliano a Valdobbiadene» di coneglianovaldobbiadene.it (26/10/2026) |
| `data/comuni.geojson`, `territorio.geojson`, `maschera.geojson` | Overpass: confini dei 15 comuni DOCG | la maschera scurisce tutto ciò che è fuori dal territorio |
| `data/cantine.geojson` | Overpass: `craft=winery` e `shop=wine` con nome | 63 punti; compaiono dal livello Borghi |

Per aggiungere o spostare un luogo, correggere una tappa o un itinerario: modifica
`tools/luoghi.mjs` e rilancia `npm run dati`. Le risposte dei servizi restano in
`data/cache/`; usa `node tools/build-data.mjs --no-cache` per riscaricare tutto.

## Itinerari (legenda ufficiale)

- **Percorso principale** (rosso, ~90 km): andata Conegliano → Collalbrigo → Rua → San Pietro di Feletto → Refrontolo → Solighetto → Soligo → Farra di Soligo → Col San Martino → Colbertaldo → Follo → Santo Stefano → San Pietro di Barbozza → Valdobbiadene; ritorno Valdobbiadene → Guia → Campea → Premaor/Pedeguarda → Farrò → Rolle → Costa di Là → Arfanta → Tarzo → Corbanese → Cozzuolo → Carpesica → Ogliano → Conegliano; anello del Cartizze Santo Stefano → Saccol → Follo.
- **La via storica del Prosecco** (tratteggio rosa, disegnata a fianco del rosso): il tracciato del 1966, che da Conegliano sale a Rua per Bagnolo e da Col San Martino va diritto a Guia.
- **Storia e cultura tra Serravalle, Conegliano, Valdobbiadene e Follina** (arancio): Guia → Combai → Miane → Follina → Cison → Mura → Soller → Lago → Santa Maria → Revine → Serravalle → Vittorio Veneto → Cozzuolo, più il raccordo Follina → Refrontolo.
- **Il feudo dei Collalto** (verde): Refrontolo → Collalto → Parè → Conegliano e l'anello Parè → Susegana (Castello di San Salvatore) → Collalto.
- **Torchiato di Fregona** (marrone): Vittorio Veneto → Anzano → Fregona → Osigo → Montaner → Sarmede → Villa di Villa, più Anzano → Sarmede.

## Pubblicazione online (GitHub Pages)

Il sito è statico: MapLibre è copiata in `vendor/`, i dati in `data/`, niente build.
A ogni push su `main` il workflow `.github/workflows/pages.yml` pubblica il contenuto del repo
su https://manuelavanzi.github.io/coneglianovaldobbiadene/ (attiva Pages da solo la prima volta).

La prima volta:
1. crea un repository vuoto e **pubblico** su https://github.com/new chiamato `coneglianovaldobbiadene` (senza README);
2. `npm run pubblica -- https://github.com/ManuelAvanzi/coneglianovaldobbiadene.git`

Le volte successive basta `npm run pubblica` (fa commit di tutto e push). Lo stato della
pubblicazione si vede nella scheda Actions del repo; il sito è online circa un minuto dopo.

## Struttura

- `index.html`, `css/app.css` — pannello laterale (ricerca, livelli, elenchi, legenda), scheda del luogo
- `js/stile.js` — stile cartografico illustrato (palette, vigneti a filari, boschi, strade, rilievo, soglie di zoom in `LIVELLI`)
- `js/app.js` — camera bloccata, caricamento icone, interazioni
- `js/icone.js` — icone a tratto SVG (badge sulla mappa e icone del pannello)
- `server.mjs` — server statico (porta 5300)

## Collaudo

Dalla console del browser: `__colli.map` (MapLibre), `__colli.vaiA('castelbrando')`.
Nel pannello browser di Claude il `requestAnimationFrame` è fermo: apri la pagina
con `?collaudo` per usare un timer al suo posto.

## Idee per il seguito

- Illustrazioni dei luoghi (disegni) al posto dei badge, come nella mappa cartacea
- La Strada non pubblica un GPX: i tracciati restano calcolati su OSRM tra le tappe ufficiali (controllare sul posto i tratti Colbertaldo→Follo e Follina→Refrontolo)
- Percorsi a piedi/bici, punti panoramici, eventi
- Versione offline: scaricare le tegole del solo territorio (es. con Planetiler) e servirle in locale
