/**
 * Customer Tracker Plugin
 * Demuestra el poder de los plugins globales en Flutcom.
 */
window.CustomerTracker = {
  history: [],
  
  init: function() {
    console.log("[CustomerTracker] Plugin initialized.");
    
    // Escuchar cambios de ruta globales
    window.addEventListener('hashchange', () => {
      const currentView = window.location.hash || '#home';
      this.trackPageView(currentView);
    });

    // Registrar la vista inicial si no venimos de un hashchange
    setTimeout(() => {
      if (this.history.length === 0) {
        this.trackPageView(window.location.hash || '#home');
      }
    }, 100);
  },

  trackPageView: function(viewName) {
    const timestamp = new Date().toLocaleTimeString();
    this.history.push({ view: viewName, time: timestamp });
    console.log(`[Analytics] Customer visited: ${viewName} at ${timestamp}`);
    
    // Si la vista de customers está abierta, actualizamos el DOM en tiempo real
    const historyContainer = document.getElementById('customer-history-list');
    if (historyContainer) {
      this.renderHistory(historyContainer);
    }
  },

  renderHistory: function(container) {
    if (!container) return;
    
    if (this.history.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800 mb-4 animate-pulse">
            <i class="bi bi-inbox text-zinc-600 text-2xl"></i>
          </div>
          <p class="text-zinc-400 font-medium mb-1">No session activity recorded yet</p>
          <p class="text-zinc-600 text-xs max-w-xs">Start browsing other views using the navigation links to generate logs.</p>
        </div>
      `;
      return;
    }

    const getIconClass = (view) => {
      const clean = view.replace('#', '');
      switch (clean) {
        case 'home': return 'bi-house-fill text-white bg-zinc-800/60 border-zinc-700';
        case 'about': return 'bi-info-circle-fill text-white bg-zinc-800/60 border-zinc-700';
        case 'customers': return 'bi-activity text-white bg-zinc-800/60 border-zinc-700';
        case 'components': return 'bi-box-seam-fill text-white bg-zinc-800/60 border-zinc-700';
        case 'docs': return 'bi-file-earmark-text-fill text-white bg-zinc-800/60 border-zinc-700';
        case 'plugins': return 'bi-plugin text-white bg-zinc-800/60 border-zinc-700';
        case 'store': return 'bi-database-fill text-white bg-zinc-800/60 border-zinc-700';
        default: return 'bi-cursor-fill text-zinc-400 bg-zinc-900 border-zinc-800';
      }
    };

    container.innerHTML = this.history.map((entry, idx) => {
      const isLast = idx === 0; // Since we reverse, the first element in map (which is the last element in history) has idx === 0
      const iconDetails = getIconClass(entry.view);
      
      return `
        <div class="relative group flex items-start gap-4 p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-300">
          <!-- Timeline line decoration -->
          ${!isLast ? `<div class="absolute left-9 top-14 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent"></div>` : ''}
          
          <!-- View Icon -->
          <div class="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border ${iconDetails} shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300">
            <i class="bi ${iconDetails.split(' ')[0]} text-sm"></i>
          </div>
          
          <!-- View Details -->
          <div class="flex-1 min-w-0 font-sans">
            <div class="flex items-center justify-between gap-4 mb-1">
              <span class="text-zinc-200 text-sm font-semibold font-mono tracking-tight truncate">${entry.view}</span>
              <span class="text-zinc-400 text-xs font-mono bg-zinc-950/40 px-2.5 py-1 rounded-md border border-white/5 shadow-inner flex items-center gap-1.5 shrink-0">
                <i class="bi bi-clock text-[10px]"></i> ${entry.time}
              </span>
            </div>
            
            <div class="flex items-center gap-2 mt-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/5 font-sans">
                GET
              </span>
              <span class="text-zinc-500 text-[11px] font-mono truncate">
                http://127.0.0.1:3000/${entry.view}
              </span>
            </div>
          </div>
        </div>
      `;
    }).reverse().join('');

    // Trigger page-specific update callback if it exists
    if (typeof window.updateDashboardMetrics === 'function') {
      window.updateDashboardMetrics();
    }
  }
};

// Auto-inicializar cuando el script carga
window.CustomerTracker.init();
