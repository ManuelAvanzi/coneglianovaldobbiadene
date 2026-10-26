// Pubblica online: salva tutte le modifiche in un commit e le spinge su GitHub, sul ramo main e sul ramo gh-pages.
// GitHub Pages serve il ramo gh-pages così com'è (sito statico) su https://<utente>.github.io/<repo>/
// Uso:
//   npm run pubblica                                    (repo già collegato)
//   npm run pubblica -- https://github.com/UTENTE/REPO.git   (la prima volta: collega il repo appena creato su GitHub)
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });
const out = (cmd) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

const urlArg = process.argv[2];
let remote = out('git remote get-url origin');
if (!remote && !urlArg) {
  console.error('Il progetto non è ancora collegato a GitHub.\n1. Crea un repository vuoto su https://github.com/new (pubblico, senza README).\n2. Lancia:  npm run pubblica -- https://github.com/UTENTE/REPO.git');
  process.exit(1);
}
if (urlArg) {
  remote ? run(`git remote set-url origin ${urlArg}`) : run(`git remote add origin ${urlArg}`);
  remote = urlArg;
}
const m = /github\.com[/:]([^/]+)\/([^/.]+)/.exec(remote);
if (!m) { console.error('Il remoto origin non è un repository GitHub: ' + remote); process.exit(1); }
const [, utente, repo] = m;

run('git add -A');
if (out('git status --porcelain')) run(`git commit -q -m "Aggiornamento del ${new Date().toLocaleString('it-IT')}"`);
run('git push -u origin main');
run('git push -f origin main:gh-pages');
console.log(`\nSpinto su GitHub. Tra circa un minuto il sito è su https://${utente.toLowerCase()}.github.io/${repo}/`);
console.log(`Stato della pubblicazione: https://github.com/${utente}/${repo}/deployments`);
