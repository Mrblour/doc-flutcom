/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Plugin Nativo Flutcom: Motion Graphics (FlutMotion)      ║
 * ║  Motor de animaciones cinéticas, keyframes y 3D motion    ║
 * ║  100% Nativo • Web Animations API & CSS GPU • 0 kB Libs  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const MOTION_STYLES = `
  /* Viewport para texto cinético con rodillo (Kinetic Text Roller) */
  .flut-motion-roller {
    display: inline-flex;
    position: relative;
    vertical-align: bottom;
    overflow: hidden;
    height: 1.15em;
    line-height: 1.15em;
    transition: width 0.42s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: width;
    white-space: nowrap;
  }

  .flut-motion-word {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    width: auto;
    white-space: nowrap;
    will-change: transform, opacity, filter;
    backface-visibility: hidden;
    transform-origin: 50% 50%;
  }

  /* Animación Float Nativa */
  @keyframes flutMotionFloat {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-12px) rotate(0.8deg);
    }
  }

  /* Animación Sway Nativa (Pendular) */
  @keyframes flutMotionSway {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-12px);
    }
    75% {
      transform: translateX(12px);
    }
  }

  /* Pulso Glow */
  @keyframes flutMotionGlow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
    }
    50% {
      box-shadow: 0 0 35px rgba(99, 102, 241, 0.6);
    }
  }
`;

function injectMotionStyles() {
  if (document.getElementById('flut-motion-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'flut-motion-styles';
  styleEl.textContent = MOTION_STYLES;
  document.head.appendChild(styleEl);
}

// Registro global de instancias activas para limpieza SPA
const activeIntervals = new Set();
const activeListeners = [];

/**
 * Monta un Kinetic Text Roller de alto rendimiento en un elemento.
 * Elimina cualquier layout shift del texto adyacente o inferior.
 */
function mountTextRoller(containerEl, options = {}) {
  if (!containerEl || containerEl.dataset.motionMounted === 'true') return;
  containerEl.dataset.motionMounted = 'true';

  let rawWords = containerEl.getAttribute('data-motion-words');
  let words = [];

  if (rawWords) {
    try {
      words = JSON.parse(rawWords);
    } catch {
      words = rawWords.split(',').map(s => s.trim());
    }
  }

  if (!words || !words.length) {
    const initialText = containerEl.textContent?.trim() || 'vanilla SPAs';
    words = [initialText, 'speed masters', 'modern devs', 'lightning fast'];
  }

  const intervalTime = parseInt(containerEl.getAttribute('data-motion-interval') || options.interval || '3200', 10);
  const extraClasses = containerEl.getAttribute('data-motion-class') || '';

  // Crear estructura de dos slots para transición continua sin jumps
  containerEl.innerHTML = '';
  containerEl.classList.add('flut-motion-roller');

  const slotA = document.createElement('span');
  slotA.className = `flut-motion-word ${extraClasses}`;
  slotA.textContent = words[0];

  const slotB = document.createElement('span');
  slotB.className = `flut-motion-word ${extraClasses}`;
  slotB.style.transform = 'translateY(110%)';
  slotB.style.opacity = '0';
  slotB.style.filter = 'blur(6px)';

  containerEl.appendChild(slotA);
  containerEl.appendChild(slotB);

  // Ajustar ancho inicial del viewport
  const adjustWidth = (slot) => {
    const w = slot.offsetWidth;
    if (w > 0) {
      containerEl.style.width = `${w}px`;
    }
  };

  requestAnimationFrame(() => adjustWidth(slotA));

  let currentIndex = 0;
  let activeSlot = slotA;
  let nextSlot = slotB;

  const springEase = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const duration = 650; // ms de transición cinemática

  const timer = setInterval(() => {
    // Si el contenedor fue removido del DOM, cancelar timer
    if (!document.contains(containerEl)) {
      clearInterval(timer);
      activeIntervals.delete(timer);
      return;
    }

    currentIndex = (currentIndex + 1) % words.length;
    const nextWord = words[currentIndex];

    // Preparar el slot entrante fuera de vista (abajo con blur)
    nextSlot.textContent = nextWord;
    nextSlot.style.transform = 'translateY(110%)';
    nextSlot.style.opacity = '0';
    nextSlot.style.filter = 'blur(6px)';

    // Medir ancho del nuevo texto y suavizar el ancho del contenedor sin mover el layout circundante
    adjustWidth(nextSlot);

    // Animación de salida del slot actual (sube con blur hacia arriba)
    activeSlot.animate([
      { transform: 'translateY(0%)', opacity: '1', filter: 'blur(0px)' },
      { transform: 'translateY(-110%)', opacity: '0', filter: 'blur(6px)' }
    ], {
      duration,
      easing: springEase,
      fill: 'forwards'
    });

    // Animación de entrada del nuevo slot (entra desde abajo con elasticidad)
    const animIn = nextSlot.animate([
      { transform: 'translateY(110%)', opacity: '0', filter: 'blur(6px)' },
      { transform: 'translateY(0%)', opacity: '1', filter: 'blur(0px)' }
    ], {
      duration,
      easing: springEase,
      fill: 'forwards'
    });

    animIn.onfinish = () => {
      // Intercambiar roles
      const temp = activeSlot;
      activeSlot = nextSlot;
      nextSlot = temp;
    };
  }, intervalTime);

  activeIntervals.add(timer);
}

/**
 * Monta efecto 3D Tilt suave en elementos con [data-motion="tilt"]
 */
function mountTilt(el) {
  if (!el || el.dataset.motionTiltInit) return;
  el.dataset.motionTiltInit = 'true';

  const maxAngle = parseFloat(el.getAttribute('data-motion-max') || '12');

  const onMouseMove = (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxAngle;
    const rotateY = ((x - centerX) / centerX) * maxAngle;

    el.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    el.style.transition = 'transform 0.08s ease-out';
  };

  const onMouseLeave = () => {
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  };

  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseleave', onMouseLeave);

  activeListeners.push({ el, type: 'mousemove', fn: onMouseMove });
  activeListeners.push({ el, type: 'mouseleave', fn: onMouseLeave });
}

/**
 * Monta efecto magnético suave en botones/elementos con [data-motion="magnetic"]
 */
function mountMagnetic(el) {
  if (!el || el.dataset.motionMagInit) return;
  el.dataset.motionMagInit = 'true';

  const strength = parseFloat(el.getAttribute('data-motion-strength') || '0.35');

  const onMouseMove = (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    el.style.transition = 'transform 0.1s ease-out';
  };

  const onMouseLeave = () => {
    el.style.transform = 'translate3d(0, 0, 0)';
    el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  };

  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseleave', onMouseLeave);

  activeListeners.push({ el, type: 'mousemove', fn: onMouseMove });
  activeListeners.push({ el, type: 'mouseleave', fn: onMouseLeave });
}

/**
 * Escanea y monta todas las directivas declarativas data-motion
 */
function scanMotionElements() {
  injectMotionStyles();

  // 1. Text Cycler / Kinetic Roller
  document.querySelectorAll('[data-motion="text-cycler"], [data-motion="words-roller"], #hero-cycle-container').forEach(el => {
    mountTextRoller(el);
  });

  // 2. 3D Tilt
  document.querySelectorAll('[data-motion="tilt"]').forEach(el => {
    mountTilt(el);
  });

  // 3. Magnetic Buttons / Icons
  document.querySelectorAll('[data-motion="magnetic"]').forEach(el => {
    mountMagnetic(el);
  });

  // 4. Float directo por CSS GPU
  document.querySelectorAll('[data-motion="float"]').forEach(el => {
    const duration = el.getAttribute('data-motion-duration') || '5s';
    el.style.animation = `flutMotionFloat ${duration} ease-in-out infinite`;
    el.style.willChange = 'transform';
  });

  // 5. Sway horizontal directo
  document.querySelectorAll('[data-motion="sway"]').forEach(el => {
    const duration = el.getAttribute('data-motion-duration') || '4.5s';
    el.style.animation = `flutMotionSway ${duration} ease-in-out infinite`;
    el.style.willChange = 'transform';
  });
}

/**
 * Limpieza general de memoria para SPA
 */
function cleanupMotion() {
  activeIntervals.forEach(timer => clearInterval(timer));
  activeIntervals.clear();

  activeListeners.forEach(({ el, type, fn }) => {
    try {
      el.removeEventListener(type, fn);
    } catch {}
  });
  activeListeners.length = 0;
}

// ─── API Programática Pública ────────────────────────────────
window.FlutMotion = {
  scan: scanMotionElements,
  cleanup: cleanupMotion,
  refresh: () => {
    cleanupMotion();
    scanMotionElements();
  },
  textRoller: mountTextRoller,
  tilt: mountTilt,
  magnetic: mountMagnetic,

  /**
   * Ejecuta una animación personalizada usando Web Animations API (WAAPI)
   */
  animate(target, keyframes, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    return el.animate(keyframes, {
      duration: options.duration || 600,
      easing: options.easing || 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: options.fill || 'forwards',
      ...options
    });
  }
};

// ─── Exportación de Plugin Nativo Flutcom ─────────────────────
export default {
  name: 'motion',
  version: '1.0.0',
  author: 'Comunidad Flutcom',

  init(app, config) {
    injectMotionStyles();
    scanMotionElements();
    console.info('[Flutcom Plugin: Motion] Motor cinético inicializado');
  },

  onNavigate(viewName, container) {
    cleanupMotion();
    // Re-escanear elementos en la nueva vista cargada
    setTimeout(scanMotionElements, 60);
  }
};

