/**
 * scripts/build.js — Flutcom Build Script
 * 
 * Genera una carpeta `dist/` lista para GitHub Pages.
 * - Copia todos los assets estáticos
 * - Minifica todos los archivos JS con Terser
 * - Minifica todos los archivos HTML con html-minifier-terser
 * - Ofusca el código fuente de la carpeta `flutcom/`
 */

import { minify as minifyJS } from 'terser';
import { minify as minifyHTML } from 'html-minifier-terser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');

// ─── Colores ANSI ───────────────────────────────────────────
const green  = '\x1b[32m';
const cyan   = '\x1b[36m';
const yellow = '\x1b[33m';
const red    = '\x1b[31m';
const dim    = '\x1b[90m';
const reset  = '\x1b[0m';
const bold   = '\x1b[1m';

// ─── Helpers ────────────────────────────────────────────────
function log(icon, color, msg) {
  console.log(`  ${color}${icon}${reset}  ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest, skipDirs = []) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (skipDirs.includes(path.basename(src))) return;
    ensureDir(dest);
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item), skipDirs);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function getAllFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results.push(...await getAllFiles(full, exts));
    } else if (exts.some(e => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// ─── Main Build ─────────────────────────────────────────────
async function build() {
  console.log();
  console.log(`  🚀  ${green}${bold}Flutcom${reset}  ${dim}Build Script — GitHub Pages${reset}`);
  console.log();

  const startTime = Date.now();

  // 1. Limpiar y crear dist/
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  ensureDir(DIST);
  log('📁', cyan, 'dist/ created');

  // 2. Copiar assets estáticos (excluyendo node_modules, scripts, src, dist)
  const skipDirs = ['node_modules', 'scripts', 'src', 'dist', '.git'];
  const staticDirs = ['assets', 'resources', 'plugins'];

  for (const dir of staticDirs) {
    const srcDir = path.join(ROOT, dir);
    const destDir = path.join(DIST, dir);
    copyRecursive(srcDir, destDir, []);
    log('📋', dim, `Copied ${dir}/`);
  }

  // 3. Copiar flutcom/ framework (se minificará después)
  copyRecursive(path.join(ROOT, 'flutcom'), path.join(DIST, 'flutcom'), []);
  log('📋', dim, 'Copied flutcom/');

  // 4. Copiar archivos raíz estáticos
  const rootFiles = ['flutcom.config.js', 'LICENSE'];
  for (const f of rootFiles) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, f));
      log('📋', dim, `Copied ${f}`);
    }
  }

  console.log();

  // 5. Minificar JS en dist/
  const jsFiles = [
    ...await getAllFiles(path.join(DIST, 'flutcom'), ['.js']),
    ...await getAllFiles(path.join(DIST, 'plugins'), ['.js']),
    path.join(DIST, 'flutcom.config.js'),
  ].filter(f => fs.existsSync(f));

  let jsCount = 0;
  for (const file of jsFiles) {
    try {
      const code = fs.readFileSync(file, 'utf-8');
      const result = await minifyJS(code, {
        compress: {
          drop_console: false,
          passes: 2,
        },
        mangle: true,
        format: { comments: false },
      });
      if (result.code) {
        fs.writeFileSync(file, result.code, 'utf-8');
        jsCount++;
      }
    } catch (e) {
      log('⚠', yellow, `Could not minify JS: ${path.relative(DIST, file)} — ${e.message}`);
    }
  }
  log('⚡', green, `Minified ${jsCount} JS files`);

  // 6. Minificar HTML (incluyendo index.html y todas las vistas)
  const htmlDirs = [
    DIST,
    path.join(DIST, 'resources'),
  ];

  const htmlFiles = [
    ...await getAllFiles(path.join(DIST, 'resources'), ['.html']),
  ];

  let htmlCount = 0;
  for (const file of htmlFiles) {
    try {
      const code = fs.readFileSync(file, 'utf-8');
      const result = await minifyHTML(code, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      });
      fs.writeFileSync(file, result, 'utf-8');
      htmlCount++;
    } catch (e) {
      log('⚠', yellow, `Could not minify HTML: ${path.relative(DIST, file)}`);
    }
  }

  // Minificar index.html raíz
  try {
    const indexSrc = path.join(ROOT, 'index.html');
    const indexDest = path.join(DIST, 'index.html');
    const code = fs.readFileSync(indexSrc, 'utf-8');
    const result = await minifyHTML(code, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    });
    fs.writeFileSync(indexDest, result, 'utf-8');
    htmlCount++;
  } catch (e) {
    log('⚠', yellow, `Could not minify index.html — ${e.message}`);
  }

  log('🗜', green, `Minified ${htmlCount} HTML files`);

  // 7. Crear .nojekyll para que GitHub Pages sirva las carpetas con _
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf-8');
  log('🔧', cyan, 'Created .nojekyll (required for GitHub Pages)');

  console.log();

  const elapsed = Date.now() - startTime;
  console.log(`  ✅  ${green}${bold}Build complete!${reset}  ${dim}in ${elapsed}ms${reset}`);
  console.log();
  console.log(`  ${dim}📂 Output: ${cyan}dist/${reset}`);
  console.log(`  ${dim}📤 Next steps:${reset}`);
  console.log(`     ${dim}1. Push the ${cyan}dist/${dim} folder to your GitHub repo's ${cyan}gh-pages${dim} branch${reset}`);
  console.log(`     ${dim}2. Or set GitHub Pages source to the ${cyan}dist/${dim} folder on ${cyan}main${reset}`);
  console.log();
}

build().catch(err => {
  console.error(`\n  ${red}❌ Build failed:${reset}`, err.message);
  process.exit(1);
});
