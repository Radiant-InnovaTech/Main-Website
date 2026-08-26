/* ============================================================
   RADIANT NEXUS — GLOBAL BEHAVIOR  (v2, 2026)
   Single source of truth for motion, nav, icons, counters.
   Loaded on every page (deferred). Progressive-enhancement:
   the .js class on <html> is what activates scroll-reveal.
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js'); // belt-and-braces (a head inline also sets this to avoid FOUC)

  /* ----------------------------------------------------------
     1. SVG ICON SPRITE  — usage: <svg class="ic"><use href="#i-shield"/></svg>
     ---------------------------------------------------------- */
  var ICONS = {
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-ur': '<path d="M7 17 17 7M8 7h9v9"/>',
    'check': '<path d="M5 12l4.5 4.5L19 7"/>',
    'x': '<path d="M6 6l12 12M18 6 6 18"/>',
    'play': '<path d="M7 5l12 7-12 7z"/>',
    'shield': '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z"/>',
    'shield-check': '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    'brain': '<path d="M12 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3M12 5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3M9 8H7a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2M15 8h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2"/>',
    'cpu': '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9z" opacity=".5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    'database': '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    'eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    'link': '<path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 11a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    'layers': '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',
    'scan': '<path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"/><circle cx="12" cy="12" r="3"/>',
    'search': '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/>',
    'bolt': '<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
    'lock': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'cloud': '<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.5 9 3.5 3.5 0 0 1 17 18H7z"/>',
    'key': '<circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M18 18l2-2"/>',
    'server': '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    'network': '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M11 13l-4.5 4M13 13l4.5 4"/>',
    'alert': '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
    'activity': '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    'branch': '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-3 4.5-6 5.5"/>',
    'users': '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M16 5.5a3 3 0 0 1 0 5.6M21 20c0-2.6-1.6-4.2-4-4.7"/>',
    'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'chart': '<path d="M4 4v16h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    'gauge': '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
    'fingerprint': '<path d="M12 11a2 2 0 0 0-2 2c0 2 .5 4 1 5M12 4a8 8 0 0 0-8 8c0 2 .5 3.5 1 5M20 12a8 8 0 0 0-8-8M16 12a4 4 0 0 0-4-4 4 4 0 0 0-4 4c0 3 1 6 1.5 7M16 12c0 3-.5 5-1 7"/>',
    'terminal': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    'globe': '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
    'building': '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
    'workflow': '<rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/><path d="M6.5 10v3.5a2 2 0 0 0 2 2H14"/>',
    'plug': '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v5"/>',
    'doc': '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'sparkles': '<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z"/>',
    'radar': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5" opacity=".5"/><path d="M12 12l6-3"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    'crosshair': '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    'rotate': '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/>',
    'bell': '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
    'phone': '<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'pin': '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'target': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>'
  };
  function buildSprite() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    var defs = '';
    for (var k in ICONS) {
      if (Object.prototype.hasOwnProperty.call(ICONS, k)) {
        defs += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>';
      }
    }
    svg.innerHTML = defs;
    if (document.body.firstChild) document.body.insertBefore(svg, document.body.firstChild);
    else document.body.appendChild(svg);
  }

  /* ----------------------------------------------------------
     2. NAV — scroll state + active link + mobile toggle
     ---------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector('nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    // active link by filename
    var current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (href && href === current) link.classList.add('active');
    });
    // mobile toggle (supports #navToggle or .nav-toggle, with inline onclick fallback)
    var toggle = document.getElementById('navToggle') || document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        var spans = toggle.querySelectorAll('span');
        if (spans.length === 3) {
          spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
          spans[1].style.opacity = open ? '0' : '1';
          spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
        }
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); });
      });
    }
  }

  /* ----------------------------------------------------------
     3. SCROLL REVEAL + STAGGER + SVG DRAW
     ---------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger, .draw');
    if (!('IntersectionObserver' in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        // trigger any counters / bars inside
        e.target.querySelectorAll && e.target.querySelectorAll('[data-count]').forEach(animateCount);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     4. COUNTERS  — data-count="94.7" data-suffix="%"  OR legacy .stat-val/.hpm-val
     ---------------------------------------------------------- */
  function animateCount(el) {
    if (el.dataset.counted) return; el.dataset.counted = '1';
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var decimals = (String(el.dataset.count).split('.')[1] || '').length;
    var dur = 1300, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + (Number.isInteger(target) ? target : target.toFixed(decimals)) + suffix;
    }
    requestAnimationFrame(tick);
  }
  function initLegacyCounters() {
    var statVals = document.querySelectorAll('.stat-val, .hpm-val');
    if (!statVals.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, raw = el.textContent.trim();
        var num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (isNaN(num) || num === 0) return;
        var suffix = raw.replace(/[0-9.]/g, ''), dur = 1200, steps = 40, step = 0;
        var int = setInterval(function () {
          step++; var prog = step / steps, eased = 1 - Math.pow(1 - prog, 3), cur = num * eased;
          el.textContent = (cur % 1 === 0 || cur >= 10 ? Math.round(cur) : cur.toFixed(1)) + suffix;
          if (step >= steps) { el.textContent = raw; clearInterval(int); }
        }, dur / steps);
      });
    }, { threshold: 0.5 });
    statVals.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     5. PROGRESS BARS  — animate width on scroll
     ---------------------------------------------------------- */
  function initBars() {
    var bars = document.querySelectorAll('.hp-fill, .mc-fill, .inv-conf-fill, .pab-fill, [data-bar]');
    if (!bars.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = el.dataset.bar ? el.dataset.bar + '%' : el.style.width;
        el.style.width = '0%';
        el.style.transition = 'width 1.3s cubic-bezier(0.4,0,0.2,1)';
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.width = target; }); });
        io.unobserve(el);
      });
    }, { threshold: 0.3 });
    bars.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     6. SIMPLE DEMO FORM (legacy #contactForm / #submitBtn)
        (contact.html ships its own real fetch handler.)
     ---------------------------------------------------------- */
  function initDemoForm() {
    var form = document.getElementById('contactForm');
    var submitBtn = document.getElementById('submitBtn');
    if (!form || !submitBtn) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.textContent = '✓ Request received — we will be in touch within 24 hours';
      submitBtn.style.background = '#1FD498';
      submitBtn.style.color = '#04140e';
      submitBtn.disabled = true;
      setTimeout(function () {
        submitBtn.textContent = 'Request Demo';
        submitBtn.style.background = '';
        submitBtn.style.color = '';
        submitBtn.disabled = false;
        form.reset();
      }, 6000);
    });
  }

  /* ---------------------------------------------------------- */
  function boot() {
    buildSprite();
    initNav();
    initReveal();
    initLegacyCounters();
    initBars();
    initDemoForm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
