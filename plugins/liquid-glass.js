/**
 * liquid-glass.js — Plugin Flutcom
 * Efecto de cristal liquido (Liquid Glass) estilo iPhone.
 * Usa filtros SVG para deformar el fondo con aberracion cromatica.
 * Funciona mejor en navegadores basados en Chromium.
 * Incluye fallback automatico con blur simple para Firefox/Safari.
 *
 * Uso:
 *   <glass-element width="300" height="200" radius="24" depth="12" blur="4" strength="80">
 *     Contenido aqui
 *   </glass-element>
 *
 * Atributos opcionales:
 *   auto-size               — El elemento se adapta al contenido interior
 *   responsive              — Escala segun el viewport
 *   chromatic-aberration    — Intensidad de aberracion cromatica (default 0)
 *   background-color        — Color de fondo (default rgba(255,255,255,0.4))
 *   debug                   — Muestra el mapa de desplazamiento
 */

// ─── Displacement Map ─────────────────────────────────────────────────────────

function getDisplacementMap(opts) {
    var h = opts.height, w = opts.width, r = opts.radius, d = opts.depth;

    var y1 = Math.ceil((r / h) * 15);
    var y2 = Math.floor(100 - (r / h) * 15);
    var x1 = Math.ceil((r / w) * 15);
    var x2 = Math.floor(100 - (r / w) * 15);
    var rh = h - 2 * d;
    var rw = w - 2 * d;

    var svg = '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        '<style>.mix{mix-blend-mode:screen}</style>' +
        '<defs>' +
            '<linearGradient id="Y" x1="0" x2="0" y1="' + y1 + '%" y2="' + y2 + '%">' +
                '<stop offset="0%" stop-color="#0F0"/>' +
                '<stop offset="100%" stop-color="#000"/>' +
            '</linearGradient>' +
            '<linearGradient id="X" x1="' + x1 + '%" x2="' + x2 + '%" y1="0" y2="0">' +
                '<stop offset="0%" stop-color="#F00"/>' +
                '<stop offset="100%" stop-color="#000"/>' +
            '</linearGradient>' +
        '</defs>' +
        '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#808080"/>' +
        '<g filter="blur(2px)">' +
            '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#000080"/>' +
            '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#Y)" class="mix"/>' +
            '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#X)" class="mix"/>' +
            '<rect x="' + d + '" y="' + d + '" height="' + rh + '" width="' + rw + '" fill="#808080" rx="' + r + '" ry="' + r + '" filter="blur(' + d + 'px)"/>' +
        '</g>' +
        '</svg>';

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── Displacement Filter ──────────────────────────────────────────────────────

function getDisplacementFilter(opts) {
    var h = opts.height, w = opts.width, r = opts.radius, d = opts.depth;
    var strength = opts.strength !== undefined ? opts.strength : 100;
    var ca = opts.chromaticAberration !== undefined ? opts.chromaticAberration : 0;

    var mapUrl = getDisplacementMap({ height: h, width: w, radius: r, depth: d });
    var s0 = strength + ca * 2;
    var s1 = strength + ca;
    var s2 = strength;

    var svg = '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
            '<filter id="displace" color-interpolation-filters="sRGB">' +
                '<feImage x="0" y="0" height="' + h + '" width="' + w + '" href="' + mapUrl + '" result="displacementMap"/>' +
                '<feDisplacementMap transform-origin="center" in="SourceGraphic" in2="displacementMap" scale="' + s0 + '" xChannelSelector="R" yChannelSelector="G"/>' +
                '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedR"/>' +
                '<feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="' + s1 + '" xChannelSelector="R" yChannelSelector="G"/>' +
                '<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedG"/>' +
                '<feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="' + s2 + '" xChannelSelector="R" yChannelSelector="G"/>' +
                '<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="displacedB"/>' +
                '<feBlend in="displacedR" in2="displacedG" mode="screen"/>' +
                '<feBlend in2="displacedB" mode="screen"/>' +
            '</filter>' +
        '</defs>' +
    '</svg>';

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '#displace';
}

// Exponer utilidades globalmente
window.DisplacementUtils = {
    getDisplacementMap: getDisplacementMap,
    getDisplacementFilter: getDisplacementFilter
};

// ─── Web Component: <glass-element> ──────────────────────────────────────────

var GlassElement = (function () {
    function GlassElement() {
        HTMLElement.call(this);
        this.clicked = false;
        this.attachShadow({ mode: 'open' });

        if (GlassElement._svgSupport === undefined) {
            GlassElement._svgSupport = detectSVGSupport();
            console.log('[GlassElement] SVG Filter Support: ' + (GlassElement._svgSupport ? 'YES' : 'NO'));
        }
    }

    // Herencia de HTMLElement
    GlassElement.prototype = Object.create(HTMLElement.prototype);
    GlassElement.prototype.constructor = GlassElement;

    function detectSVGSupport() {
        var el = document.createElement('div');
        el.style.backdropFilter = 'blur(1px)';
        if (!el.style.backdropFilter) return false;

        var ua = navigator.userAgent.toLowerCase();
        var isChrome = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
        var isFirefox = /firefox|fxios/.test(ua);
        var isSafari = /safari/.test(ua) && !/chrome|chromium|crios|edg/.test(ua);

        if (isChrome) return true;
        if (isFirefox || isSafari) return false;

        try {
            el.style.backdropFilter = 'url(#test)';
            return el.style.backdropFilter.indexOf('url') !== -1;
        } catch (e) {
            return false;
        }
    }

    Object.defineProperty(GlassElement.prototype, 'hasSVGFilterSupport', {
        get: function () { return GlassElement._svgSupport; }
    });

    GlassElement.observedAttributes = [
        'width', 'height', 'radius', 'depth', 'blur', 'strength',
        'chromatic-aberration', 'debug', 'background-color',
        'responsive', 'base-width', 'base-height', 'auto-size', 'min-width', 'min-height'
    ];

    // Getters
    Object.defineProperty(GlassElement.prototype, 'width',  { get: function () { return parseInt(this.getAttribute('width'))  || 200; } });
    Object.defineProperty(GlassElement.prototype, 'height', { get: function () { return parseInt(this.getAttribute('height')) || 200; } });
    Object.defineProperty(GlassElement.prototype, 'radius', { get: function () { return parseInt(this.getAttribute('radius')) || 50; } });
    Object.defineProperty(GlassElement.prototype, 'baseDepth', { get: function () { return parseInt(this.getAttribute('depth')) || 10; } });
    Object.defineProperty(GlassElement.prototype, 'blur',   { get: function () { return parseInt(this.getAttribute('blur'))   || 2; } });
    Object.defineProperty(GlassElement.prototype, 'strength', { get: function () { return parseInt(this.getAttribute('strength')) || 100; } });
    Object.defineProperty(GlassElement.prototype, 'chromaticAberration', { get: function () { return parseInt(this.getAttribute('chromatic-aberration')) || 0; } });
    Object.defineProperty(GlassElement.prototype, 'debug',  { get: function () { return this.getAttribute('debug') === 'true'; } });
    Object.defineProperty(GlassElement.prototype, 'backgroundColor', { get: function () { return this.getAttribute('background-color') || 'rgba(255,255,255,0.4)'; } });
    Object.defineProperty(GlassElement.prototype, 'autoSize', { get: function () { return this.hasAttribute('auto-size'); } });
    Object.defineProperty(GlassElement.prototype, 'minWidth',  { get: function () { return parseInt(this.getAttribute('min-width'))  || 0; } });
    Object.defineProperty(GlassElement.prototype, 'minHeight', { get: function () { return parseInt(this.getAttribute('min-height')) || 0; } });
    Object.defineProperty(GlassElement.prototype, 'depth', {
        get: function () { return this.baseDepth / (this.clicked ? 0.7 : 1); }
    });

    GlassElement.prototype.connectedCallback = function () {
        this.render();
        this.setupEventListeners();
        if (this.hasAttribute('responsive')) {
            this.updateResponsiveSize();
            var self = this;
            window.addEventListener('resize', function () { self.updateResponsiveSize(); });
        }
    };

    GlassElement.prototype.attributeChangedCallback = function () {
        if (this.shadowRoot && this.shadowRoot.innerHTML) this.render();
    };

    GlassElement.prototype.updateResponsiveSize = function () {
        var baseW = parseInt(this.getAttribute('base-width')  || this.getAttribute('width'))  || 200;
        var baseH = parseInt(this.getAttribute('base-height') || this.getAttribute('height')) || 200;
        var vp = window.innerWidth;
        var scale = vp < 480 ? 0.6 : vp < 768 ? 0.8 : vp < 1024 ? 0.9 : 1;
        var nw = Math.round(baseW * scale);
        var nh = Math.round(baseH * scale);
        if (nw !== this.width || nh !== this.height) {
            this.setAttribute('width', nw);
            this.setAttribute('height', nh);
        }
    };

    GlassElement.prototype.updateStyles = function () {
        var box = this.shadowRoot.querySelector('.glass-box');
        if (box) this.applyDynamicStyles(box);
    };

    GlassElement.prototype.applyDynamicStyles = function (element) {
        var utils = window.DisplacementUtils;
        element.style.borderRadius = this.radius + 'px';

        var h, w;

        if (this.autoSize) {
            element.style.backdropFilter = 'none';
            element.style.background = 'rgba(255,255,255,0.4)';
            element.offsetWidth; // force reflow
            var rect = element.getBoundingClientRect();
            w = Math.max(Math.ceil(rect.width),  Math.max(this.minWidth,  50));
            h = Math.max(Math.ceil(rect.height), Math.max(this.minHeight, 30));
            if (w === 0 || h === 0) {
                var self = this;
                requestAnimationFrame(function () { self.updateStyles(); });
                return;
            }
        } else {
            w = this.width;
            h = this.height;
            element.style.width  = w + 'px';
            element.style.height = h + 'px';
        }

        var opts = { height: h, width: w, radius: this.radius, depth: this.depth, strength: this.strength, chromaticAberration: this.chromaticAberration };

        if (this.debug) {
            element.style.background = 'url("' + utils.getDisplacementMap({ height: h, width: w, radius: this.radius, depth: this.depth }) + '")';
            element.style.boxShadow = 'none';
            element.style.backdropFilter = 'none';
        } else if (!this.hasSVGFilterSupport) {
            element.style.backdropFilter = 'blur(' + (this.blur * 2) + 'px)';
            element.style.background = this.backgroundColor;
            element.style.boxShadow = '1px 1px 1px 0 rgba(255,255,255,0.6) inset, -1px -1px 1px 0 rgba(255,255,255,0.6) inset, 0 0 16px 0 rgba(0,0,0,0.04)';
            element.style.border = '1px solid rgba(255,255,255,0.3)';
        } else {
            var filterUrl = utils.getDisplacementFilter(opts);
            element.style.backdropFilter = 'blur(' + (this.blur / 2) + 'px) url(\'' + filterUrl + '\') blur(' + this.blur + 'px) brightness(1.1) saturate(1.5)';
            element.style.background = this.backgroundColor;
            element.style.boxShadow = '1px 1px 1px 0 rgba(255,255,255,0.6) inset, -1px -1px 1px 0 rgba(255,255,255,0.6) inset, 0 0 16px 0 rgba(0,0,0,0.04)';
        }
    };

    GlassElement.prototype.setupEventListeners = function () {
        var box = this.shadowRoot.querySelector('.glass-box');
        var self = this;

        box.addEventListener('mousedown', function () { self.clicked = true;  self.updateStyles(); });
        box.addEventListener('mouseup',   function () { self.clicked = false; self.updateStyles(); });
        box.addEventListener('mouseleave',function () { self.clicked = false; self.updateStyles(); });
        document.addEventListener('mouseup', function () {
            if (self.clicked) { self.clicked = false; self.updateStyles(); }
        });
    };

    GlassElement.prototype.render = function () {
        var autoSize = this.autoSize;
        var minW = this.minWidth;
        var minH = this.minHeight;

        var styles = [
            ':host { display: ' + (autoSize ? 'inline-block' : 'block') + '; }',
            '.glass-box {',
            '  background: rgba(255,255,255,0.4);',
            '  box-shadow: 1px 1px 1px 0 rgba(255,255,255,0.6) inset, -1px -1px 1px 0 rgba(255,255,255,0.6) inset, 0 0 16px 0 rgba(0,0,0,0.04);',
            '  cursor: pointer;',
            '  transition: transform 0.1s ease;',
            '  position: relative;',
            autoSize ? '  display: inline-block; width: fit-content; min-width: ' + minW + 'px; min-height: ' + minH + 'px;' : '',
            '}',
            '.glass-box:active { transform: scale(0.98); }',
            '.content {',
            autoSize ? '' : '  width: 100%; height: 100%;',
            '  display: flex; align-items: center; justify-content: center;',
            '  color: white; text-align: center; font-family: sans-serif;',
            autoSize ? '  padding: var(--glass-padding, 16px 24px);' : '',
            '}'
        ].join('\n');

        this.shadowRoot.innerHTML = (
            '<style>' + styles + '</style>' +
            '<div class="glass-box"><div class="content"><slot></slot></div></div>'
        );

        var box = this.shadowRoot.querySelector('.glass-box');
        var self = this;

        if (autoSize) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    self.applyDynamicStyles(box);
                });
            });
        } else {
            this.applyDynamicStyles(box);
        }

        this.setupEventListeners();
    };

    return GlassElement;
})();

// Registrar el Web Component
customElements.define('glass-element', GlassElement);
