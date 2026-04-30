/**
 * lenis-init.js
 * Smooth-scroll via Lenis, wired to GSAP's ticker + ScrollTrigger.
 * Exposes window.RRLenis so Barba transitions can pause/resume it.
 */

(function () {
  'use strict';

  const { gsap, ScrollTrigger, Lenis } = window;

  if (!Lenis) {
    console.warn('[R&R] Lenis not loaded.');
    return;
  }

  // ── Create Lenis instance ─────────────────────────────────────────────────
  const lenis = new Lenis({
    duration: 0.9,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // ── Wire Lenis → GSAP ScrollTrigger ──────────────────────────────────────
  // Use the GSAP ticker to drive ScrollTrigger rather than every Lenis scroll
  // event — this avoids calling ScrollTrigger.update() up to 60× per second.
  if (ScrollTrigger) {
    gsap && gsap.ticker.add(() => ScrollTrigger.update());
  }

  // Drive Lenis from GSAP's RAF ticker so they stay in sync
  if (gsap) {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback: own RAF loop
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ── Anchor links: let Lenis handle smooth scroll ──────────────────────────
  // Handles both pure hash links (#process) and same-page path+hash links
  // (index.html#process, /index#studio) so nav clicks never cause a reload.
  function normPath(p) {
    return p.replace(/\/index(\.html?)?$/, '/').replace(/\.html?$/, '') || '/';
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (!href.includes('#')) return;

    let hash;

    if (href.startsWith('#')) {
      // Pure hash link — always same page
      hash = href;
    } else {
      // Path+hash link — only handle when destination is the current page
      const dest = new URL(href, window.location.href);
      if (normPath(dest.pathname) !== normPath(window.location.pathname)) return;
      hash = dest.hash;
    }

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();
    lenis.scrollTo(target, { offset: -80, duration: 1.4 });
  });

  // ── Public API ────────────────────────────────────────────────────────────
  window.RRLenis = lenis;
})();
