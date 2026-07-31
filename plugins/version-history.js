/**
 * Version History Plugin
 * Saves the history of versions the user has seen and displays it on hover over the version badge.
 */
window.VersionHistory = {
  history: [],
  tooltipEl: null,

  init: function() {
    console.log("[VersionHistory] Plugin initialized.");
    
    // Create tooltip container
    this.createTooltip();

    // Wait a bit for the framework to inject the header
    setTimeout(() => {
      this.recordCurrentVersion();
      this.attachHoverEvent();
    }, 500);

    // Re-attach if navigation recreates the header
    document.addEventListener('fc-view-loaded', () => {
      this.attachHoverEvent();
    });
  },

  recordCurrentVersion: function() {
    // Get version from config
    const currentVersion = window.flutcomApp?._cfg?.version || "Unknown";
    
    // Load history
    const saved = localStorage.getItem('flutcom_version_history');
    if (saved) {
      try {
        this.history = JSON.parse(saved);
      } catch (e) {
        this.history = [];
      }
    }

    // Check if we need to add current version
    const lastEntry = this.history[this.history.length - 1];
    if (!lastEntry || lastEntry.version !== currentVersion) {
      this.history.push({
        version: currentVersion,
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('flutcom_version_history', JSON.stringify(this.history));
    }
  },

  createTooltip: function() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'version-history-tooltip';
    this.tooltipEl.style.cssText = `
      position: absolute;
      background: #18181b; /* zinc-900 */
      border: 1px solid #27272a; /* zinc-800 */
      border-radius: 0.75rem;
      padding: 1rem;
      width: 220px;
      z-index: 9999;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      color: #d4d4d8; /* zinc-300 */
      font-family: inherit;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
      transition: all 0.2s ease;
    `;
    document.body.appendChild(this.tooltipEl);
  },

  renderHistory: function() {
    if (this.history.length === 0) return `<div style="font-size: 0.875rem; color: #71717a;">No history yet.</div>`;
    
    let html = `<div style="font-size: 0.75rem; font-weight: bold; color: #fff; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Version History</div>`;
    html += `<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">`;
    
    // Show newest first
    const reversed = [...this.history].reverse();
    
    reversed.forEach((entry, idx) => {
      const isCurrent = idx === 0;
      const dotColor = isCurrent ? '#10b981' : '#52525b'; // emerald-500 or zinc-600
      
      html += `
        <li style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${dotColor};"></span>
            <span style="font-family: monospace; font-weight: ${isCurrent ? 'bold' : 'normal'}; color: ${isCurrent ? '#fff' : '#a1a1aa'};">v${entry.version}</span>
          </div>
          <span style="font-size: 0.7rem; color: #71717a;">${entry.date}</span>
        </li>
      `;
    });
    
    html += `</ul>`;
    return html;
  },

  attachHoverEvent: function() {
    // We use event delegation since the header is loaded dynamically
    document.addEventListener('mouseover', (e) => {
      const badge = e.target.closest('.fc-version-badge');
      if (!badge) return;
      
      // Update history and content just before showing
      this.recordCurrentVersion();
      this.tooltipEl.innerHTML = this.renderHistory();
      
      const rect = badge.getBoundingClientRect();
      this.tooltipEl.style.top = `${rect.bottom + 10}px`;
      this.tooltipEl.style.left = `${rect.left - (220 - rect.width) / 2}px`; // Center align
      
      this.tooltipEl.style.opacity = '1';
      this.tooltipEl.style.transform = 'translateY(0)';
      
      // Add a one-time mouseleave listener to the badge to hide the tooltip
      badge.addEventListener('mouseleave', () => {
        this.tooltipEl.style.opacity = '0';
        this.tooltipEl.style.transform = 'translateY(10px)';
      }, { once: true });
    });
  }
};

// Start plugin
window.VersionHistory.init();
