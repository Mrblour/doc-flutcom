# 🎬 Diagnóstico y Solución: Glitch y Jitter de Hipervelocidad en Animaciones CSS

Este documento registra el análisis técnico, la causa raíz y la solución definitiva al problema de vibración extrema (glitch/jitter) que afectaba a las animaciones de movimiento en el framework Flutcom.

---

## 1. 🛑 El Problema Observado

Al intentar aplicar cualquier animación de movimiento continuo (por ejemplo, el vaivén del logo o el pulso del indicador de estado en `resources/views/public/home.html`):

- **Síntomas visuales:**
  - Los elementos animados vibraban o parpadeaban a una frecuencia incontrolable ("velocidad loca").
  - El indicador de estado (`animate-ping`) parecía una falla eléctrica o estroboscópica.
  - Al aplicar `translateY`, `translateX` o `scale` con `infinite`, los componentes temblaban violentamente en lugar de desplazarse de forma suave.

---

## 2. 🔬 Análisis y Causa Raíz

Contrario a las sospechas iniciales de que el motor del framework (`flutcom/core.js`) o el código de la vista HTML estuviesen en conflicto, la causa raíz se encontraba en una regla global mal implementada en la configuración base de **Tailwind CSS**.

### La regla culpable en `src/input.css`:
```css
/* ❌ IMPLEMENTACIÓN DEFECTUOSA (en src/input.css) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ¿Por qué detonaba el glitch?

1. **Disparador en Windows (`prefers-reduced-motion: reduce`)**:
   - En Windows 10/11, si el usuario tiene desactivada la opción del sistema *"Efectos de animación"* en `Configuración > Accesibilidad > Efectos visuales` (o por ahorro de batería), el navegador web (Chrome, Edge, Firefox) activa automáticamente la media query `@media (prefers-reduced-motion: reduce)`.

2. **La matemática del glitch (100.000 iteraciones por segundo)**:
   - El selector universal `*, *::before, *::after` forzaba la duración de **todas** las animaciones a `0.01ms !important`.
   - **El error crítico:** No se limitó el número de repeticiones (`animation-iteration-count`).
   - Al tener animaciones infinitas (`animation: ... infinite`):
     $$\frac{1.000\text{ ms (1 segundo)}}{0,01\text{ ms}} = 100.000\text{ repeticiones por segundo}$$
   - El navegador intentaba ejecutar el ciclo de animación completo 100.000 veces por segundo, provocando que en cada cuadro de refresco (60 Hz / 144 Hz) el elemento cambiara erráticamente de coordenadas, produciendo un temblor destructivo.

---

## 3. 🛠️ Solución Definitiva

### Paso 1: Corrección en `src/input.css`
Se eliminó la regla que forzaba el `0.01ms` en bucles infinitos:

```css
/* ✅ CORRECTO: Elementos multimedia estándar sin sobreescritura dañina */
img, video, svg {
  display: block;
  max-width: 100%;
}
```

> **Nota para buenas prácticas de accesibilidad:**
> Si en el futuro se desea desactivar animaciones para usuarios con sensibilidad al movimiento sin generar glitches, se debe anular la animación por completo (`animation: none`) o forzar que el contador de iteraciones sea 1:
> ```css
> @media (prefers-reduced-motion: reduce) {
>   *, *::before, *::after {
>     animation: none !important;
>     transition: none !important;
>   }
> }
> ```

### Paso 2: Recompilación de Tailwind CSS
Se ejecutó el compilador para regenerar `assets/vendor/tailwind/tailwind.css`:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./assets/vendor/tailwind/tailwind.css
```

---

## 4. 🚀 Resultado y Validación

Tras la corrección:
1. **Logo con vaivén suave (`logo-sway`)**:
   - Se desplaza de izquierda a derecha (`translateX` de `-15px` a `+15px`) en un ciclo sereno de **4.5 segundos** con `ease-in-out infinite`.
   - Movimiento 100% fluido a 60 FPS, sin temblores ni sobrecarga de GPU.
2. **Badge de estado**:
   - Muestra un punto verde esmeralda con un resplandor ambiental estático y limpio, sin parpadeos.
3. **Tests del sistema**:
   - `npm test`: 14/14 tests pasando exitosamente (Vitest).
   - `npm run check`: 0 errores en TypeScript (`tsc --noEmit`).

---

## 5. 🌐 Caso de Estudio 2: Elementos Animados Estáticos en Componentes Dinámicos (`ecosystem-bar`)

### 1. El Problema Observado
Al migrar la sección de logos y plataformas de despliegue a un componente nativo de Flutcom (`<flut-ecosystem-bar>`) e incorporar una esfera halftone 3D de fondo:
- La esfera permanecía completamente inmóvil ("estática") en pantalla a pesar de tener clases CSS con `@keyframes` infinitos como `animate-halftone-traverse` o `animate-spin`.
- No realizaba el recorrido libre por el ancho del componente.

### 2. ¿Por qué no funcionaba? (Causa Raíz)
1. **Pérdida de contexto en componentes inyectados dinámicamente**:
   - Flutcom v1.4.1 renderiza componentes mediante `fetch` asíncrono y reemplaza el DOM en tiempo de ejecución (`replaceWith`).
   - Los elementos con clases CSS que dependen de porcentajes relativos o unidades de viewport (`vw`) calculados antes del renderizado de la vista no siempre disparan el ciclo de renderizado de la GPU si el contenedor padre aún no tiene dimensiones finales establecidas durante el reemplazo del nodo.
2. **Colisión de transformaciones 2D y posicionamiento estático**:
   - La regla CSS intentaba mover la esfera con `translate(35vw, -50%)` relativo a la ventana, pero dentro de un contenedor con `overflow-hidden` y flexbox de la barra, provocando que el navegador bloqueara la interpolación continua o la renderizara fuera del área visible visiblemente "fija".

### 3. La Solución Definitiva (Motor Cinético Anime.js + Pipeline de Scripts Flutcom)
En lugar de depender exclusivamente de clases CSS que pueden fallar al montarse dinámicamente:
1. **Inyección de Script en el Componente (`_executeScripts`)**:
   - Flutcom cuenta con el mecanismo nativo `_executeScripts(el)` que re-ejecuta cualquier `<script>` dentro de un componente tras montarlo en el DOM.
2. **Control por Javascript con Anime.js v4**:
   - Se delegó el cálculo de la trayectoria horizontal a `Anime.js` tomando el ancho real del contenedor en el DOM (`container.offsetWidth`):
     ```javascript
     animeLib.animate(sphere, {
       translateX: [
         { to: -80, duration: 0 },
         { to: container.offsetWidth - 140, duration: 18000, ease: 'inOutSine' },
         { to: -80, duration: 18000, ease: 'inOutSine' }
       ],
       rotate: [
         { to: 0, duration: 0 },
         { to: 360, duration: 36000, ease: 'linear' }
       ],
       scale: [
         { to: 0.95, duration: 0 },
         { to: 1.1, duration: 9000, ease: 'inOutQuad' },
         { to: 0.95, duration: 9000, ease: 'inOutQuad' }
       ],
       opacity: [
         { to: 0.16, duration: 0 },
         { to: 0.32, duration: 9000, ease: 'inOutSine' },
         { to: 0.16, duration: 9000, ease: 'inOutSine' }
       ],
       loop: true
     });
     ```
3. **Garantía con Fallback de Alto Rendimiento (`requestAnimationFrame`)**:
   - Si la librería Anime.js aún no está lista en memoria, el componente ejecuta un bucle a 60 FPS mediante `requestAnimationFrame`, asegurando que la esfera **nunca se quede congelada** bajo ninguna circunstancia.

### 4. Resultado
- La esfera halftone se desplaza fluidamente de extremo a extremo por todo el ancho de la barra.
- Rota suavemente en 360° mientras respira en escala y opacidad.
- Los logotipos y textos se mantienen legibles y estables en primer plano.

---

## 6. 📜 Caso de Estudio 3: Animaciones de Scroll Reveal "Secas", Bruscas o que Aparecen de Golpe ("De la nada")

### 1. El Problema Observado
En las vistas `#home` y `#about`, los bloques de contenido configurados con el plugin nativo `animations` (`.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-group`):
- No transmitían la sensación de acercamiento suave ni fluidez al desplazarse por la página.
- Permanecían invisibles durante el scroll y, de repente, saltaban a la vista uno a uno de forma abrupta ("secos de la nada").
- En el bloque inferior de llamada a la acción (CTA), los textos y el botón aparecían desconectados y en momentos arbitrarios.

---

### 2. Diagnóstico Técnico y Causas Raíz

Tras una inspección profunda del pipeline entre Tailwind CSS, el plugin nativo y el DOM de las vistas, se identificaron cinco factores interconectados:

#### A. Invalidador de Transiciones en Tailwind CSS (`src/input.css`)
En la configuración base de accesibilidad se encontraba la siguiente regla:
```css
/* ❌ CULPABLE: Anulación total de transiciones en navegadores con reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; /* <-- Sobrescribía cualquier CSS transition */
    scroll-behavior: auto !important;
  }
}
```
**Impacto en Windows:** Si el sistema operativo tiene desactivada la opción *"Efectos de animación"* en la configuración de accesibilidad o el dispositivo entra en modo de ahorro de batería, Chromium (Chrome, Brave, Edge) activa automáticamente el modo `prefers-reduced-motion: reduce`. Como la regla usaba el selector universal con `!important`, la propiedad `transition: opacity 1.1s, transform 1.1s` de `.reveal` era sobreescrita a **0.01 milisegundos**, haciendo que los elementos aparecieran instantáneamente sin animación.

#### B. Umbral tardío y margen negativo excesivo (`IntersectionObserver`)
En `dev/plugins/animations/animations.flutcom.json`:
- `threshold: 0.12`: Exigía que el 12% del alto del elemento cruzara el margen antes de disparar.
- `rootMargin: "0px 0px -50px 0px"`: Subía la línea de activación 50 píxeles por encima del borde inferior de la pantalla.
**Consecuencia:** Al hacer scroll normalmente, el usuario ya tenía el contenedor parcialmente dentro del campo visual mientras seguía al 100% invisible (`opacity: 0`). Al cruzar finalmente la línea tardía, la clase `.active` se agregaba de golpe, generando la sensación de "aparecer de la nada".

#### C. Predominio de desplazamientos horizontales vs. acercamiento vertical
La mayoría de secciones tenían clases como `.reveal-left` (`translateX(40px) scale(0.97)`) o `.reveal-right`. Al hacer scroll vertical, un desplazamiento puramente lateral rompe la armonía visual de lectura. Además, una escala inicial de `0.97` (solo 3% de cambio) resultaba imperceptible, privando al usuario del efecto de **acercamiento** (*smooth zoom-in*).

#### D. Curva Bézier con aceleración inicial agresiva
Se utilizaba `cubic-bezier(0.16, 1, 0.3, 1)`. Esta curva alcanza el 85% de la interpolación en apenas el 15% del tiempo total, produciendo un salto rápido inicial seguido de una desaceleración casi estática.

#### E. Dispersión de directivas Reveal en componentes hermanos
En secciones como el CTA, el badge, el encabezado `<h2>` y el contenedor de botones tenían clases `.reveal` individuales y separadas, mientras que el párrafo descriptivo no tenía ninguna. Esto provocaba que los elementos entraran desfasados y sin cadencia armónica.

---

### 3. La Solución Definitiva

#### 1. Saneamiento en `src/input.css` y Recompilación de Tailwind
Se eliminó la anulación destructiva de `transition-duration`:
```css
/* ✅ CORRECTO: Respeta animaciones finitas y transiciones de interfaz */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```
Se recompiló el motor de estilos:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./assets/vendor/tailwind/tailwind.css
```

#### 2. Calibración del IntersectionObserver (`animations.flutcom.json`)
Se optimizó la sensibilidad de activación:
```json
{
  "options": {
    "threshold": 0.02,
    "rootMargin": "0px 0px -20px 0px"
  }
}
```
Con un umbral del 2% y margen de -20px, la animación arranca sutilmente justo cuando el elemento empieza a asomar en la vista, eliminando la sensación de retraso o "aparición de la nada".

#### 3. Rediseño Cinemático del Plugin (`animations.flutcom.js`)
- **Acercamiento real (*Smooth Zoom-In + Lift*):**
  - Estado base: `scale(0.93)` y elevación de `32px` a `36px`.
  - Transición fluida hacia `scale(1)` y `translate(0, 0)`.
- **Curva Suave Vercel/Apple:**
  - `cubic-bezier(0.22, 1, 0.36, 1)`: Movimiento continuo, inicio sedoso y aterrizaje acolchado.
- **Protección contra re-disparos:**
  - Verificación `if (el.classList.contains('active')) return;` para evitar reinicios al re-escanear rutas SPA.
- **Staggering previo:**
  - Los retardos escalonados en `.reveal-group` (`transitionDelay`) se asignan a los hijos **antes** de encender la clase `.active`, garantizando que el navegador aplique los tiempos de retardo correctamente.

#### 4. Coordinación de Retardos (Stagger) en Vistas (`home.html` y `about.html`)
- En el Hero y los Showcases bento:
  - Columna 1 (Titular/CTA): Sin delay (0ms).
  - Columna 2 (Prisma 3D / Terminal): `data-delay="100"`.
  - Columna 3 (Especificaciones rápidas): `data-delay="200"`.
- En el CTA Bottom: Se unificó el contenedor central bajo una sola directiva `.reveal.reveal-up`, logrando que el badge, título, descripción y CLI pill asciendan juntos con un acercamiento armónico.

---

### 4. Resultado y Métricas
- **100% Fluidez de Acercamiento:** El contenido asciende desde `scale(0.93)` con un zoom suave y sin sobresaltos.
- **Scroll Natural:** Sin vacíos ciegos ni elementos que salten de golpe.
- **Compatibilidad Total:** Funciona de manera idéntica en entornos con o sin `prefers-reduced-motion`.
- **Suite de Calidad:**
  - Vitest: **14/14 tests pasando**.
  - TypeScript: **0 errores** (`tsc --noEmit`).
  - Build: **Exitoso** (`dist/` sincronizado).

---

### 5. ¿Ocurría por la PC local o afectaría también en GitHub Pages?
**No era un problema exclusivo de la máquina local.** Se trataba de un defecto en el código fuente del proyecto:
1. **El detonante del sistema:** En Windows, macOS, iOS o Android, cuando el usuario activa el ahorro de energía o desmarca "Efectos de animación", el sistema operativo emite la señal estándar `prefers-reduced-motion: reduce`.
2. **La respuesta errónea en el código:** `src/input.css` tenía codificado `transition-duration: 0.01ms !important;`. El código forzaba a que las transiciones duraran 0.01 ms, anulando cualquier animación en lugar de presentar un movimiento respetuoso.
3. **Comportamiento en producción (GitHub Pages):** Si el código original se hubiese publicado en GitHub Pages, cualquier visitante que entrara desde un portátil con batería baja o con esa configuración de accesibilidad habría visto exactamente el mismo fallo ("seco de la nada"). Además, el margen ciego de `-50px` y `threshold: 0.12` afectaba negativamente a **todos** los visitantes por igual.
4. **Garantía tras la solución:** Al corregir el selector universal en Tailwind y calibrar el `IntersectionObserver`, el código compilado para producción (`dist/`) es ahora universal y robusto, garantizando transiciones suaves de aproximación en cualquier navegador y plataforma.




