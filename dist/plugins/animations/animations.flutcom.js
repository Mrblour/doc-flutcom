/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Plugin Nativo Flutcom: Animations (v1.4.1)              ║
 * ║  Sistema de animaciones reveal e Intersection Observer   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const animationStyles = `
  /* ── Reveal base: invisible + acercamiento inicial suave ── */
  .reveal {
    opacity: 0;
    transform: translateY(32px) scale(0.94);
    transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
                transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
                filter 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  /* Variantes direccionales con zoom-in / acercamiento (smooth scale-up + lift) */
  .reveal-up    { transform: translateY(36px) scale(0.93); }
  .reveal-down  { transform: translateY(-36px) scale(0.93); }
  .reveal-left  { transform: translateY(20px) translateX(30px) scale(0.93); }
  .reveal-right { transform: translateY(20px) translateX(-30px) scale(0.93); }
  .reveal-scale { transform: scale(0.88); }
  .reveal-blur  { filter: blur(14px); opacity: 0; transform: translateY(28px) scale(0.94); }

  /* Estado final: 100% visible, posición natural y nitidez perfecta */
  .reveal.active {
    opacity: 1;
    transform: translate(0, 0) scale(1);
    filter: blur(0);
  }

  /* Grupos con stagger: cada hijo entra escalonado con acercamiento suave */
  .reveal-group > * {
    opacity: 0;
    transform: translateY(28px) scale(0.94);
    transition: opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1),
                transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .reveal-group.active > * {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

function injectStyles() {
  if (document.getElementById('fc-animation-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'fc-animation-styles';
  styleEl.textContent = animationStyles;
  document.head.appendChild(styleEl);
}

const AnimationsPlugin = {
  name: 'animations',
  version: '1.4.1',
  author: 'Comunidad Flutcom',

  _options: {},
  _app: null,
  /** @type {IntersectionObserver|null} */
  _observer: null,

  init(app, config) {
    this._app = app;
    this._options = config?.options || {};
    injectStyles();
    this.scanAndObserve();
    console.info('[Flutcom Plugin: Animations] Inicializado v1.4.1');
  },

  scanAndObserve() {
    const threshold = this._options.threshold || 0.05;
    const rootMargin = this._options.rootMargin || '0px 0px -40px 0px';

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-group').forEach(el => {
        el.classList.add('active');
      });
      return;
    }

    // Desconectar observer previo si existía para evitar duplicados
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.classList.contains('active')) {
            this._observer?.unobserve(el);
            return;
          }

          const delay = parseInt(el.getAttribute('data-delay') || '0', 10);

          const triggerActive = () => {
            if (el.classList.contains('reveal-group')) {
              const children = el.children;
              for (let i = 0; i < children.length; i++) {
                /** @type {HTMLElement} */ (children[i]).style.transitionDelay = `${i * 100}ms`;
              }
            }
            el.classList.add('active');
          };

          if (delay > 0) {
            setTimeout(triggerActive, delay);
          } else {
            triggerActive();
          }

          // v1.4.1: Des-observar elemento animado para liberar memoria
          this._observer?.unobserve(el);
        }
      });
    }, { threshold, rootMargin });

    // Observar elementos reveal en la página
    document.querySelectorAll('.reveal, .reveal-group').forEach(el => {
      if (el.classList.contains('active')) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top >= 0 && rect.top <= vh * 0.95) {
        // Elemento ya visible al cargar: necesitamos que el browser pinte el estado
        // inicial oculto (opacity:0, transform) ANTES de hacer la transición.
        // Double requestAnimationFrame garantiza esto.
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (el.classList.contains('reveal-group')) {
              const children = el.children;
              for (let i = 0; i < children.length; i++) {
                /** @type {HTMLElement} */ (children[i]).style.transitionDelay = `${i * 100}ms`;
              }
            }
            if (delay > 0) {
              setTimeout(() => el.classList.add('active'), delay);
            } else {
              el.classList.add('active');
            }
          });
        });
      } else {
        this._observer?.observe(el);
      }
    });
  },

  onNavigate(viewName, container) {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    // Esperamos a que el DOM del SPA termine de montar antes de escanear.
    // 120ms es suficiente para la mayoría de vistas; el double rAF dentro de
    // scanAndObserve garantiza que el estado oculto se pinte antes de la transición.
    setTimeout(() => {
      this.scanAndObserve();
    }, 120);
  },

  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
};

// Interfaz global para refrescar tras navegación SPA o invocar manualmente
window.FlutcomAnimations = {
  init: () => {
    injectStyles();
    AnimationsPlugin.scanAndObserve();
  },
  refresh: () => {
    AnimationsPlugin.scanAndObserve();
  }
};

export default AnimationsPlugin;

