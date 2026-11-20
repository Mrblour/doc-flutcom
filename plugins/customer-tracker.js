/**
 * Flutcom Customer & Session Telemetry Tracker Plugin
 *
 * Captures client-side routing transitions in volatile RAM.
 * Zero external tracking cookies, zero third-party dependencies, 100% private.
 */
// @ts-check

(function () {
  'use strict';

  /**
   * @typedef {Object} HistoryEntry
   * @property {string} view
   * @property {string} time
   * @property {number} id
   */

  /** @type {{ history: HistoryEntry[], init: () => void, trackPageView: (viewName: string) => void, clearHistory: () => void, renderHistory: (container: HTMLElement | null) => void }} */
  const CustomerTracker = {
    history: [],

    init: function () {
      // Escuchar cambios de ruta por hash
      window.addEventListener('hashchange', () => {
        const currentView = window.location.hash || '#home';
        this.trackPageView(currentView);
      });

      // Registrar vista inicial al cargar
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            if (this.history.length === 0) {
              this.trackPageView(window.location.hash || '#home');
            }
          }, 80);
        });
      } else {
        setTimeout(() => {
          if (this.history.length === 0) {
            this.trackPageView(window.location.hash || '#home');
          }
        }, 80);
      }
    },

    trackPageView: function (viewName) {
      const timestamp = new Date().toLocaleTimeString();
      this.history.push({
        view: viewName,
        time: timestamp,
        id: Date.now() + Math.floor(Math.random() * 1000)
      });

      // Actualizar contenedor si la vista está actualmente montada en el DOM
      const historyContainer = document.getElementById('customer-history-list');
      if (historyContainer) {
        this.renderHistory(historyContainer);
      } else {
        const updateMetrics = /** @type {any} */ (window).updateDashboardMetrics;
        if (typeof updateMetrics === 'function') {
          updateMetrics();
        }
      }
    },

    clearHistory: function () {
      this.history = [];
      const historyContainer = document.getElementById('customer-history-list');
      if (historyContainer) {
        this.renderHistory(historyContainer);
      }
      const updateMetrics = /** @type {any} */ (window).updateDashboardMetrics;
      if (typeof updateMetrics === 'function') {
        updateMetrics();
      }
    },

    renderHistory: function (container) {
      if (!container) return;

      if (this.history.length === 0) {
        container.innerHTML = `
          <div class="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div class="w-14 h-14 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
              <i class="bi bi-inbox text-2xl" aria-hidden="true"></i>
            </div>
            <p class="text-white text-sm font-semibold mb-1">No session telemetry recorded</p>
            <p class="text-zinc-500 text-xs max-w-sm leading-relaxed">
              Navigate between views using the top navbar or demo buttons below to generate real-time routing telemetry in RAM.
            </p>
          </div>
        `;
        const updateMetrics = /** @type {any} */ (window).updateDashboardMetrics;
        if (typeof updateMetrics === 'function') {
          updateMetrics();
        }
        return;
      }

      const getIconClass = (view) => {
        const clean = view.replace('#', '').toLowerCase();
        switch (clean) {
          case 'home':
            return 'bi-house-fill';
          case 'about':
            return 'bi-cpu-fill';
          case 'customers':
            return 'bi-activity';
          case 'components':
            return 'bi-puzzle-fill';
          case 'ejemplos':
            return 'bi-grid-fill';
          case 'docs':
            return 'bi-file-earmark-text-fill';
          default:
            return 'bi-signpost-2-fill';
        }
      };

      // Mapear historial en orden cronológico inverso (el más reciente primero)
      const reversed = [...this.history].reverse();

      container.innerHTML = reversed
        .map((entry, idx) => {
          const isLatest = idx === 0;
          const icon = getIconClass(entry.view);

          return `
            <div class="relative group flex items-start gap-3.5 p-4 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors font-mono">
              <!-- Terminal Operation Badge -->
              <div class="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-950 border ${
                isLatest ? 'border-white/40 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-white/10 text-zinc-500'
              } shrink-0 transition-transform group-hover:scale-105">
                <i class="bi ${icon} text-xs" aria-hidden="true"></i>
              </div>

              <!-- Terminal Log Stream Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3 mb-1">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-zinc-500 text-xs font-mono font-bold">›</span>
                    <span class="text-white font-mono text-xs sm:text-sm font-semibold tracking-tight truncate">${entry.view}</span>
                    ${
                      isLatest
                        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-white/10 text-white border border-white/25"><span class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#fff]"></span>ACTIVE</span>`
                        : ''
                    }
                  </div>
                  <span class="text-zinc-500 text-[11px] font-mono bg-[#09090b] px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 shrink-0">
                    <span>${entry.time}</span>
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 font-mono">
                  <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/5 text-zinc-300 border border-white/10">
                    DISPATCH
                  </span>
                  <span class="text-zinc-400 truncate">/#${entry.view.replace('#', '')}</span>
                  <span class="text-zinc-700">|</span>
                  <span class="text-zinc-400">STACK: VOLATILE_RAM</span>
                  <span class="text-zinc-700">|</span>
                  <span class="text-white font-semibold">200_OK</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      const updateMetrics = /** @type {any} */ (window).updateDashboardMetrics;
      if (typeof updateMetrics === 'function') {
        updateMetrics();
      }
    }
  };

  // Exponer globalmente
  // @ts-ignore
  window.CustomerTracker = CustomerTracker;

  // Auto-inicializar
  CustomerTracker.init();
})();
