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
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const outer = document.querySelector('.cursor-outer');
    const inner = document.querySelector('.cursor-inner');
    if (!outer || !inner) return;

    gsap.set(outer, { xPercent: -50, yPercent: -50 });
    gsap.set(inner, { xPercent: -50, yPercent: -50 });

    const xInner = gsap.quickTo(inner, 'x', { duration: 0.1, ease: 'power3' });
    const yInner = gsap.quickTo(inner, 'y', { duration: 0.1, ease: 'power3' });
    const xOuter = gsap.quickTo(outer, 'x', { duration: 0.45, ease: 'power4' });
    const yOuter = gsap.quickTo(outer, 'y', { duration: 0.45, ease: 'power4' });

    window.addEventListener('mousemove', (e) => {
      xInner(e.clientX); yInner(e.clientY);
      xOuter(e.clientX); yOuter(e.clientY);
    });

    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest('a, button, [data-cursor]');
      if (!el) return;
      const type = el.dataset.cursor || 'link';
      document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-link');
      document.body.classList.add(`cursor-${type}`);
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest('a, button, [data-cursor]');
      if (el) document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-link');
    });
  }

  // ── Split headline into per-char spans ────────────────────────────────────
  // Walks all text nodes in `el`, wrapping each non-whitespace character in a
  // .char span inside an overflow:hidden word-clip wrapper (when useWordClip).
  // Existing .char spans are collected in-place.
  function splitToChars(el, useWordClip) {
    const chars = [];

    function walk(node) {
      if (node.nodeType === 3) { // TEXT_NODE
        const text = node.textContent;
        const frag = document.createDocumentFragment();

        if (useWordClip) {
          // Split by whitespace — each word gets an overflow:hidden wrapper
          text.split(/(\s+)/).forEach((part) => {
            if (/^\s+$/.test(part) || part === '') {
              frag.appendChild(document.createTextNode(part));
            } else {
              const clip = document.createElement('span');
              clip.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
              for (const ch of part) {
                const span = document.createElement('span');
                span.className = 'char';
                span.style.display = 'inline-block';
                span.textContent = ch;
                chars.push(span);
                clip.appendChild(span);
              }
              frag.appendChild(clip);
            }
          });
        } else {
          // No word-clip — relies on parent overflow:hidden (home hero)
          for (const ch of text) {
            if (/\s/.test(ch)) {
              frag.appendChild(document.createTextNode(ch));
            } else {
              const span = document.createElement('span');
              span.className = 'char';
              span.style.display = 'inline-block';
              span.textContent = ch;
              chars.push(span);
              frag.appendChild(span);
            }
          }
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) { // ELEMENT_NODE
        if (node.classList.contains('char')) {
          chars.push(node); // already split — collect as-is
        } else {
          Array.from(node.childNodes).forEach(walk);
        }
      }
    }

    Array.from(el.childNodes).forEach(walk);
    return chars;
  }

  // ── Home hero entrance ────────────────────────────────────────────────────
  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const eyebrow  = hero.querySelector('.hero__eyebrow');
    const headline = hero.querySelector('.hero__headline');
    const body     = hero.querySelector('.hero__body');
    const ctas     = hero.querySelector('.hero__ctas');
    const strip    = hero.querySelector('.hero__footer-strip');

    // Explicitly set initial states so Barba re-entries start clean
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 20 });
    if (body)    gsap.set(body,    { opacity: 0, y: 20 });
    if (ctas)    gsap.set(ctas,    { opacity: 0, y: 20 });
    if (strip)   gsap.set(strip,   { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.8 }, 0.3);

    if (headline) {
      const allChars = splitToChars(headline, false);
      if (allChars.length) {
        gsap.set(allChars, { y: '110%' });
        tl.to(allChars, { y: 0, duration: 1.2, stagger: 0.018, ease: 'power4.out' }, 0.5);
      }
    }

    if (body)  tl.to(body,  { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 1.0);
    if (ctas)  tl.to(ctas,  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.15);
    if (strip) tl.to(strip, { opacity: 1,        duration: 1,   ease: 'power2.out' }, 1.3);

    return tl;
  }

  // ── Services page hero entrance ───────────────────────────────────────────
  function initServicesHero() {
    const hero = document.querySelector('.services-page__hero');
    if (!hero) return;

    const eyebrow  = hero.querySelector('.eyebrow');
    const headline = hero.querySelector('.services-page__hero-headline');
    const sub      = hero.querySelector('.services-page__hero-sub');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) {
      gsap.set(eyebrow, { opacity: 0, x: -20 });
      tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.3);
    }

    if (headline) {
      const chars = splitToChars(headline, true);
      if (chars.length) {
        gsap.set(chars, { y: '110%' });
        tl.to(chars, { y: 0, duration: 1.1, stagger: 0.016, ease: 'power4.out' }, 0.45);
      }
    }

    if (sub) {
      gsap.set(sub, { opacity: 0, y: 20 });
      tl.to(sub, { opacity: 1, y: 0, duration: 0.8 }, 1.0);
    }

    return tl;
  }

  // ── Work page hero entrance ───────────────────────────────────────────────
  function initWorkHero() {
    const hero = document.querySelector('.work-page__hero');
    if (!hero) return;

    const eyebrow  = hero.querySelector('.eyebrow');
    const headline = hero.querySelector('.work-page__headline');
    const sub      = hero.querySelector('.work-page__sub');
    const filters  = hero.querySelector('.work-page__filters');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) {
      gsap.set(eyebrow, { opacity: 0, x: -20 });
      tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.2);
    }

    if (headline) {
      const chars = splitToChars(headline, true);
      if (chars.length) {
        gsap.set(chars, { y: '110%' });
        tl.to(chars, { y: 0, duration: 1.1, stagger: 0.016, ease: 'power4.out' }, 0.3);
      }
    }

    if (sub) {
      gsap.set(sub, { opacity: 0, y: 20 });
      tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, 0.9);
    }

    if (filters) {
      const btns = filters.querySelectorAll('.work-page__filter');
      if (btns.length) {
        gsap.set(btns, { opacity: 0, y: 10 });
        tl.to(btns, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 }, 1.1);
      }
    }

    return tl;
  }

  // ── Contact page hero entrance ────────────────────────────────────────────
  function initContactHero() {
    const headline = document.querySelector('.contact-page__headline');
    if (!headline) return;

    const eyebrow = document.querySelector('.contact-page .eyebrow');
    const intro   = document.querySelector('.contact-page__intro');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) {
      gsap.set(eyebrow, { opacity: 0, x: -20 });
      tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.3);
    }

    const chars = splitToChars(headline, true);
    if (chars.length) {
      gsap.set(chars, { y: '110%' });
      tl.to(chars, { y: 0, duration: 1.1, stagger: 0.016, ease: 'power4.out' }, 0.45);
    }

    if (intro) {
      gsap.set(intro, { opacity: 0, y: 20 });
      tl.to(intro, { opacity: 1, y: 0, duration: 0.7 }, 1.0);
    }

    return tl;
  }

  // ── Case study page hero entrance ─────────────────────────────────────────
  function initCaseHero() {
    const hero = document.querySelector('.case-hero');
    if (!hero) return;

    const eyebrow  = hero.querySelector('.case-hero__eyebrow');
    const headline = hero.querySelector('.case-hero__headline');
    const sub      = hero.querySelector('.case-hero__sub');
    const kpis     = hero.querySelectorAll('.case-hero__kpi');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (eyebrow) {
      gsap.set(eyebrow, { opacity: 0, x: -20 });
      tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.2);
    }

    if (headline) {
      const chars = splitToChars(headline, true);
      if (chars.length) {
        gsap.set(chars, { y: '110%' });
        tl.to(chars, { y: 0, duration: 1.1, stagger: 0.018, ease: 'power4.out' }, 0.35);
      }
    }

    if (sub) {
      gsap.set(sub, { opacity: 0, y: 20 });
      tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, 0.9);
    }

    if (kpis.length) {
      gsap.set(kpis, { opacity: 0, y: 24, scale: 0.96 });
      tl.to(kpis, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' }, 1.0);
    }

    return tl;
  }

  // ── Scroll reveal factory ─────────────────────────────────────────────────
  function createScrollReveal(selector, animProps, triggerProps) {
    document.querySelectorAll(selector).forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50, ...animProps.from },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power4.out',
          ...animProps.to,
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none', ...triggerProps },
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
        opacity: 1, y: 0, duration: 0.8, stagger: staggerVal || 0.08, ease: 'power4.out',
        scrollTrigger: { trigger: parent || els[0].parentElement, start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }

  // ── Stats counter ─────────────────────────────────────────────────────────
  function initCounters() {
    document.querySelectorAll('[data-counter]').forEach((el) => {
      const raw = el.dataset.counter;
      const hasPlus    = raw.includes('+');
      const hasMinus   = raw.includes('−') || raw.includes('-');
      const hasTimes   = raw.includes('×');
      const hasDollar  = raw.includes('$');
      const hasPercent = raw.includes('%');
      const num    = parseFloat(raw.replace(/[^0-9.]/g, ''));
      const obj    = { val: 0 };

      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter() {
          gsap.to(obj, {
            val: num, duration: 2, ease: 'power2.out',
            onUpdate() {
              const v = obj.val;
              let display;
              if (v >= 1000)           display = (v / 1000).toFixed(1).replace('.0', '') + 'M';
              else if (Number.isInteger(num)) display = Math.round(v).toString();
              else                     display = v.toFixed(1);
              el.textContent =
                (hasPlus ? '+' : '') + (hasMinus ? '−' : '') + (hasDollar ? '$' : '') +
                display + (hasTimes ? '×' : '') + (hasPercent ? '%' : '');
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
        yPercent: speed * -50, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
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
          opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
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
        opacity: 1, y: 0, duration: 0.7, stagger: { each: 0.07, grid: 'auto', from: 'start' }, ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none none' },
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
          opacity: 1, y: 0, duration: 0.9, delay: i * 0.1, ease: 'power4.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    });
  }

  // ── Work page case cards ──────────────────────────────────────────────────
  function initWorkCards() {
    document.querySelectorAll('.work-page__case').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8, delay: (i % 3) * 0.1, ease: 'power4.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
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
        opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: document.querySelector('.process__steps'), start: 'top 82%', toggleActions: 'play none none none' },
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
        opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.1, ease: 'power4.out',
        scrollTrigger: { trigger: document.querySelector('.pricing__grid'), start: 'top 82%', toggleActions: 'play none none none' },
      }
    );
  }

  // ── Quote section ─────────────────────────────────────────────────────────
  function initQuote() {
    const q = document.querySelector('.quote__text');
    if (!q) return;
    gsap.fromTo(q, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: q, start: 'top 85%' } });
  }

  // ── CTA headline ─────────────────────────────────────────────────────────
  function initCTA() {
    const h = document.querySelector('.cta-footer__headline');
    if (!h) return;
    gsap.fromTo(h, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  }

  // ── Magnetic buttons ──────────────────────────────────────────────────────
  function initMagneticButtons() {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const strength = parseFloat(btn.dataset.magnetic || '0.35');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width  / 2) * strength;
        const dy = (e.clientY - rect.top  - rect.height / 2) * strength;
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

    let lastY = 0, lastDir = 0;
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
        document.querySelectorAll('.faq__item.is-open').forEach((other) => {
          other.classList.remove('is-open');
          gsap.to(other.querySelector('.faq__answer'), { maxHeight: 0, duration: 0.4, ease: 'power3.inOut' });
        });
        if (!isOpen) {
          item.classList.add('is-open');
          const inner    = answer.querySelector('.faq__answer-inner');
          const targetH  = inner ? inner.scrollHeight + 32 : 240;
          gsap.fromTo(answer, { maxHeight: 0 }, { maxHeight: targetH, duration: 0.45, ease: 'power3.out' });
        }
      });
    });
  }

  // ── Service sub-page hero entrance ───────────────────────────────────────
  function initSvcHero() {
    const hero = document.querySelector('.svc-hero');
    if (!hero) return;

    const num   = hero.querySelector('.svc-hero__num');
    const hed   = hero.querySelector('.svc-hero__headline');
    const lede  = hero.querySelector('.svc-hero__lede');
    const stats = hero.querySelector('.svc-hero__stats');

    // Explicitly force initial states so Barba re-entry starts clean
    if (num)   gsap.set(num,   { opacity: 0 });
    if (hed)   gsap.set(hed,   { opacity: 0, y: 32 });
    if (lede)  gsap.set(lede,  { opacity: 0, y: 20 });
    if (stats) gsap.set(stats, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ delay: 0.1 });

    if (num)  tl.to(num,  { opacity: 1, duration: 0.45, ease: 'power2.out' });
    if (hed)  tl.to(hed,  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2');
    if (lede) tl.to(lede, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45');

    if (stats) {
      tl.to(stats, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.4');
      tl.fromTo(
        stats.querySelectorAll('.svc-hero__stat-val'),
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.4)' },
        '-=0.35'
      );
    }
  }

  // ── Services mega-menu dropdown ──────────────────────────────────────────
  function initServicesDropdown() {
    document.querySelectorAll('.nav__dropdown').forEach((dropdown) => {
      let closeTimer;

      dropdown.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        dropdown.classList.add('is-open');
      });

      dropdown.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => dropdown.classList.remove('is-open'), 150);
      });
    });
  }

  // ── Mobile menu with stagger entrance ────────────────────────────────────
  function initMobileMenu() {
    const menu     = document.querySelector('.mobile-menu');
    const closeBtn = document.querySelector('.mobile-menu__close');
    if (!menu) return;

    const listItems = menu.querySelectorAll('.mobile-menu__links li');

    // Start with items invisible so first open can animate them in
    gsap.set(listItems, { opacity: 0, x: -40 });

    function closeMenu() {
      menu.classList.remove('is-open');
      document.querySelectorAll('.nav__hamburger').forEach((b) => b.classList.remove('is-open'));
      document.body.style.overflow = '';
      // Reset so next open re-animates
      gsap.set(listItems, { opacity: 0, x: -40 });
    }

    document.querySelectorAll('.nav__hamburger').forEach((toggle) => {
      if (toggle.dataset.menuBound) return;
      toggle.dataset.menuBound = '1';

      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        document.querySelectorAll('.nav__hamburger').forEach((b) => b.classList.toggle('is-open', open));
        document.body.style.overflow = open ? 'hidden' : '';

        if (open) {
          // Stagger links in after menu slide begins (menu CSS transition is 0.6s)
          gsap.fromTo(
            listItems,
            { opacity: 0, x: -40 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power4.out', delay: 0.28 }
          );
        }
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
          opacity: 1, y: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: cell, start: 'top 88%', toggleActions: 'play none none none' },
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
        opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(2)',
        scrollTrigger: { trigger: pin, start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }

  // ── Main init ─────────────────────────────────────────────────────────────
  function init() {
    ScrollTrigger.getAll().forEach((st) => st.kill());

    // Hero entrances (each checks for its own elements)
    initHero();
    initServicesHero();
    initWorkHero();
    initContactHero();
    initCaseHero();
    initSvcHero();

    // Scroll reveals
    initEyebrows();
    initServiceCards();
    initCaseCards();
    initWorkCards();
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

    createScrollReveal(
      '.services__headline, .cases__headline, .process__headline, .pricing__headline, .studio__headline, .faq__headline, .stats__headline',
      {}, {}
    );

    // Defer refresh to next frame so the browser finishes layout before
    // ScrollTrigger calculates trigger positions (critical after Barba swaps DOM)
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  // ── Export ────────────────────────────────────────────────────────────────
  window.RRAnimations = { init, initCursor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initCursor(); initServicesDropdown(); init(); });
  } else {
    initCursor();
    initServicesDropdown();
    init();
  }
})();
