/*
 * animations.js — GSAP-driven motion for aiwritereview.com
 * Methodology: greensock/gsap-skills (gsap-core / gsap-scrolltrigger / gsap-performance)
 * - Transform + opacity only (compositor-friendly, no layout thrash)
 * - Reduced-motion honored; if GSAP fails to load, content stays visible
 * - ScrollTrigger.batch for staggered scroll reveals (replaces "content just appears")
 */
(function () {
  'use strict';
  if (typeof window.gsap === 'undefined') return; // self-hosted lib missing → leave content visible

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // user opted out → content stays visible, no initial hiding

  var hasST = (typeof ScrollTrigger !== 'undefined');
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll reveals (generic; animates only what exists) ---------- */
  if (hasST) {
    var revealSel = '.sec-head, .pain, .about-card, .tcard, .tool, .comp-item, .faq-list details, .cta-band, .mail-card, .stat';
    if (gsap.utils.toArray(revealSel).length) {
      gsap.set(revealSel, { opacity: 0, y: 22 });
      ScrollTrigger.batch(revealSel, {
        start: 'top 85%',
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12, overwrite: true });
        }
      });
    }
  }

  /* ---------- Hero entrance (homepage only) ---------- */
  if (document.querySelector('.hero-copy h1')) {
    var heroSel = '.eyebrow, .hero-copy h1, .hero-copy .sub, .hero-copy .companion-note, .hero-copy .hero-actions, #heroCarousel';
    gsap.set(heroSel, { opacity: 0, y: 18 });
    gsap.timeline({ defaults: { duration: 0.6, ease: 'power3.out' } })
      .to('.eyebrow', { opacity: 1, y: 0 })
      .to('.hero-copy h1', { opacity: 1, y: 0 }, '-=0.35')
      .to('.hero-copy .sub', { opacity: 1, y: 0 }, '-=0.30')
      .to('.hero-copy .companion-note', { opacity: 1, y: 0 }, '-=0.35')
      .to('.hero-copy .hero-actions', { opacity: 1, y: 0 }, '-=0.40')
      .to('#heroCarousel', { opacity: 1, y: 0 }, '-=0.55');
  }

  /* ---------- Ambient pulse on the eyebrow dot ---------- */
  if (document.querySelector('.eyebrow .pulse')) {
    gsap.to('.eyebrow .pulse', {
      scale: 1.5, opacity: 0.5, duration: 1.1, ease: 'sine.inOut',
      repeat: -1, yoyo: true, transformOrigin: 'center center'
    });
  }

  /* ---------- Recompute trigger positions after fonts/images load ---------- */
  if (hasST) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
