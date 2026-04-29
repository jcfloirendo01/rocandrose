/**
 * silk-hero.js
 * Canvas-driven flowing silk/ribbon animation.
 * No WebGL — pure 2D context with additive blending & layered gradients.
 */

(function () {
  'use strict';

  const POINTS         = 36;       // path resolution per ribbon (was 72)
  const FRAME_INTERVAL = 1000 / 30; // cap to 30 fps — background anim doesn't need 60

  function noise2D(x, y, t) {
    return (
      Math.sin(x * 1.7 + t * 0.6) * 0.5 +
      Math.sin(y * 2.3 + t * 0.5) * 0.3 +
      Math.sin((x + y) * 1.1 + t * 0.8) * 0.2
    );
  }

  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return [
      parseInt(m.slice(0, 2), 16),
      parseInt(m.slice(2, 4), 16),
      parseInt(m.slice(4, 6), 16),
    ];
  }

  function SilkHero(canvasEl, opts) {
    const options = Object.assign({
      coral:     '#E75D4A',
      blue:      '#367FB6',
      bg:        '#0E0D0B',
      intensity: 0.65,
      ribbons:   7,
      grain:     0.05,
    }, opts);

    let raf = 0;
    let w = 0, h = 0;
    let startTime = performance.now();
    let lastFrameTime = 0;

    // Pre-rendered grain texture (rebuilt on resize)
    let grainCanvas = null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvasEl.getContext('2d', { alpha: false });

    const cRgb = hexToRgb(options.coral);
    const bRgb = hexToRgb(options.blue);

    function mixColor(t) {
      return [
        Math.round(cRgb[0] * (1 - t) + bRgb[0] * t),
        Math.round(cRgb[1] * (1 - t) + bRgb[1] * t),
        Math.round(cRgb[2] * (1 - t) + bRgb[2] * t),
      ];
    }

    const params = Array.from({ length: options.ribbons }, (_, i) => {
      const seed = i / options.ribbons;
      return {
        phase:     i * 1.37 + seed * 0.83,
        baseY:     0.1 + seed * 0.8,
        amp:       0.14 + (i % 3) * 0.06,
        freq:      0.9 + seed * 1.1,
        speed:     0.15 + seed * 0.25,
        thickness: 80 + (i % 5) * 55,
        hueMix:    (Math.sin(i * 1.7) + 1) / 2,
        opacity:   0.38 + (i % 3) * 0.09,
      };
    });

    // Build a pre-rendered grain canvas so each frame is a single drawImage call
    // instead of 250 individual fillRect calls.
    function buildGrainTexture() {
      const gw = Math.min(w, 512);
      const gh = Math.min(h, 512);
      grainCanvas = document.createElement('canvas');
      grainCanvas.width  = gw;
      grainCanvas.height = gh;
      const gCtx = grainCanvas.getContext('2d');
      const id   = gCtx.createImageData(gw, gh);
      const data = id.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = (Math.random() * 80) | 0; // subtle, variable alpha
      }
      gCtx.putImageData(id, 0, 0);
    }

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvasEl.width  = w * dpr;
      canvasEl.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (options.grain > 0) buildGrainTexture();
    }

    // Build the ribbon path at a given thickness multiplier into the current context.
    function buildRibbonPath(p, t, thickMul) {
      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const u  = i / POINTS;
        const x  = u * w;
        const n  = noise2D(u * p.freq, p.phase, t * p.speed);
        const cy = p.baseY * h + n * p.amp * h;
        const tk = p.thickness * thickMul * (0.55 + 0.45 * Math.sin(u * 4.8 + t * 0.28 + p.phase));
        if (i === 0) ctx.moveTo(x, cy - tk / 2);
        else         ctx.lineTo(x, cy - tk / 2);
      }
      for (let i = POINTS; i >= 0; i--) {
        const u  = i / POINTS;
        const x  = u * w;
        const n  = noise2D(u * p.freq, p.phase, t * p.speed);
        const cy = p.baseY * h + n * p.amp * h;
        const tk = p.thickness * thickMul * (0.55 + 0.45 * Math.sin(u * 4.8 + t * 0.28 + p.phase));
        ctx.lineTo(x, cy + tk / 2);
      }
      ctx.closePath();
    }

    function drawRibbon(p, t) {
      const [r, g, b] = mixColor(p.hueMix);

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.12, `rgba(${cRgb[0]},${cRgb[1]},${cRgb[2]},${p.opacity * options.intensity})`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},${p.opacity * options.intensity * 1.25})`);
      grad.addColorStop(0.88, `rgba(${bRgb[0]},${bRgb[1]},${bRgb[2]},${p.opacity * options.intensity})`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grad;
      ctx.filter = 'none'; // never set ctx.filter to blur — it's software-only and kills fps

      // Soft outer glow: wide path, low alpha
      ctx.globalAlpha = 0.28;
      buildRibbonPath(p, t, 2.4);
      ctx.fill();

      // Bright core: narrow path, full opacity
      ctx.globalAlpha = 1;
      buildRibbonPath(p, t, 0.5);
      ctx.fill();

      ctx.restore();
    }

    function draw(timestamp) {
      // Throttle to 30 fps
      if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      const t = (timestamp - startTime) / 1000;

      // Background
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.fillStyle = options.bg;
      ctx.fillRect(0, 0, w, h);

      // Warm wash top-left
      const wash1 = ctx.createRadialGradient(w * 0.18, h * 0.22, 0, w * 0.18, h * 0.22, w * 0.72);
      wash1.addColorStop(0, `rgba(${cRgb[0]},${cRgb[1]},${cRgb[2]},0.3)`);
      wash1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash1;
      ctx.fillRect(0, 0, w, h);

      // Cool wash bottom-right
      const wash2 = ctx.createRadialGradient(w * 0.84, h * 0.78, 0, w * 0.84, h * 0.78, w * 0.7);
      wash2.addColorStop(0, `rgba(${bRgb[0]},${bRgb[1]},${bRgb[2]},0.34)`);
      wash2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash2;
      ctx.fillRect(0, 0, w, h);

      // Ribbons
      for (const p of params) drawRibbon(p, t);

      // Film grain — single drawImage from pre-rendered texture with random offset
      if (options.grain > 0 && grainCanvas) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = options.grain;
        const ox = (Math.random() * grainCanvas.width)  | 0;
        const oy = (Math.random() * grainCanvas.height) | 0;
        // Tile the grain across the canvas using two offset draws
        ctx.drawImage(grainCanvas, ox,                     oy,                     w - ox, h - oy, 0,      0,      w - ox, h - oy);
        ctx.drawImage(grainCanvas, 0,                      0,                      ox,     oy,      w - ox, h - oy, ox,     oy);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    }

    function start() {
      resize();
      raf = requestAnimationFrame(draw);
    }

    function stop() {
      cancelAnimationFrame(raf);
    }

    function update(newOpts) {
      Object.assign(options, newOpts);
    }

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvasEl);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else {
        startTime = performance.now() - startTime;
        raf = requestAnimationFrame(draw);
      }
    });

    return { start, stop, update };
  }

  function initAll() {
    document.querySelectorAll('[data-silk-hero]').forEach((canvas) => {
      const hero = SilkHero(canvas, {
        coral:     canvas.dataset.coral     || '#E75D4A',
        blue:      canvas.dataset.blue      || '#367FB6',
        bg:        canvas.dataset.bg        || '#0E0D0B',
        intensity: parseFloat(canvas.dataset.intensity || '0.65'),
        ribbons:   parseInt(canvas.dataset.ribbons     || '7',  10),
        grain:     parseFloat(canvas.dataset.grain     || '0.05'),
      });
      hero.start();
      canvas._silkHero = hero;
    });
  }

  window.SilkHero       = SilkHero;
  window.SilkHeroInitAll = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
