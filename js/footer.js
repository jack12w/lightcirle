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

    // Social media "Follow us" links — managed in admin settings (socialLinks).
    // Only platforms with a non-empty URL are shown in the footer.
    var SOCIAL_PLATFORMS = {
      linkedin:  { icon: 'fab fa-linkedin-in', hover: '#0077B5', label: 'LinkedIn' },
      instagram: { icon: 'fab fa-instagram',   hover: '#E4405F', label: 'Instagram' },
      facebook:  { icon: 'fab fa-facebook-f',  hover: '#1877F2', label: 'Facebook' },
      twitter:   { icon: 'fab fa-x-twitter',   hover: '#000000', label: 'X' },
      youtube:   { icon: 'fab fa-youtube',      hover: '#FF0000', label: 'YouTube' },
      pinterest: { icon: 'fab fa-pinterest-p', hover: '#E60023', label: 'Pinterest' },
      tiktok:    { icon: 'fab fa-tiktok',      hover: '#000000', label: 'TikTok' },
    };
    var SOCIAL_ORDER = ['linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'pinterest', 'tiktok'];
    var socialLinks = (cfg.socialLinks && typeof cfg.socialLinks === 'object') ? cfg.socialLinks : {};

    function buildSocialIcons() {
      var parts = [];
      for (var i = 0; i < SOCIAL_ORDER.length; i++) {
        var key = SOCIAL_ORDER[i];
        var url = socialLinks[key];
        if (!url) continue;
        var p = SOCIAL_PLATFORMS[key];
        if (!p) continue;
        parts.push(
          '<a href="' + url + '" target="_blank" rel="noopener" ' +
          'class="footer-social w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-colors" ' +
          'style="--soc-hover:' + p.hover + '" aria-label="' + p.label + '">' +
          '<i class="' + p.icon + '"></i></a>'
        );
      }
      return parts.join('');
    }

    // --- Live contact details straight from SITE_CONFIG (admin settings) ---
    // Read directly here (not via main.js replaceTextContent) so the footer shows
    // the correct contact info regardless of script init order.
    function fmtWhatsApp(raw) {
      var s = (raw || '').replace(/\D/g, '');
      if (!s) return raw;
      if (s.length > 5 && s.indexOf('86') === 0) {
        var rest = s.slice(2);
        if (rest.length === 10) return '+86 ' + rest.slice(0, 4) + ' ' + rest.slice(4, 8) + ' ' + rest.slice(8);
        if (rest.length === 11) return '+86 ' + rest.slice(0, 3) + ' ' + rest.slice(3, 7) + ' ' + rest.slice(7);
        return '+' + s.slice(0, 2) + ' ' + rest;
      }
      return '+' + s;
    }
    var contactEmail = cfg.emailAddress || 'inquiry@lightcirle.com';
    var contactWaNum = (cfg.whatsappNumber || '').replace(/\D/g, '');
    var contactWaDisplay = contactWaNum ? fmtWhatsApp(contactWaNum) : '+86 123 4567 8900';
    var contactLoc = cfg.location || 'Guangzhou, China';
    var contactHours = cfg.businessHours || 'Mon-Sat, 9AM-6PM (GMT+8)';
    var contactCol =
      '<div>' +
        '<h4>Contact</h4>' +
        '<ul class="space-y-2 text-sm">' +
          (contactWaNum ? '<li><a href="https://wa.me/' + contactWaNum + '?text=' + encodeURIComponent('Hi! Interested in your yoga wear customization services.') + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp" style="margin-right:8px;color:#25D366"></i>' + contactWaDisplay + '</a></li>' : '') +
          '<li><a href="mailto:' + contactEmail + '"><i class="fas fa-envelope" style="margin-right:8px"></i>' + contactEmail + '</a></li>' +
          '<li style="display:flex;align-items:flex-start"><i class="fas fa-map-marker-alt" style="margin-right:8px;margin-top:4px"></i><span>' + contactLoc + '</span></li>' +
          '<li style="display:flex;align-items:flex-start"><i class="fas fa-clock" style="margin-right:8px;margin-top:4px"></i><span>' + contactHours + '</span></li>' +
        '</ul>' +
      '</div>';

    var html =
      '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
        '<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">' +
          '<div>' +
            '<h4>' + brand + '</h4>' +
            '<p class="text-sm leading-relaxed">Premium custom yoga wear manufacturer. MOQ 50pcs, factory direct, global shipping.</p>' +
            '<div class="flex gap-3 mt-4">' + buildSocialIcons() + '</div>' +
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
          contactCol +
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
