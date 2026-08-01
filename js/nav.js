/* Shared site navigation — universal module.
 * Mirrors js/footer.js: injects the SAME top nav into every public page via the
 * #mainNav placeholder, so the nav is edited in ONE place. Contact details
 * (WhatsApp / Email) come from window.SITE_CONFIG (js/config.js), which the admin
 * backend can override — no per-page HTML edits needed.
 *
 * NOTE: the <nav id="mainNav" class="nav-glass fixed ..."> placeholder (with its
 * positioning classes) lives in each page; this file only fills its innerHTML.
 * main.js's init functions rely on #mainNav / #mobileMenu / #navSearchInput /
 * .nav-link — all preserved here. This script must load BEFORE main.js so the
 * nav HTML exists when main.js's DOMContentLoaded init runs.
 */
(function () {
  'use strict';

  function initSiteNav() {
    var placeholders = document.querySelectorAll('#mainNav');
    if (!placeholders.length) return;

    var cfg = window.SITE_CONFIG || {};
    var waNum = (cfg.whatsappNumber || '8612345678900').replace(/\D/g, '');
    var email = cfg.emailAddress || 'inquiry@lightcirle.com';
    var waMsg = encodeURIComponent("Hi! I'm interested in your yoga wear customization services.");
    var emailSubject = encodeURIComponent('Yoga Wear Customization Inquiry');
    var waHref = 'https://wa.me/' + waNum + '?text=' + waMsg;
    var mailHref = 'mailto:' + email + '?subject=' + emailSubject;

    var html =
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
        '<div class="flex items-center justify-between h-16 lg:h-20">' +
          // Logo
          '<a href="index.html" class="flex items-center gap-2">' +
            '<span class="text-2xl font-serif font-bold text-primary dark:text-primary-light">lightcirle</span>' +
          '</a>' +

          // Desktop Nav
          '<div class="hidden lg:flex items-center gap-5">' +
            '<form class="nav-search-wrap" onsubmit="window.handleNavSearch(event)">' +
              '<i class="fas fa-search nav-search-icon"></i>' +
              '<input type="text" id="navSearchInput" class="nav-search" placeholder="Search products & articles...">' +
            '</form>' +
            '<a href="index.html" class="nav-link">Home</a>' +
            '<a href="search.html" class="nav-link">Explore</a>' +
            '<a href="quote.html" class="nav-link">Get a Quote</a>' +
            '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn-whatsapp text-sm py-2 px-4" aria-label="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>' +
            '<a href="' + mailHref + '" class="btn-outline text-sm py-2 px-4" aria-label="Email us"><i class="fas fa-envelope"></i></a>' +
            '<button type="button" class="theme-toggle w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme"><i class="fas fa-moon text-lg"></i></button>' +
          '</div>' +

          // Mobile Menu Toggle
          '<div class="flex lg:hidden items-center gap-3">' +
            '<button type="button" class="theme-toggle w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme"><i class="fas fa-moon text-base"></i></button>' +
            '<button type="button" id="mobileMenuToggle" class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Menu"><i class="fas fa-bars text-xl"></i></button>' +
          '</div>' +
        '</div>' +

        // Mobile Menu
        '<div id="mobileMenu" class="hidden flex-col gap-2 pb-4 lg:hidden">' +
          '<form onsubmit="window.handleNavSearch(event)" class="relative px-1">' +
            '<i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>' +
            '<input type="text" id="mobileNavSearchInput" class="search-input text-sm" placeholder="Search products & articles...">' +
          '</form>' +
          '<a href="index.html" class="block px-4 py-3 rounded-lg font-medium text-primary bg-primary/5 dark:bg-primary/10">Home</a>' +
          '<a href="search.html" class="block px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Explore All</a>' +
          '<a href="quote.html" class="block px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Get a Quote</a>' +
          '<div class="flex gap-3 mt-2 px-4">' +
            '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn-whatsapp text-sm py-2 px-4 flex-1 justify-center"><i class="fab fa-whatsapp"></i> WhatsApp</a>' +
            '<a href="' + mailHref + '" class="btn-outline text-sm py-2 px-4 flex-1 justify-center"><i class="fas fa-envelope"></i> Email</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    Array.prototype.forEach.call(placeholders, function (el) {
      el.innerHTML = html;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteNav);
  } else {
    initSiteNav();
  }
})();
