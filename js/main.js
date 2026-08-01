// ============================================
// Yoga B2B — Global JavaScript
// ============================================

// --- Config (pulled from js/config.js as window.SITE_CONFIG) ---
// All settings in js/config.js — single source of truth
const { SITE_CONFIG } = window;
const defaultWhatsAppMsg = encodeURIComponent("Hi! I'm interested in your yoga wear customization services. Can you send me more information?");
const defaultEmailSubject = encodeURIComponent('Yoga Wear Customization Inquiry');

// --- Theme Toggle ---
// Bound to ALL .theme-toggle buttons (desktop + mobile) so both stay in sync.
function initTheme() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  const savedTheme = localStorage.getItem('yoga-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  document.documentElement.classList.toggle('dark', isDark);
  toggles.forEach(function (t) {
    t.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });

  toggles.forEach(function (t) {
    t.addEventListener('click', function () {
      const nowDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('yoga-theme', nowDark ? 'dark' : 'light');
      toggles.forEach(function (x) {
        x.innerHTML = nowDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    });
  });
}

// --- Navbar Scroll Effect ---
function initNavScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  });
}

// --- Mobile Menu Toggle ---
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('hidden');
    if (isOpen) {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
      toggle.innerHTML = '<i class="fas fa-times text-xl"></i>';
    } else {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      toggle.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    }
  });

  // Close menu when clicking a link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      toggle.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    });
  });
}

// --- Dynamic Site Contact Info ---
// Replaces hardcoded contact details (email, WhatsApp) with live SITE_CONFIG values.
// This ensures the footer, header mailto links, and CTA sections always reflect
// the current admin settings without requiring HTML changes on every page.
function initSiteContact() {
  if (!window.SITE_CONFIG) return;

  const cfg = SITE_CONFIG;
  const email = cfg.emailAddress || 'inquiry@lightcirle.com';
  // Format WhatsApp: strip leading + if present in config, then reformat for display
  const waRaw = cfg.whatsappNumber || '';
  const waDisplay = waRaw ? formatWhatsApp(waRaw) : '+86 123 4567 8900';

  // 1) Fix all mailto: hrefs that still point to the old default email
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
    const href = a.getAttribute('href');
    if (href && href.indexOf('inquiry@lightcirle.com') !== -1) {
      a.setAttribute('href', href.replace('inquiry@lightcirle.com', email));
    }
  });

  // 2) Fix displayed email text (footer, etc.)
  replaceTextContent(document.body, 'inquiry@lightcirle.com', email);

  // 3) Fix displayed WhatsApp default number
  replaceTextContent(document.body, '+86 123 4567 8900', waDisplay);

  // 4) Fix displayed location (footer) — backend "所在位置" now drives this
  const loc = cfg.location || 'Guangzhou, China';
  replaceTextContent(document.body, 'Guangzhou, China', loc);

  // 5) Fix displayed business hours (footer) — backend "营业时间" now drives this
  const hours = cfg.businessHours || 'Mon-Sat, 9AM-6PM (GMT+8)';
  replaceTextContent(document.body, 'Mon-Sat, 9AM-6PM (GMT+8)', hours);

  // 6) Fix clickable WhatsApp links (wa.me/...) so they use the live number,
  //    not the hardcoded default in each page's footer/CTA.
  const waNum = (cfg.whatsappNumber || '').replace(/\D/g, '');
  if (waNum) {
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function(a) {
      const href = a.getAttribute('href') || '';
      a.setAttribute('href', href.replace(/wa\.me\/\d+/, 'wa.me/' + waNum));
    });
  }
}

// Helper: format raw WhatsApp number for display (e.g. "8612345678900" → "+86 123 4567 8900")
function formatWhatsApp(raw) {
  var s = (raw || '').replace(/\D/g, ''); // digits only
  if (!s) return raw;
  if (s.length > 5 && s.startsWith('86')) {
    // China format: +86 XXXX XXXX XXXX or +86 XXX XXXX XXXX
    var rest = s.slice(2);
    if (rest.length === 10) return '+86 ' + rest.slice(0,4) + ' ' + rest.slice(4,8) + ' ' + rest.slice(8);
    if (rest.length === 11) return '+86 ' + rest.slice(0,3) + ' ' + rest.slice(3,7) + ' ' + rest.slice(7);
    return '+' + s.slice(0,2) + ' ' + rest;
  }
  // Generic: insert space every 4 digits from right
  var f = '+' + s;
  return f.replace(/(\d{1,4})(?=(\d{4})+$)/g, '$1 ');
}

// Helper: safely replace exact text content in text nodes (not inside tags/attributes)
function replaceTextContent(root, target, replacement) {
  if (!target || target === replacement) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  var nodes = [];
  while (walker.nextNode()) { if (walker.currentNode.nodeValue.indexOf(target) !== -1) nodes.push(walker.currentNode); }
  nodes.forEach(function(n) { n.nodeValue = n.nodeValue.split(target).join(replacement); });
}
function initFloatingContact() {
  const container = document.getElementById('floatingContact');
  if (!container) return;

  container.innerHTML = `
    <a href="https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${defaultWhatsAppMsg}" 
       target="_blank" rel="noopener" 
       class="floating-whatsapp" 
       aria-label="Chat on WhatsApp">
      <i class="fab fa-whatsapp"></i>
      <span class="floating-label">Chat on WhatsApp</span>
    </a>
    <a href="mailto:${SITE_CONFIG.emailAddress}?subject=${defaultEmailSubject}" 
       class="floating-email" 
       aria-label="Send Email">
      <i class="fas fa-envelope"></i>
      <span class="floating-label">Send us an Email</span>
    </a>
  `;
}

// --- Scroll to Top ---
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Animate on Scroll ---
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// --- Counter Animation ---
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * eased);
    el.textContent = current.toLocaleString() + (el.getAttribute('data-suffix') || '');
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter-value').forEach(el => {
    observer.observe(el);
  });
}

// --- Set Active Nav Link ---
function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// --- WhatsApp/Email Link Generator ---
window.getWhatsAppLink = function(message) {
  const msg = message || defaultWhatsAppMsg;
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(decodeURIComponent(msg))}`;
};

window.getEmailLink = function(subject, body) {
  const subj = subject || defaultEmailSubject;
  const bdy = body ? `&body=${encodeURIComponent(body)}` : '';
  return `mailto:${SITE_CONFIG.emailAddress}?subject=${encodeURIComponent(decodeURIComponent(subj))}${bdy}`;
};

// --- Nav Search Handler ---
window.handleNavSearch = function(e) {
  e.preventDefault();
  const input = document.getElementById('navSearchInput') || document.getElementById('mobileNavSearchInput');
  if (input && input.value.trim()) {
    window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
  }
};

// --- Sticky Contact Bar (site-wide contact-first CTA) ---
function initStickyContact() {
  if (!window.SITE_CONFIG) return;
  const bar = document.createElement('div');
  bar.id = 'stickyContactBar';
  bar.className = 'sticky-contact-bar';
  const wa = 'https://wa.me/' + SITE_CONFIG.whatsappNumber + '?text=' + defaultWhatsAppMsg;
  const email = 'mailto:' + SITE_CONFIG.emailAddress + '?subject=' + defaultEmailSubject;
  // Mobile-only Call button uses the WhatsApp number as a tel: target (native dialer)
  const telDigits = (SITE_CONFIG.whatsappNumber || '').replace(/\D/g, '');
  const telHref = telDigits ? 'tel:+' + telDigits : 'tel:+8612345678900';
  bar.innerHTML =
    '<div class="sticky-contact-inner">' +
      '<div class="sticky-contact-trust"><i class="fab fa-whatsapp"></i><span>Typically replies within <b>2 hours</b></span></div>' +
      '<div class="sticky-contact-actions">' +
        '<a class="sticky-btn sticky-btn-email" href="' + email + '"><i class="fas fa-envelope"></i><span>Email</span></a>' +
        '<a class="sticky-btn sticky-btn-quote" href="quote.html"><i class="fas fa-file-invoice"></i><span>Quote</span></a>' +
        '<a class="sticky-btn sticky-btn-call" href="' + telHref + '"><i class="fas fa-phone"></i><span>Call</span></a>' +
        '<a class="sticky-btn sticky-btn-wa" href="' + wa + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i><span>WhatsApp</span></a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(bar);

  // Let product pages deepen the CTA with the product name
  window.setStickyProduct = function(name, image) {
    if (!name) return;
    const waLink = bar.querySelector('.sticky-btn-wa');
    const quoteLink = bar.querySelector('.sticky-btn-quote');
    const msg = encodeURIComponent("Hi! I'm interested in " + name);
    if (waLink) waLink.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.whatsappNumber + '?text=' + msg);
    if (quoteLink) {
      let href = 'quote.html?product=' + encodeURIComponent(name);
      if (image) href += '&image=' + encodeURIComponent(image);
      quoteLink.setAttribute('href', href);
    }
  };

  // Reveal with a gentle slide-in
  setTimeout(function() {
    bar.classList.add('visible');
    document.body.classList.add('has-sticky-bar');
  }, 600);

  // The sticky bar replaces the floating circles (same CTAs, less clutter)
  const fc = document.getElementById('floatingContact');
  if (fc) fc.style.display = 'none';
  const st = document.getElementById('scrollTopBtn');
  if (st) st.style.bottom = '76px';
}

// --- Lightbox (image zoom modal) ---
// Global image gallery viewer. Call openLightbox(images, startIndex) from any element.
// - images: array of {src, alt} or string URLs
// - startIndex: which image to show first
// Closes on: × button, click on backdrop, Esc key. Body scroll locked while open.
function ensureLightboxDom() {
  if (document.getElementById('globalLightbox')) return;
  var wrap = document.createElement('div');
  wrap.id = 'globalLightbox';
  wrap.className = 'lightbox';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close"><i class="fas fa-xmark"></i></button>' +
    '<button type="button" class="lightbox-arrow lightbox-prev" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>' +
    '<button type="button" class="lightbox-arrow lightbox-next" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>' +
    '<div class="lightbox-stage"><img class="lightbox-img" alt=""></div>' +
    '<div class="lightbox-counter"></div>';
  document.body.appendChild(wrap);
  // close on backdrop click (anywhere not on the image/arrows)
  wrap.addEventListener('click', function(e) {
    if (e.target.closest('.lightbox-img') || e.target.closest('.lightbox-arrow') || e.target.closest('.lightbox-close')) return;
    closeLightbox();
  });
  wrap.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  wrap.querySelector('.lightbox-prev').addEventListener('click', function(e) { e.stopPropagation(); lightboxPrev(); });
  wrap.querySelector('.lightbox-next').addEventListener('click', function(e) { e.stopPropagation(); lightboxNext(); });
  // keyboard
  document.addEventListener('keydown', function(e) {
    var lb = document.getElementById('globalLightbox');
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lightboxPrev();
    else if (e.key === 'ArrowRight') lightboxNext();
  });
}
function _lbNormalize(arr) {
  return (arr || []).map(function(x) {
    return typeof x === 'string' ? { src: x, alt: '' } : { src: x.src, alt: x.alt || '' };
  }).filter(function(x) { return x.src; });
}
window.openLightbox = function(images, startIndex) {
  ensureLightboxDom();
  window.__lightboxImages = _lbNormalize(images);
  if (!window.__lightboxImages.length) return;
  window.__lightboxIndex = Math.max(0, Math.min(startIndex || 0, window.__lightboxImages.length - 1));
  var lb = document.getElementById('globalLightbox');
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  _lbRender();
};
window.closeLightbox = function() {
  var lb = document.getElementById('globalLightbox');
  if (!lb) return;
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
};
window.lightboxPrev = function() {
  if (!window.__lightboxImages || !window.__lightboxImages.length) return;
  window.__lightboxIndex = (window.__lightboxIndex - 1 + window.__lightboxImages.length) % window.__lightboxImages.length;
  _lbRender();
};
window.lightboxNext = function() {
  if (!window.__lightboxImages || !window.__lightboxImages.length) return;
  window.__lightboxIndex = (window.__lightboxIndex + 1) % window.__lightboxImages.length;
  _lbRender();
};
function _lbRender() {
  var lb = document.getElementById('globalLightbox');
  if (!lb) return;
  var item = window.__lightboxImages[window.__lightboxIndex];
  var img = lb.querySelector('.lightbox-img');
  img.src = item.src;
  img.alt = item.alt;
  // hide arrows if single image
  var single = window.__lightboxImages.length <= 1;
  lb.querySelector('.lightbox-prev').style.display = single ? 'none' : '';
  lb.querySelector('.lightbox-next').style.display = single ? 'none' : '';
  // counter
  lb.querySelector('.lightbox-counter').textContent =
    window.__lightboxImages.length > 1
      ? (window.__lightboxIndex + 1) + ' / ' + window.__lightboxImages.length
      : '';
}

// --- Generic arrow-driven carousel initializer ---
// Wires up a carousel with: prev/next buttons, clickable dots, touch swipe.
// Requires the root element to contain:
//   .fc-track        — flex track of slides
//   .fc-arrow-prev   — left arrow button
//   .fc-arrow-next   — right arrow button
//   .fc-dots         — container of dot buttons (any children are activated)
//   .fc-slide        — individual slides
// Data attribute on root: data-slides-per-view="4" (default 4) controls visible count.
// Each .fc-slide can have data-zoom-src="..." to make clicking it open the lightbox
// with all sibling .fc-slide images.
function initCarousel(root) {
  if (!root || root.dataset.carouselReady === '1') return;
  root.dataset.carouselReady = '1';
  var track = root.querySelector('.fc-track');
  var prevBtn = root.querySelector('.fc-arrow-prev');
  var nextBtn = root.querySelector('.fc-arrow-next');
  var dotsWrap = root.querySelector('.fc-dots');
  var slides = root.querySelectorAll('.fc-slide');
  if (!track || !slides.length) return;
  var total = slides.length;
  var spv = parseInt(root.dataset.slidesPerView || '4', 10);
  var loop = root.dataset.loop === '1';
  var maxIndex = Math.max(0, total - spv);
  var current = 0;
  // Build dots if not present
  if (dotsWrap && !dotsWrap.children.length) {
    for (var d = 0; d <= maxIndex; d++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'fc-dot' + (d === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (d + 1));
      dot.addEventListener('click', (function(idx) { return function() { goTo(idx); }; })(d));
      dotsWrap.appendChild(dot);
    }
  }
  function getSlidePct() { return 100 / spv; }
  function update() {
    track.style.transform = 'translateX(-' + (current * getSlidePct()) + '%)';
    if (dotsWrap) {
      var ds = dotsWrap.querySelectorAll('.fc-dot');
      for (var i = 0; i < ds.length; i++) ds[i].classList.toggle('is-active', i === current);
    }
    // disable arrows at edges unless loop
    if (prevBtn) prevBtn.disabled = !loop && current <= 0;
    if (nextBtn) nextBtn.disabled = !loop && current >= maxIndex;
    root.dataset.currentIndex = current;
  }
  function goTo(i) {
    if (loop) {
      current = ((i % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
    } else {
      current = Math.max(0, Math.min(i, maxIndex));
    }
    update();
  }
  if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });
  // Touch swipe
  var startX = 0, startY = 0, dragging = false, startTime = 0;
  track.addEventListener('touchstart', function(e) {
    if (!e.touches[0]) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    startTime = Date.now();
    track.style.transition = 'none';
  }, { passive: true });
  track.addEventListener('touchmove', function(e) {
    if (!dragging || !e.touches[0]) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
  }, { passive: false });
  track.addEventListener('touchend', function(e) {
    if (!dragging) return;
    dragging = false;
    track.style.transition = '';
    var t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t) return;
    var dx = t.clientX - startX;
    var dt = Date.now() - startTime;
    // swipe threshold: 40px or fast flick
    if (Math.abs(dx) > 40 || (Math.abs(dx) > 20 && dt < 250)) {
      if (dx < 0) goTo(current + 1);
      else goTo(current - 1);
    } else {
      update(); // snap back
    }
  });
  // Click on slide → lightbox (if slide has data-zoom-src OR has an <img>)
  track.addEventListener('click', function(e) {
    var slide = e.target.closest('.fc-slide');
    if (!slide) return;
    // Skip if click is on an internal control
    if (e.target.closest('a, button')) return;
    var images = [];
    var startIndex = 0;
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var src = s.dataset.zoomSrc || (s.querySelector('img') && s.querySelector('img').src) || '';
      var alt = (s.querySelector('img') && s.querySelector('img').alt) || '';
      if (!src) continue;
      images.push({ src: src, alt: alt });
      if (s === slide) startIndex = images.length - 1;
    }
    if (images.length) window.openLightbox(images, startIndex);
  });
  update();
}
// Expose for inline / dynamic init from page scripts
window.initCarousel = initCarousel;

// --- Initialize Everything ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavScroll();
  initMobileMenu();
  initFloatingContact();
  initStickyContact();
  initScrollTop();
  initScrollAnimations();
  initCounters();
  setActiveNavLink();
  initSiteContact();
});
