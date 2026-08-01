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
