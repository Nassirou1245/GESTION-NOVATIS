const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'sql', 'schema.sql'), 'utf8');

new Function(app);

// 'setup' intentionally removed — setup panel was eliminated in v4.2 hardening.
// Configuration is injected via config.js at build time; no UI panel exists.
const requiredIds = [
  'nav',
  'syncState',
  'pageTitle',
  'pageSub',
  'loginBtn',
  'logoutBtn',
  'dashboard',
  'tablePage',
  'modalBack',
  'modal'
];

const missingIds = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missingIds.length) {
  throw new Error(`Missing required HTML ids: ${missingIds.join(', ')}`);
}

const requiredFunctions = [
  'renderDashboard',
  'renderSpaces',
  'renderTenants',
  'renderRent',
  'renderReceipts',
  'renderFinance',
  'renderReports',
  'renderMaintenance',
  'renderUsers',
  'renderData',
  'importLegacyJson',
  'exportBackup'
];

const missingFunctions = requiredFunctions.filter(name => !app.includes(`function ${name}`));
if (missingFunctions.length) {
  throw new Error(`Missing required functions: ${missingFunctions.join(', ')}`);
}

const requiredTables = ['inventaire', 'locataires', 'contrats', 'loyers', 'paiements', 'maintenance', 'profiles', 'activity_logs'];
const missingTables = requiredTables.filter(table => !schema.includes(`table if not exists ${table}`));
if (missingTables.length) {
  throw new Error(`Missing required schema tables: ${missingTables.join(', ')}`);
}

for (const selector of ['.heroPanel', '.receiptBox', '.reportGrid', ':root[data-theme="dark"]']) {
  if (!css.includes(selector)) throw new Error(`Missing CSS selector: ${selector}`);
}

// ── Security: confirm no config UI leaked into the build ─────────────────────
const forbiddenUiPatterns = [
  { pattern: /id="setup"/, label: 'Setup panel HTML element' },
  { pattern: /id="supabaseUrl"/, label: 'Supabase URL input field' },
  { pattern: /id="supabaseAnon"/, label: 'Supabase anon key input field' },
  { pattern: /saveConfigBtn|testConfigBtn/, label: 'Config save/test buttons' },
  { pattern: /openConnectionSettings\s*\(/, label: 'openConnectionSettings() call' },
];
for (const { pattern, label } of forbiddenUiPatterns) {
  if (pattern.test(html) || pattern.test(app)) {
    throw new Error(`SECURITY: Forbidden config UI found in build — ${label}`);
  }
}

// ── Security: confirm config.js exists and sets __NPMS_CONFIG__ ─────────────
const configPath = path.join(root, 'config.js');
if (!fs.existsSync(configPath)) {
  console.warn('WARNING: config.js not found. Run `node build.js` before serving.');
} else {
  const configJs = fs.readFileSync(configPath, 'utf8');
  if (!configJs.includes('__NPMS_CONFIG__')) {
    throw new Error('config.js does not set window.__NPMS_CONFIG__');
  }
}

console.log('NPMS Enterprise build verification passed.');
console.log(`HTML: ${html.length} chars`);
console.log(`JS:   ${app.length} chars`);
console.log(`CSS:  ${css.length} chars`);
console.log(`SQL:  ${schema.length} chars`);
