/**
 * gsap-animations.js
 * GSAP + ScrollTrigger animations for Roc & Rose Digital.
 * Runs after Barba.js calls the enter hook so it re-fires on page transitions.
 */

(function () {
  'use strict';

  const { gsap } = window;
  const { ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.warn('[R&R] GSAP or ScrollTrigger not loaded.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ── Custom cursor ──────────────────────────────────────────────────────────
  function initCursor() {
    // Skip on touch / pointer-coarse devices (phones, tablets)
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const outer = document.querySelector('.cursor-outer');
    const inner = document.querySelector('.cursor-inner');
    if (!outer || !inner) return;

    // Center the cursors on the pointer (xPercent/yPercent persists alongside x/y)
    gsap.set(outer, { xPercent: -50, yPercent: -50 });
    gsap.set(inner, { xPercent: -50, yPercent: -50 });

    // Quick follower for the dot
    const xInner = gsap.quickTo(inner, 'x', { duration: 0.1, ease: 'power3' });
    const yInner = gsap.quickTo(inner, 'y', { duration: 0.1, ease: 'power3' });

    // Laggy follower for the ring
    const xOuter = gsap.quickTo(outer, 'x', { duration: 0.45, ease: 'power4' });
    const yOuter = gsap.quickTo(outer, 'y', { duration: 0.45, ease: 'power4' });

    window.addEventListener('mousemove', (e) => {
      xInner(e.clientX);
      yInner(e.clientY);
      xOuter(e.clientX);
      yOuter(e.clientY);
    });

    // Hover states
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest('a, button, [data-cursor]');
      if (!el) return;
      const type = el.dataset.cursor || 'link';
      document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-link');
      document.body.classList.add(`cursor-${type}`);
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest('a, button, [data-cursor]');
      if (el) {
        document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-link');
      }
    });
  }

  // ── Split text into chars ──────────────────────────────────────────────────
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.style.overflow = 'visible';

    // Split by words, then chars within words
    const words = text.split(' ');
    words.forEach((word, wi) => {
      const wordWrap = document.createElement('span');
      wordWrap.className = 'split-word';
      wordWrap.style.cssText = 'display:inline-block; overflow:hidden; vertical-align:bottom;';

      const wordInner = document.createElement('span');
      wordInner.className = 'split-word-inner';
      wordInner.style.cssText = 'display:inline-block;';

      word.split('').forEach((char) => {
        const span = document.createElement('span');
        span.className = 'split-char';
        span.style.cssText = 'display:inline-block; will-change:transform;';
        span.textContent = char;
        wordInner.appendChild(span);
      });

      wordWrap.appendChild(wordInner);
      el.appendChild(wordWrap);

      if (wi < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });

    return el.querySelectorAll('.split-char');
  }

  // ── Hero entrance ─────────────────────────────────────────────────────────
  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const eyebrow = hero.querySelector('.hero__eyebrow');
    const headline = hero.querySelector('.hero__headline');
    const body     = hero.querySelector('.hero__body');
    const ctas     = hero.querySelector('.hero__ctas');
    const strip    = hero.querySelector('.hero__footer-strip');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) {
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.8 }, 0.3);
    }

    if (headline) {
      // Split headline chars and animate stagger
      const allChars = [];
      headline.querySelectorAll('.char').forEach(c => allChars.push(c));

      if (allChars.length) {
        tl.to(allChars, {
          y: 0,
          duration: 1.2,
          stagger: 0.02,
          ease: 'power4.out',
        }, 0.5);
      }
    }

    if (body) {
      tl.to(body, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 1.0);
    }

    if (ctas) {
      tl.to(ctas, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.15);
    }

    if (strip) {
      tl.to(strip, { opacity: 1, duration: 1, ease: 'power2.out' }, 1.3);
    }

    return tl;
  }

  // ── Scroll reveal factory ─────────────────────────────────────────────────
  function createScrollReveal(selector, animProps, triggerProps) {
    const els = document.querySelectorAll(selector);
    els.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50, ...animProps.from },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power4.out',
          ...animProps.to,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            ...triggerProps,
          },
        }
      );
    });
  }

  // ── Staggered grid reveal ─────────────────────────────────────────────────
  function staggerReveal(parent, children, staggerVal) {
    const els = document.querySelectorAll(children);
    if (!els.length) return;

    gsap.fromTo(
      els,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: staggerVal || 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: parent || els[0].parentElement,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // ── Stats counter ─────────────────────────────────────────────────────────
  function initCounters() {
    document.querySelectorAll('[data-counter]').forEach((el) => {
      const raw = el.dataset.counter;
      const hasPlus  = raw.includes('+');
      const hasMinus = raw.includes('−') || raw.includes('-');
      const hasTimes = raw.includes('×');
      const hasDollar = raw.includes('$');
      const hasPercent = raw.includes('%');

      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      const suffix = raw.replace(/[0-9.]/g, '').trim();

      const obj = { val: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter() {
          gsap.to(obj, {
            val: num,
            duration: 2,
            ease: 'power2.out',
            onUpdate() {
              const v = obj.val;
              let display;
              if (v >= 1000) {
                display = (v / 1000).toFixed(1).replace('.0', '') + 'M';
              } else if (Number.isInteger(num)) {
                display = Math.round(v).toString();
              } else {
                display = v.toFixed(1);
              }
              el.textContent = (hasPlus ? '+' : '') + (hasMinus ? '−' : '') + (hasDollar ? '$' : '') + display + (hasTimes ? '×' : '') + (hasPercent ? '%' : '');
            },
          });
        },
      });
    });
  }

  // ── Parallax sections ─────────────────────────────────────────────────────
  function initParallax() {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax || '0.3');
      gsap.to(el, {
        yPercent: speed * -50,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5, // smoothing delay in seconds — far cheaper than scrub: true
        },
      });
    });
  }

  // ── Section eyebrows ──────────────────────────────────────────────────────
  function initEyebrows() {
    document.querySelectorAll('.eyebrow:not(.hero__eyebrow)').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  // ── Service cards stagger ─────────────────────────────────────────────────
  function initServiceCards() {
    const grid = document.querySelector('.services__grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.service-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: { each: 0.07, grid: 'auto', from: 'start' },
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // ── Case cards ────────────────────────────────────────────────────────────
  function initCaseCards() {
    document.querySelectorAll('.case-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: i * 0.1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  // ── Process steps ─────────────────────────────────────────────────────────
  function initProcessSteps() {
    const steps = document.querySelectorAll('.process__step');
    if (!steps.length) return;
    gsap.fromTo(
      steps,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: document.querySelector('.process__steps'),
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // ── Pricing cards ─────────────────────────────────────────────────────────
  function initPricingCards() {
    const cards = document.querySelectorAll('.price-card');
    if (!cards.length) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 50, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: document.querySelector('.pricing__grid'),
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // ── Quote section ─────────────────────────────────────────────────────────
  function initQuote() {
    const q = document.querySelector('.quote__text');
    if (!q) return;
    gsap.fromTo(
      q,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: q, start: 'top 85%' },
      }
    );
  }

  // ── CTA headline ─────────────────────────────────────────────────────────
  function initCTA() {
    const h = document.querySelector('.cta-footer__headline');
    if (!h) return;
    gsap.fromTo(
      h,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: h, start: 'top 88%' },
      }
    );
  }

  // ── Magnetic buttons ──────────────────────────────────────────────────────
  function initMagneticButtons() {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const strength = parseFloat(btn.dataset.magnetic || '0.35');

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // ── Sticky nav ────────────────────────────────────────────────────────────
  function initStickyNav() {
    const nav = document.querySelector('.nav--sticky');
    if (!nav) return;

    let lastY = 0;
    let lastDir = 0; // only write to DOM when scroll direction changes
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate(self) {
        const y   = self.scroll();
        const dir = y > lastY ? 1 : -1;

        if (y > 80) {
          nav.classList.add('is-visible');
          if (dir !== lastDir) {
            nav.style.transform = dir === 1 ? 'translateY(-100%)' : 'translateY(0)';
            lastDir = dir;
          }
        } else {
          nav.classList.remove('is-visible');
        }
        lastY = y;
      },
    });
  }

  // ── FAQ accordion ────────────────────────────────────────────────────────
  function initFAQ() {
    document.querySelectorAll('.faq__item').forEach((item) => {
      const trigger = item.querySelector('.faq__trigger');
      const answer  = item.querySelector('.faq__answer');
      if (!trigger || !answer) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close all
        document.querySelectorAll('.faq__item.is-open').forEach((other) => {
          other.classList.remove('is-open');
          gsap.to(other.querySelector('.faq__answer'), {
            maxHeight: 0,
            duration: 0.4,
            ease: 'power3.inOut',
          });
        });

        // Open clicked
        if (!isOpen) {
          item.classList.add('is-open');
          const inner = answer.querySelector('.faq__answer-inner');
          const targetH = inner ? inner.scrollHeight + 32 : 240;
          gsap.fromTo(
            answer,
            { maxHeight: 0 },
            { maxHeight: targetH, duration: 0.45, ease: 'power3.out' }
          );
        }
      });
    });
  }

  // ── Mobile menu ──────────────────────────────────────────────────────────
  function initMobileMenu() {
    const menu     = document.querySelector('.mobile-menu');
    const closeBtn = document.querySelector('.mobile-menu__close');
    if (!menu) return;

    function closeMenu() {
      menu.classList.remove('is-open');
      document.querySelectorAll('.nav__hamburger').forEach((b) => b.classList.remove('is-open'));
      document.body.style.overflow = '';
    }

    // Bind every hamburger on the page — sticky nav + in-page header.
    // The sticky nav button persists across Barba transitions; the in-page one
    // is replaced each time, so check per-element to avoid double-binding.
    document.querySelectorAll('.nav__hamburger').forEach((toggle) => {
      if (toggle.dataset.menuBound) return;
      toggle.dataset.menuBound = '1';

      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        document.querySelectorAll('.nav__hamburger').forEach((b) => b.classList.toggle('is-open', open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
    });

    if (closeBtn && !closeBtn.dataset.closeBound) {
      closeBtn.dataset.closeBound = '1';
      closeBtn.addEventListener('click', closeMenu);
    }

    menu.querySelectorAll('.mobile-menu__link').forEach((link) => {
      if (link.dataset.menuLinkBound) return;
      link.dataset.menuLinkBound = '1';
      link.addEventListener('click', closeMenu);
    });
  }

  // ── Stats section ────────────────────────────────────────────────────────
  function initStats() {
    document.querySelectorAll('.stats__cell').forEach((cell, i) => {
      gsap.fromTo(
        cell,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cell,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  // ── Studio map pin ────────────────────────────────────────────────────────
  function initStudioMap() {
    const pin = document.querySelector('.studio__map-pin');
    if (!pin) return;
    gsap.fromTo(
      pin,
      { opacity: 0, scale: 0.5, y: -20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(2)',
        scrollTrigger: {
          trigger: pin,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  // ── Main init ─────────────────────────────────────────────────────────────
  function init() {
    // Kill all existing ScrollTriggers (important on Barba transitions)
    ScrollTrigger.getAll().forEach((st) => st.kill());

    // Run all init functions
    initHero();
    initEyebrows();
    initServiceCards();
    initCaseCards();
    initProcessSteps();
    initPricingCards();
    initQuote();
    initCTA();
    initMagneticButtons();
    initStickyNav();
    initFAQ();
    initMobileMenu();
    initStats();
    initCounters();
    initParallax();
    initStudioMap();

    // Generic reveals
    createScrollReveal('.services__headline, .cases__headline, .process__headline, .pricing__headline, .studio__headline, .faq__headline, .cta-footer__headline, .stats__headline', {}, {});

    ScrollTrigger.refresh();
  }

  // ── Export ────────────────────────────────────────────────────────────────
  window.RRAnimations = { init, initCursor };

  // Auto-init on first load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCursor();
      init();
    });
  } else {
    initCursor();
    init();
  }
})();
