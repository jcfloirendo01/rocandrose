/**
 * wave-hero.js
 * Plasma pixel-shader hero canvas — port of the 21st.dev HeroWave React component.
 *
 * Renders at 1/SCALE resolution then scales up (smooth bilinear).
 * Same iterative sine/cosine field math as the original; colors remapped
 * to the Roc & Rose brand palette (coral #E75D4A ↔ blue #367FB6 on ink #0E0D0B).
 *
 * Mouse moves shift the UV field origin so the plasma appears to follow the cursor.
 */
(function () {
  'use strict';

  const SCALE          = 3;        // render at 1/3 resolution, bilinear scale up
  const FRAME_INTERVAL = 1000 / 30; // 30 fps cap

  // ── Trig lookup tables — same approach as the original component ──────────────
  const TABLE_SIZE = 1024;
  const TWO_PI     = Math.PI * 2;
  const SIN_TABLE  = new Float32Array(TABLE_SIZE);
  const COS_TABLE  = new Float32Array(TABLE_SIZE);
  for (let i = 0; i < TABLE_SIZE; i++) {
    const a = (i / TABLE_SIZE) * TWO_PI;
    SIN_TABLE[i] = Math.sin(a);
    COS_TABLE[i] = Math.cos(a);
  }

  // Negative values are handled correctly by the bitwise AND wrap
  function fastSin(x) {
    return SIN_TABLE[Math.floor(((x % TWO_PI) / TWO_PI) * TABLE_SIZE) & (TABLE_SIZE - 1)];
  }
  function fastCos(x) {
    return COS_TABLE[Math.floor(((x % TWO_PI) / TWO_PI) * TABLE_SIZE) & (TABLE_SIZE - 1)];
  }

  // ── Brand colours (normalised 0–1) ────────────────────────────────────────────
  // Coral  #E75D4A  →  231 93 74
  // Blue   #367FB6  →  54  127 182
  const CR = 231 / 255, CG = 93  / 255, CB = 74  / 255; // coral
  const BR = 54  / 255, BG = 127 / 255, BB = 182 / 255; // blue

  // ── WaveHero instance ─────────────────────────────────────────────────────────
  function WaveHero(canvasEl) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx  = canvasEl.getContext('2d', { alpha: false });

    let w = 0, h = 0;    // logical canvas size
    let rw = 0, rh = 0;  // low-res render size (logical / SCALE)
    let raf    = 0;
    let lastT  = 0;
    const t0   = performance.now();

    // Offscreen canvas for pixel manipulation
    const offscreen = document.createElement('canvas');
    const offCtx    = offscreen.getContext('2d', { willReadFrequently: false });
    let imageData, pixelData;

    // Smoothed mouse (normalised 0–1)
    let mx = 0.5, my = 0.5;
    let tmx = 0.5, tmy = 0.5;

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvasEl.width  = w * dpr;
      canvasEl.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rw = Math.max(1, Math.floor(w / SCALE));
      rh = Math.max(1, Math.floor(h / SCALE));
      offscreen.width  = rw;
      offscreen.height = rh;
      imageData  = offCtx.createImageData(rw, rh);
      pixelData  = imageData.data; // Uint8ClampedArray
    }

    function draw(ts) {
      if (ts - lastT < FRAME_INTERVAL) { raf = requestAnimationFrame(draw); return; }
      lastT = ts;

      const time = (ts - t0) * 0.001;

      // Smooth mouse
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;

      // Mouse shifts the UV field origin (computed once per frame — zero per-pixel cost)
      const mox = (mx - 0.5) * 0.5;
      const moy = (my - 0.5) * 0.5;

      // ── Pixel loop ────────────────────────────────────────────────────────────
      for (let y = 0; y < rh; y++) {
        const u_y = (2 * y - rh) / rh + moy;

        for (let x = 0; x < rw; x++) {
          const u_x = (2 * x - rw) / rh + mox; // note: divide by rh (not rw) — keeps aspect ratio

          // ── Iterative plasma field (unchanged from original) ──────────────────
          let a = 0;
          let d = 0;
          for (let i = 0; i < 4; i++) {
            a += fastCos(i - d + time * 0.5 - a * u_x);
            d += fastSin(i * u_y + a);
          }

          // ── Color mapping — brand palette ─────────────────────────────────────
          const wave     = (fastSin(a) + fastCos(d)) * 0.5; // approx -1 → +1
          const intensity = 0.20 + 0.38 * (wave * 0.5 + 0.5); // 0.20 – 0.58

          const coralW = 0.42 * (wave >  0 ?  wave : 0); // coral on positive wave
          const blueW  = 0.38 * (wave < 0  ? -wave : 0); // blue  on negative wave
          const base   = 0.07 + 0.07 * fastCos(u_x + u_y + time * 0.3); // dark ink base

          // Clamp inline (avoids Math.max/min call overhead in hot loop)
          let r = (base + coralW * CR + blueW * BR) * intensity;
          let g = (base + coralW * CG + blueW * BG) * intensity;
          let b = (base + coralW * CB + blueW * BB) * intensity;

          if (r > 1) r = 1; else if (r < 0) r = 0;
          if (g > 1) g = 1; else if (g < 0) g = 0;
          if (b > 1) b = 1; else if (b < 0) b = 0;

          const idx = (y * rw + x) << 2; // * 4
          pixelData[idx]     = (r * 255 + 0.5) | 0;
          pixelData[idx + 1] = (g * 255 + 0.5) | 0;
          pixelData[idx + 2] = (b * 255 + 0.5) | 0;
          pixelData[idx + 3] = 255;
        }
      }

      // Upload low-res buffer, then scale up to fill the hero canvas smoothly
      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(offscreen, 0, 0, rw, rh, 0, 0, w, h);

      raf = requestAnimationFrame(draw);
    }

    function onMouse(e) {
      const rect = canvasEl.getBoundingClientRect();
      tmx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      tmy = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
    }

    function start() {
      resize();
      raf = requestAnimationFrame(draw);
      window.addEventListener('mousemove', onMouse, { passive: true });
    }

    function stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvasEl);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else raf = requestAnimationFrame(draw);
    });

    return { start, stop };
  }

  // ── Auto-init all [data-wave-hero] canvases ──────────────────────────────────
  function initAll() {
    document.querySelectorAll('[data-wave-hero]').forEach((canvas) => {
      if (canvas._waveHero) canvas._waveHero.stop();
      const hero = WaveHero(canvas);
      hero.start();
      canvas._waveHero = hero;
    });
  }

  window.WaveHero        = WaveHero;
  window.WaveHeroInitAll = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
