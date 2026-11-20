/**
 * anima.js — Módulo de animaciones Vercel & Anime.js para Flutcom (v1.4.1)
 */
import AnimationsPlugin from './animations/animations.flutcom.js';

// Conexión con el motor oficial Anime.js
const animeLib = /** @type {any} */ (window).anime;

export const Anima = {
  /** Motor oficial de Anime.js */
  engine: animeLib,

  /**
   * Disparar animación fluida con Anime.js
   * Soporta tanto anime(target, params) como anime(params) y anime.animate(target, params)
   */
  animate(targetsOrParams, maybeParams) {
    if (!animeLib) return null;
    if (maybeParams !== undefined) {
      if (typeof animeLib.animate === 'function') {
        return animeLib.animate(targetsOrParams, maybeParams);
      } else if (typeof animeLib === 'function') {
        return animeLib({ targets: targetsOrParams, ...maybeParams });
      }
    } else {
      if (typeof animeLib === 'function') {
        return animeLib(targetsOrParams);
      } else if (typeof animeLib.animate === 'function' && targetsOrParams?.targets) {
        const { targets, ...rest } = targetsOrParams;
        return animeLib.animate(targets, rest);
      }
    }
  },

  /** Refrescar observadores de reveal tras navegación */
  refresh() {
    AnimationsPlugin.scanAndObserve();
  },

  /** Aplicar clases de reveal Vercel */
  reveal(selector, options = {}) {
    const els = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];
    els.forEach(el => {
      if (el && el instanceof HTMLElement) {
        el.classList.add('reveal', options.direction ? `reveal-${options.direction}` : 'reveal-up');
        if (options.blur) el.classList.add('reveal-blur');
        if (options.delay) el.setAttribute('data-delay', String(options.delay));
      }
    });
    AnimationsPlugin.scanAndObserve();
  }
};

/** @type {any} */ (window).Anima = Anima;
if (animeLib?.animate && !/** @type {any} */ (window).animate) {
  /** @type {any} */ (window).animate = animeLib.animate;
}

export default AnimationsPlugin;
