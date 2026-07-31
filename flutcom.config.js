/**
 * flutcom.config.js
 *
 * Main configuration file for your project.
 * This is the ONLY file you need to edit to customize your site.
 *
 * ─── EQUIVALENT TO: ───────────────────────────────────────────────────────────
 *   astro.config.mjs  (Astro)
 *   next.config.js    (Next.js)
 *   vite.config.js    (Vite)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Site Information ────────────────────────────────────────────────────
export const site = {
  nombre     : "Flutcom",
  autor      : "yBlour",
  version    : "1.0.3",
  descripcion: "SPA framework for static files",
  defaultView: "home",        // View that loads when entering #/
  notFoundView: "resources/views/public/404.html", // Path to your own 404 HTML
};


// ─── HTML Structure (UI Partials) ────────────────────────────────────────
// Files that are injected into the layout containers (index.html)
export const partials = {
  navbar : "resources/partials/header.html",
  footer : "resources/partials/footer.html",
};


// ─── Public Routes ───────────────────────────────────────────────────────────
// Key = URL hash (#home, #about...)
// Value = path to the view's HTML file
export const routes = {
  home    : "resources/views/public/home.html",
  about   : "resources/views/public/about.html",
  // services: "resources/views/public/services.html",
  // pricing : "resources/views/public/pricing.html",
  // contact : "resources/views/public/contact.html",
  docs    : "resources/views/public/docs.html",
  routing : "resources/views/public/routing.html",
  components : "resources/views/public/components.html",
  customers : "resources/views/public/customers.html",
  sponsors  : "resources/views/public/sponsors.html",
  store   : "resources/views/public/store.html",
  plugins : "resources/views/public/plugins.html",
};


// ─── Authentication Routes (optional) ───────────────────────────────────────
// Same structure as routes, but for login/register pages.
// To protect them use app.guard() in flutcom/main.js
export const authRoutes = {
  // login   : "resources/views/auth/login.html",
  // register: "resources/views/auth/register.html",
};


// ─── JS Resources & Plugins ───────────────────────────────────────────────────
// CSS files (Tailwind, own styles) now go directly in index.html
// to avoid SEO issues and improve rendering performance.
export const resources = [
  // — Framework Plugins (enable/disable as needed) —
  { type: "js", file: "plugins/menu.js" },
  { type: "js", file: "plugins/modals.js" },
  { type: "js", file: "plugins/copy-clipboard.js" },
  { type: "js", file: "plugins/customer-tracker.js" },
  { type: "js", file: "plugins/liquid-glass.js" },
  { type: "js", file: "plugins/version-history.js" }, // <-- History tracking plugin
  // { type: "js",  file: "plugins/responsive.js" },  // is-mobile / is-tablet / is-desktop classes
  // { type: "js",  file: "plugins/watermark.js" },   // Flutcom badge in bottom corner
];
