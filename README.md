# Colli di Conegliano Valdobbiadene

Mappa dinamica della Strada del Prosecco e Vini dei Colli Conegliano Valdobbiadene:
cartografia vettoriale reale (OpenStreetMap) con rilievo, veduta dall'alto fissa, contenuti che
compaiono con lo zoom (Territorio → Paesi → Borghi → Dettaglio), pensata prima di tutto per lo smartphone.

**Sito:** https://manuelavanzi.github.io/coneglianovaldobbiadene/

Istruzioni d'uso, provenienza dei dati, struttura del codice e come aggiungere luoghi o itinerari:
[LEGGIMI.md](LEGGIMI.md).

## In breve

```
npm install        # solo per rigenerare i dati
npm run dati       # scarica luoghi, itinerari, confini e cantine da OpenStreetMap/OSRM
npm start          # anteprima locale su http://localhost:5300
npm run pubblica   # commit + push su main → GitHub Pages aggiorna il sito
```

Cartografia © [OpenStreetMap](https://www.openstreetmap.org/copyright) via [OpenFreeMap](https://openfreemap.org),
rilievo Mapzen / AWS Terrain Tiles, mappa con [MapLibre GL JS](https://maplibre.org).
Itinerari ricavati dalla mappa ufficiale della [Strada del Prosecco](https://www.coneglianovaldobbiadene.it).
