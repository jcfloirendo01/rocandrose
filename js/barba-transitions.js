/**
 * barba-transitions.js
 * Barba.js page transitions — shutter (venetian-blind) effect.
 *
 * N_SLATS horizontal strips close like blinds (odd from left, even from right)
 * to hide the old page, then peel back in reverse order to reveal the new one.
 */

(function () {
  'use strict';

  const { barba, gsap, ScrollTrigger } = window;

  if (!barba) {
    console.warn('[R&R] Barba.js not loaded.');
    return;
  }

  // ── Config ────────────────────────────────────────────────────────────────
  const N_SLATS     = 6;    // number of horizontal strips
  const SLAT_DUR    = 0.48; // each slat animation duration (s)
  const SLAT_STAG   = 0.06; // stagger between slats (s)
  const EASE_CLOSE  = 'power4.inOut';
  const EASE_OPEN   = 'power4.inOut';

  // ── Build shutter DOM ─────────────────────────────────────────────────────
  function buildShutter() {
    const shutter = document.createElement('div');
    shutter.className = 'shutter';
    shutter.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < N_SLATS; i++) {
      const slat = document.createElement('div');
      slat.className = 'shutter__slat';
      shutter.appendChild(slat);
    }

    // Brand overlay (visible while shutters are closed)
    shutter.innerHTML += `
      <div class="shutter__brand">
        <div class="shutter__brand-inner">
          <span class="shutter__brand-mark">R</span>
          <span class="shutter__brand-name">Roc &amp; Rose</span>
        </div>
      </div>`;

    document.body.appendChild(shutter);
    return shutter;
  }

  const shutter  = buildShutter();
  const slats    = shutter.querySelectorAll('.shutter__slat');
  const brand    = shutter.querySelector('.shutter__brand');

  // Initialise slats to fully open (scaleX = 0)
  gsap.set(slats, { scaleX: 0 });
  gsap.set(brand, { opacity: 0 });

  // ── Close shutter (cover screen) ──────────────────────────────────────────
  function shutterClose() {
    return new Promise((resolve) => {
      // Restore each slat's own origin (CSS handles odd=left, even=right)
      // but GSAP overrides inline transform-origin so we set them here:
      slats.forEach((s, i) => {
        gsap.set(s, { transformOrigin: i % 2 === 0 ? 'left center' : 'right center' });
      });

      const tl = gsap.timeline({ onComplete: resolve });

      // Close all slats with cascade stagger
      tl.to(slats, {
        scaleX: 1,
        duration: SLAT_DUR,
        ease: EASE_CLOSE,
        stagger: {
          each: SLAT_STAG,
          from: 'start',
        },
      });

      // Brand fades in once most slats are closed
      tl.to(brand, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      }, SLAT_STAG * (N_SLATS - 1) + SLAT_DUR * 0.6);
    });
  }

  // ── Open shutter (uncover screen) ─────────────────────────────────────────
  function shutterOpen() {
    return new Promise((resolve) => {
      // On open, all slats retract from the opposite side
      slats.forEach((s, i) => {
        gsap.set(s, { transformOrigin: i % 2 === 0 ? 'right center' : 'left center' });
      });

      const tl = gsap.timeline({ onComplete: resolve });

      // Brand fades out first
      tl.to(brand, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });

      // Slats peel back in reverse order
      tl.to(slats, {
        scaleX: 0,
        duration: SLAT_DUR,
        ease: EASE_OPEN,
        stagger: {
          each: SLAT_STAG,
          from: 'end',   // reverse: top slat opens last
        },
      }, 0.1);
    });
  }

  // ── Lenis helpers ─────────────────────────────────────────────────────────
  function lenisStop()  { window.RRLenis?.stop(); }
  function lenisStart() { window.RRLenis?.start(); }

  function scrollToTop() {
    // Instantly jump — Lenis is stopped at this point
    window.scrollTo(0, 0);
    window.RRLenis?.scrollTo(0, { immediate: true });
  }

  // ── Re-init helpers ───────────────────────────────────────────────────────
  function reinitSilkHeroes() {
    document.querySelectorAll('[data-silk-hero]').forEach((c) => {
      c._silkHero?.stop();
    });
    if (window.SilkHeroInitAll) window.SilkHeroInitAll();
  }

  function reinitWaveHeroes() {
    document.querySelectorAll('[data-wave-hero]').forEach((c) => {
      c._waveHero?.stop();
    });
    if (window.WaveHeroInitAll) window.WaveHeroInitAll();
  }

  function reinitAnimations() {
    if (window.RRAnimations) window.RRAnimations.init();
  }

  function reinitContactForm() {
    initChips('.contact-page__chip');
    initContactFormSubmit();
    initBudgetChipsExclusive();
  }

  // ── Barba.js ──────────────────────────────────────────────────────────────
  // Normalise a pathname so /, /index, /index.html all compare equal
  function normPath(p) {
    return p.replace(/\/index(\.html?)?$/, '/').replace(/\.html?$/, '') || '/';
  }

  barba.init({
    preventRunning: true,

    // Skip Barba transition for same-page anchor links (e.g. index.html#process
    // while already on the homepage). The Lenis click handler scrolls to the section.
    prevent: ({ el }) => {
      const href = el.getAttribute('href') || '';
      if (!href.includes('#')) return false;

      const dest = new URL(href, window.location.href);
      return normPath(dest.pathname) === normPath(window.location.pathname);
    },

    transitions: [
      {
        name: 'shutter',

        // ── Leave: cover the old page ──────────────────────────────────────
        async leave({ current }) {
          lenisStop();

          // Fade out current page content and close shutters simultaneously
          await Promise.all([
            gsap.to(current.container, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.in',
            }),
            shutterClose(),
          ]);
        },

        // ── Enter: reveal the new page ────────────────────────────────────
        async enter({ next }) {
          scrollToTop();

          gsap.set(next.container, { opacity: 0 });

          await shutterOpen();

          // Clear GSAP's inline opacity so child elements rely on their own
          // CSS/GSAP states rather than inheriting a parent override
          gsap.set(next.container, { clearProps: 'opacity' });

          lenisStart();

          // Smooth-scroll to hash fragment after transition (e.g. index#process)
          const hash = window.location.hash;
          if (hash) {
            setTimeout(() => {
              const target = document.querySelector(hash);
              if (target) window.RRLenis?.scrollTo(target, { offset: -80, duration: 1.4 });
            }, 120);
          }
        },
      },
    ],

    // ── Views: per-namespace after-enter hooks ────────────────────────────
    views: [
      {
        namespace: 'home',
        afterEnter() {
          reinitWaveHeroes();
          reinitAnimations();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
      {
        namespace: 'services',
        afterEnter() {
          reinitSilkHeroes();
          reinitAnimations();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
      {
        namespace: 'work',
        afterEnter() {
          reinitAnimations();
          initWorkFilters();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
      {
        namespace: 'contact',
        afterEnter() {
          reinitSilkHeroes();
          reinitAnimations();
          reinitContactForm();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
      {
        namespace: 'service',
        afterEnter() {
          reinitAnimations();
          window.RRServicePage?.init();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
      {
        namespace: 'case-study',
        afterEnter() {
          reinitAnimations();
          requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        },
      },
    ],

    // ── Global before hook ────────────────────────────────────────────────
    hooks: {
      before() {
        document.querySelector('.mobile-menu')?.classList.remove('is-open');
        document.querySelector('.nav__hamburger')?.classList.remove('is-open');
        document.body.style.overflow = '';
      },
    },
  });

  // ── Work page: category filters ───────────────────────────────────────────
  function initWorkFilters() {
    const filters = document.querySelectorAll('.work-page__filter');
    const cards   = document.querySelectorAll('[data-category]');
    if (!filters.length) return;

    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((f) => f.classList.remove('is-active'));
        btn.classList.add('is-active');

        const cat = btn.dataset.filter;

        cards.forEach((card) => {
          const show = cat === 'all' || card.dataset.category === cat;
          gsap.to(card, {
            opacity:        show ? 1 : 0.2,
            scale:          show ? 1 : 0.97,
            duration:       0.35,
            ease:           'power2.out',
            pointerEvents:  show ? 'auto' : 'none',
          });
        });
      });
    });
  }

  // ── Contact: multi-select service chips ───────────────────────────────────
  function initChips(selector) {
    document.querySelectorAll(selector).forEach((chip) => {
      // Only add the listener once
      if (chip.dataset.chipBound) return;
      chip.dataset.chipBound = '1';
      chip.addEventListener('click', () => chip.classList.toggle('is-active'));
    });
  }

  // ── Contact: exclusive budget chips ──────────────────────────────────────
  function initBudgetChipsExclusive() {
    const budgetGroup = document.querySelectorAll('.contact-page__chips')[1];
    if (!budgetGroup) return;

    budgetGroup.querySelectorAll('.contact-page__chip').forEach((chip) => {
      if (chip.dataset.exclusiveBound) return;
      chip.dataset.exclusiveBound = '1';
      chip.addEventListener('click', () => {
        budgetGroup.querySelectorAll('.contact-page__chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
      });
    });
  }

  // ── Contact: form submit / reset ──────────────────────────────────────────
  function initContactFormSubmit() {
    const form    = document.querySelector('.contact-page__form');
    const success = document.querySelector('.contact-page__success');
    if (!form || !success) return;
    if (form.dataset.formBound) return;
    form.dataset.formBound = '1';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      gsap.to(form, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: 'power3.in',
        onComplete() {
          form.style.display = 'none';
          success.style.display = 'block';
          gsap.fromTo(success,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
          );
        },
      });
    });

    const resetBtn = document.querySelector('[data-reset-form]');
    if (resetBtn && !resetBtn.dataset.resetBound) {
      resetBtn.dataset.resetBound = '1';
      resetBtn.addEventListener('click', () => {
        form.style.display = '';
        success.style.display = 'none';
        form.reset();
        gsap.fromTo(form, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
      });
    }
  }

  // ── Run on first page load ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initWorkFilters();
    initChips('.contact-page__chip');
    initBudgetChipsExclusive();
    initContactFormSubmit();
  });
})();
