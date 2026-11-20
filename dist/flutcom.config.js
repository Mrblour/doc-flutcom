// @ts-check
/**
 * Flutcom Application Configuration
 *
 * Central configuration file for routes, metadata, shell partials, and plugins.
 * Defines the core behavior and structure of the single-page application.
 */

/**
 * Site metadata and global routing defaults.
 *
 * @type {import('./types/flutcom').SiteConfig}
 */
export const site = {
  nombre      : "Flutcom",
  autor       : "yBlour",
  version     : "1.4.1",
  descripcion : "Ultra-fast, zero-dependency micro SPA framework",
  url         : "https://mrblour.github.io/Flutcom/",
  lang        : "es",

  /** Default view loaded on root navigation (e.g., #home) */
  defaultView : "home",

  /** Fallback 404 error view path when a route does not exist */
  notFoundView: "resources/views/public/404.html",
};


/**
 * Persistent shell partials (layout structure).
 * Injected into matching container IDs (e.g. #navbar, #footer) in index.html.
 *
 * @type {import('./types/flutcom').PartialsConfig}
 */
export const partials = {
  navbar : "resources/partials/header.html",
  footer : "resources/partials/footer.html",
};


/**
 * Public routes configuration.
 *
 * Supports two formats:
 * - Rich format (recommended): Object with `view`, `title`, `description`, `keywords`, `robots`, and `jsonLd`.
 * - Simple format: "hash": "path/to/view.html"
 *
 * @type {Record<string, import('./types/flutcom').RouteDefinition>}
 */
export const routes = {
  home: {
    view        : "resources/views/public/home.html",
    title       : "Home — Micro-framework SPA Ultra Rápido (< 5 KB)",
    description : "Flutcom es el micro-framework SPA en Vanilla JavaScript diseñado para la web moderna: < 5 KB de núcleo, cero dependencias en runtime, Direct DOM y enrutamiento Hash Flow.",
    keywords    : ["flutcom", "spa framework", "vanilla js spa", "micro framework", "zero dependency javascript", "static site spa", "direct dom", "hash router"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Flutcom",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web Browser",
      "softwareVersion": "1.4.1",
      "description": "Ultra-fast, zero-dependency micro SPA framework for static single-page applications.",
      "url": "https://mrblour.github.io/Flutcom/"
    }
  },
  ejemplos: {
    view        : "resources/views/public/ejemplos.html",
    title       : "Examples & Interactive Components — Flutcom Gallery",
    description : "Explora ejemplos interactivos de componentes modulares, reactividad bidireccional (fc-model/fc-bind) y directivas reactivas en Flutcom.",
    keywords    : ["flutcom examples", "interactive components", "reactive directives", "vanilla js components", "fc-model examples"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Flutcom Component Examples",
      "description": "Interactive gallery and live playground for Flutcom micro-SPA components."
    }
  },
  about: {
    view        : "resources/views/public/about.html",
    title       : "About — Flutcom Technical Architecture",
    description : "Engineered for pure speed: Native Vanilla JS, Direct DOM, Hash Flow routing, and < 5 KB runtime footprint.",
    keywords    : ["flutcom architecture", "zero dependency spa", "direct dom", "vanilla js spa", "flutcom about"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": "Flutcom Architecture & Technical Specifications",
      "description": "Comprehensive technical report on Flutcom's zero-dependency micro SPA architecture."
    }
  },
  customers: {
    view        : "resources/views/public/customers.html",
    title       : "Customers & Analytics — Flutcom Live Telemetry",
    description : "Real-time client-side session telemetry driven by Flutcom. Zero external tracking cookies, 100% RAM storage.",
    keywords    : ["flutcom telemetry", "customer tracker", "session analytics", "client side routing tracker"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Flutcom Session Telemetry",
      "applicationCategory": "DeveloperApplication",
      "description": "Live client-side session analytics demonstration for Flutcom micro-SPA."
    }
  },
  components: {
    view        : "resources/views/public/components.html",
    title       : "Components — Flutcom Modular UI Library",
    description : "Modern declarative custom tag components: flut-alert, flut-badge, flut-button, flut-feature-card, and flut-comparison-table.",
    keywords    : ["flutcom components", "custom tags", "declarative ui", "web components", "vanilla components"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": "Flutcom Component Architecture & Standard UI Library",
      "description": "Interactive documentation and benchmark for Flutcom's v1.4.1 component engine."
    }
  },
  docs: {
    view        : "resources/views/public/docs.html",
    title       : "Documentation — Flutcom v1.4.1",
    description : "The complete technical guide to building zero-dependency, ultra-fast static SPAs with Flutcom.",
    keywords    : ["flutcom docs", "spa documentation", "vanilla js framework guide", "flutcom setup"],
    robots      : "index, follow",
    jsonLd      : {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": "Flutcom Complete Technical Documentation",
      "description": "Comprehensive guide to Flutcom's architecture, routing, reactive directives, and deployment."
    }
  },
};


/**
 * Protected and authentication routes (optional).
 * Access rules can be enforced with app.guard() in flutcom/main.js.
 *
 * @type {Record<string, import('./types/flutcom').RouteDefinition>}
 */
export const authRoutes = {
  // login    : "resources/views/auth/login.html",
  // register : "resources/views/auth/register.html",
};


/**
 * Native Flutcom plugins (closed-environment, auto-loaded).
 *
 * @type {string[]}
 */
export const plugins = [
  "timer",
  "menu",
  "animations",
  "responsive",
  "motion",
];


/**
 * Global modular plugins and scripts.
 *
 * @type {import('./types/flutcom').ResourceItem[]}
 */
export const resources = [
  // Standalone framework plugins / open-source scripts
  { type: "js", file: "plugins/modals.js" },
  // { type: "js", file: "plugins/responsive.js" },
];


