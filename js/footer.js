/* Shared site footer — universal module.
 * Injects the same footer into every public page via the #siteFooter placeholder,
 * so the footer is edited in ONE place. Contact details come from window.SITE_CONFIG
 * (js/config.js), which the admin backend can override — no per-page HTML edits needed.
 */
(function () {
  'use strict';

  function initSiteFooter() {
    var placeholders = document.querySelectorAll('#siteFooter');
    if (!placeholders.length) return;

    var cfg = window.SITE_CONFIG || {};
    var brand = cfg.brandName || 'lightcirle';
    var email = cfg.emailAddress || 'inquiry@lightcirle.com';
    var waNum = (cfg.whatsappNumber || '8612345678900').replace(/\D/g, '');
    var waHref = 'https://wa.me/' + waNum;
    var waMsg = encodeURIComponent("Hi! I'm interested in your yoga wear.");

    var html =
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
        '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">' +
          '<div>' +
            '<h4>' + brand + '</h4>' +
            '<p class="text-sm leading-relaxed">Premium custom yoga wear manufacturer. MOQ 50pcs, factory direct, global shipping.</p>' +
            '<div class="flex gap-3 mt-4">' +
              '<a href="' + waHref + '?text=' + waMsg + '" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-whatsapp transition-colors" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>' +
              '<a href="mailto:' + email + '" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors" aria-label="Email"><i class="fas fa-envelope"></i></a>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h4>Products</h4>' +
            '<ul class="space-y-2">' +
              '<li><a href="search.html?tab=yoga-pants">yoga-pants</a></li>' +
              '<li><a href="search.html?tab=sports-bras">sports-bras</a></li>' +
              '<li><a href="search.html?tab=yoga-outerwear">yoga-outerwear</a></li>' +
              '<li><a href="search.html?tab=hoodies">hoodies</a></li>' +
              '<li><a href="search.html?tab=sets">sets</a></li>' +
              '<li><a href="search.html?tab=seamless">seamless</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h4>Resources</h4>' +
            '<ul class="space-y-2">' +
              '<li><a href="search.html?tab=blog">Blog</a></li>' +
              '<li><a href="search.html?tab=blog">fabric-knowledge</a></li>' +
              '<li><a href="search.html?tab=blog">business-tips</a></li>' +
              '<li><a href="shipping.html">Shipping Info</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h4>Policies</h4>' +
            '<ul class="space-y-2 text-sm">' +
              '<li><a href="privacy.html">Privacy Policy</a></li>' +
              '<li><a href="terms.html">Terms of Service</a></li>' +
              '<li><a href="shipping.html">Shipping &amp; Returns</a></li>' +
              '<li><a href="sustainability.html">Sustainability</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<p>&copy; 2026 ' + brand + '. Premium Custom Yoga Wear Manufacturer. All rights reserved.</p>' +
        '</div>' +
      '</div>';

    Array.prototype.forEach.call(placeholders, function (el) {
      el.innerHTML = html;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteFooter);
  } else {
    initSiteFooter();
  }
})();
