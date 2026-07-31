/**
 * premium-effects.js — Plugin Flutcom
 * Implementa efectos de interacción de alto nivel como el spotlight de mouse.
 */

(function () {
    function initPremiumEffects() {
        // Efecto de Spotlight
        const cards = document.querySelectorAll('.bento-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

        // Ciclo de palabras en el hero
        const heroCycle = document.getElementById('hero-cycle-container');
        if (heroCycle && !heroCycle.dataset.init) {
            heroCycle.dataset.init = 'true';
            const words = ['vanilla SPAs', 'speed masters', 'modern devs'];
            let index = 0;

            setInterval(() => {
                // Fase salida
                heroCycle.classList.add('leaving');
                setTimeout(() => {
                    index = (index + 1) % words.length;
                    heroCycle.textContent = words[index];
                    heroCycle.classList.remove('leaving');
                    // Reiniciar animación de entrada
                    heroCycle.style.animation = 'none';
                    heroCycle.offsetHeight; // force reflow
                    heroCycle.style.animation = '';
                }, 400);
            }, 3000);
        }
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
