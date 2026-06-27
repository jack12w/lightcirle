// ============================================
// Yoga B2B — Global JavaScript
// ============================================

// --- Config (pulled from js/config.js as window.SITE_CONFIG) ---
// All settings in js/config.js — single source of truth
const { SITE_CONFIG } = window;
const defaultWhatsAppMsg = encodeURIComponent("Hi! I'm interested in your yoga wear customization services. Can you send me more information?");
const defaultEmailSubject = encodeURIComponent('Yoga Wear Customization Inquiry');

// --- Theme Toggle ---
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('yoga-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.documentElement.classList.remove('dark');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('yoga-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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

// --- Floating Contact Buttons ---
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

// --- Initialize Everything ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavScroll();
  initMobileMenu();
  initFloatingContact();
  initScrollTop();
  initScrollAnimations();
  initCounters();
  setActiveNavLink();
});
