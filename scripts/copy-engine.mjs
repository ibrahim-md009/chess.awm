// Copies the Stockfish lite, single-threaded WASM engine from node_modules into
// public/engine so Vite serves it as a static file the Web Worker can load.
//
// Why lite + single-threaded: ~1.7 MB, and it needs no special server headers
// (the multi-threaded builds require COOP/COEP cross-origin isolation).
//
// This script never fails the install: if the engine is missing it only prints a
// warning, and the app shows a clear Arabic error when the user starts the engine.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = resolve(root, 'node_modules', 'stockfish');
const binDir = resolve(pkgDir, 'bin');
const outDir = resolve(root, 'public', 'engine');

function warn(msg) {
  console.warn(`[copy-engine] ${msg}`);
}

if (!existsSync(binDir)) {
  warn('node_modules/stockfish/bin not found. Run "npm install" first.');
  process.exit(0);
}

const files = readdirSync(binDir);
const jsFile = files.find((f) => /lite-single\.js$/.test(f));
const wasmFile = jsFile ? jsFile.replace(/\.js$/, '.wasm') : null;

if (!jsFile || !files.includes(wasmFile)) {
  warn('Could not find the lite single-threaded engine files in node_modules/stockfish/bin.');
  warn(`Files found: ${files.join(', ') || '(none)'}`);
  process.exit(0);
}

let version = 'unknown';
try {
  version = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')).version;
} catch {
  /* version is informational only */
}

// Start clean so a version bump never leaves stale engine files behind.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

copyFileSync(resolve(binDir, jsFile), resolve(outDir, jsFile));
copyFileSync(resolve(binDir, wasmFile), resolve(outDir, wasmFile));
writeFileSync(
  resolve(outDir, 'engine.json'),
  `${JSON.stringify({ file: jsFile, wasm: wasmFile, version }, null, 2)}\n`,
);

console.log(`[copy-engine] Copied ${jsFile} (+ .wasm) to public/engine (stockfish ${version}).`);
