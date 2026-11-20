/**
 * premium-effects.js — Plugin Flutcom
 * Implementa efectos de interacción de alto nivel como el spotlight de mouse.
 */

(function () {
    function initPremiumEffects() {
        // Efecto de Spotlight estilo Vercel
        const cards = document.querySelectorAll('.bento-card, .vercel-card, [data-spotlight], #comparison-table');
        cards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    // Auto-iniciar
    document.addEventListener('DOMContentLoaded', initPremiumEffects);
    
    // Integración con navegación SPA
    document.addEventListener('fc-view-loaded', () => {
        setTimeout(initPremiumEffects, 100);
    });

    // Exponer si es necesario
    window.PremiumEffects = {
        refresh: initPremiumEffects
    };
})();
