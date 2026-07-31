/**
 * plugins/watermark.js — Plugin de marca de agua Flutcom
 *
 * Muestra un badge flotante (esquina inferior derecha) con el logo
 * y nombre del framework. Detecta automáticamente el color de fondo
 * bajo el badge y ajusta su contraste (tema claro / oscuro).
 *
 * Configuración:
 *   LOGO_LIGHT → logo para fondos oscuros
 *   LOGO_DARK  → logo para fondos claros
 *
 * Activar en routes.js:
 *   { type: "js", file: "plugins/watermark.js" }
 *
 * Para desactivar: simplemente no lo incluyas en externalResources.
 */

(function () {
  const LOGO_LIGHT      = 'assets/img/icon1.png';
  const LOGO_DARK       = 'assets/img/icon.png';
  const DEBOUNCE_MS     = 80;
  const SAMPLE_MARGIN   = 30;

  // ─── Crear badge ─────────────────────────────────────────────────────────

  const badge = document.createElement('div');
  Object.assign(badge.style, {
    position       : 'fixed',
    bottom         : '15px',
    right          : '15px',
    zIndex         : '999999',
    display        : 'flex',
    alignItems     : 'center',
    gap            : '10px',
    padding        : '6px 14px',
    borderRadius   : '30px',
    userSelect     : 'none',
    pointerEvents  : 'none',
    cursor         : 'default',
    transition     : 'all 0.25s ease',
    backdropFilter : 'blur(10px) saturate(200%)',
    boxShadow      : '0 8px 20px rgba(0,0,0,0.18)',
  });

  const logo = document.createElement('img');
  logo.src   = LOGO_DARK;
  logo.alt   = 'Flutcom';
  Object.assign(logo.style, { width: '32px', height: '32px', objectFit: 'contain', transition: 'opacity 0.2s ease' });

  const label = document.createElement('span');
  label.textContent = 'Flutcom';
  Object.assign(label.style, { fontSize: '17px', fontWeight: '600', letterSpacing: '0.5px', transition: 'color 0.2s ease' });

  badge.append(logo, label);
  document.body.appendChild(badge);

  // Animación de entrada
  badge.animate(
    [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
    { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
  );

  // ─── Contraste adaptativo ─────────────────────────────────────────────────

  function luminance(rgb) {
    const m = rgb && rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return 1;
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
  }

  function bgUnder(x, y) {
    badge.style.display = 'none';
    let el = document.elementFromPoint(x, y);
    badge.style.display = 'flex';
    while (el && el !== document.documentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      el = el.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
  }

  function updateTheme() {
    const x   = window.innerWidth  - SAMPLE_MARGIN;
    const y   = window.innerHeight - SAMPLE_MARGIN;
    const bg  = bgUnder(x, y);
    const lum = luminance(bg);

    if (lum > 0.55) {
      // Fondo claro → badge oscuro
      Object.assign(badge.style, { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,0,0,0.06)' });
      label.style.color = 'rgba(0,0,0,0.58)';
      logo.src = LOGO_DARK;
    } else {
      // Fondo oscuro → badge claro
      Object.assign(badge.style, { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' });
      label.style.color = 'rgba(255,255,255,0.92)';
      logo.src = LOGO_LIGHT;
    }
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  const debouncedUpdate = debounce(updateTheme, DEBOUNCE_MS);
  window.addEventListener('load',        debouncedUpdate);
  window.addEventListener('resize',      debouncedUpdate);
  window.addEventListener('scroll',      debouncedUpdate, { passive: true });
  window.addEventListener('hashchange',  debouncedUpdate);

  // Evitar que el badge desaparezca si algo limpia el body
  new MutationObserver(() => {
    if (!document.body.contains(badge)) document.body.appendChild(badge);
  }).observe(document.body, { childList: true });

  updateTheme();
})();
