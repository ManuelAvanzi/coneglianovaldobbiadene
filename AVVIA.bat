@echo off
cd /d "%~dp0"
if not exist data\luoghi.geojson (
  if not exist node_modules call npm install --no-audit --no-fund
  echo Scarico i dati geografici (serve Internet, ~2 minuti)...
  call node tools\build-data.mjs
)
start "" http://localhost:5300
node server.mjs --port 5300
