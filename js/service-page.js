/**
 * service-page.js
 * GSAP entrance + scroll animations for service detail sub-pages.
 * Exposes window.RRServicePage so Barba's afterEnter can re-init.
 */

(function () {
  'use strict';

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;

  // ── Sub-nav: slide in + scroll active link into view ─────────────────────
  function initSubnav() {
    const subnav = document.querySelector('.service-subnav');
    if (!subnav) return;

    const active = subnav.querySelector('.is-active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });

    gsap.fromTo(subnav,
      { y: -18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, delay: 0.2, ease: 'power3.out' }
    );
  }

  // ── Hero: num → headline → lede → stats ──────────────────────────────────
  function initHero() {
    const hero = document.querySelector('.svc-hero');
    if (!hero) return;

    const num   = hero.querySelector('.svc-hero__num');
    const hed   = hero.querySelector('.svc-hero__headline');
    const lede  = hero.querySelector('.svc-hero__lede');
    const stats = hero.querySelector('.svc-hero__stats');

    const tl = gsap.timeline({ delay: 0.1 });

    if (num)   tl.to(num,  { opacity: 1, duration: 0.45, ease: 'power2.out' });
    if (hed)   tl.to(hed,  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2');
    if (lede)  tl.to(lede, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45');

    if (stats) {
      tl.to(stats, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.4');
      tl.fromTo(stats.querySelectorAll('.svc-hero__stat-val'),
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.4)' },
        '-=0.35'
      );
    }
  }

  // ── Scroll-triggered section reveals ─────────────────────────────────────
  function initScrollReveals() {
    // Overview columns
    gsap.utils.toArray('.svc-overview__left, .svc-overview__right').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.8, delay: i * 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        }
      );
    });

    // Principle rows
    gsap.utils.toArray('.svc-overview__principle').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });

    // Includes items — staggered from grid trigger
    const includeItems = document.querySelectorAll('.svc-includes__item');
    if (includeItems.length) {
      gsap.to(includeItems, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.svc-includes__grid', start: 'top 80%', once: true },
      });
    }

    // Process steps — sequential stagger
    const steps = document.querySelectorAll('.svc-process__step');
    if (steps.length) {
      gsap.to(steps, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: '.svc-process__steps', start: 'top 82%', once: true },
      });
    }

    // Result stat boxes
    gsap.utils.toArray('.svc-results__stat').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.65, delay: i * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.svc-results__stats', start: 'top 82%', once: true },
        }
      );
    });

    // KPI rows — slide in from left
    gsap.utils.toArray('.svc-results__kpi').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0, duration: 0.5, delay: i * 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }
      );
    });

    // Other service cards
    const otherItems = document.querySelectorAll('.svc-other__item');
    if (otherItems.length) {
      gsap.fromTo(otherItems,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out',
          scrollTrigger: { trigger: '.svc-other__grid', start: 'top 85%', once: true },
        }
      );
    }
  }

  // ── Count-up for [data-count] elements ────────────────────────────────────
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target   = parseFloat(el.dataset.count);
      const prefix   = el.dataset.prefix  || '';
      const suffix   = el.dataset.suffix  || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter() {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate() {
              el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
            },
          });
        },
      });
    });
  }

  // ── Public init ───────────────────────────────────────────────────────────
  function init() {
    initSubnav();
    initScrollReveals();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RRServicePage = { init };
})();
