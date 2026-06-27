// ============================================
// lightcirle — Site Configuration (auto-generated from admin)
// ============================================

window.SITE_CONFIG = {
  brandName: 'lightcirle',
  brandTagline: 'Premium Custom Yoga Wear Manufacturer',
  brandDomain: 'lightcirle.com',
  brandFullDomain: 'https://lightcirle.com',
  colors: {
    primary: '#2d5a3d',
    primaryLight: '#3e7b54',
    primaryDark: '#1f3f2a',
    accent: '#c4926e',
    accentLight: '#d4a88c',
    accentDark: '#A67B5B',
    whatsapp: '#25d366',
    background: '#FAFAF8',
    surface: '#FFFFFF',
    text: '#2C2C2C',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    darkBackground: '#1A1D1C',
    darkSurface: '#252928',
    darkText: '#E8E6E3',
    darkTextMuted: '#9CA3AF',
    darkBorder: '#374151',
  },
  whatsappNumber: '8612345678900',
  emailAddress: 'inquiry@lightcirle.com',
  siteTitle: 'lightcirle | Premium Custom Yoga Wear Manufacturer | MOQ 50pcs',
  siteDescription: 'Factory-direct B2B custom yoga wear manufacturer.',
  moq: 50,
  location: 'Guangzhou, China',
  yearEstablished: 2016,
  countriesShipped: 30,
  faviconPath: '',
};

(function(){var c=window.SITE_CONFIG.colors;window.__TW_COLORS={primary:c.primary,'primary-light':c.primaryLight,'primary-dark':c.primaryDark,accent:c.accent,'accent-light':c.accentLight,'accent-dark':'#A67B5B',whatsapp:c.whatsapp,cream:c.background,darkbg:c.darkBackground,darksurface:c.darksurface};var f=document.querySelector('link[rel*=\"icon\"]')||document.createElement('link');f.rel='icon';var href=window.SITE_CONFIG.faviconPath||'/favicon.svg';f.href=href;if(/\.svg$/i.test(href))f.type='image/svg+xml';else if(/\.png$/i.test(href))f.type='image/png';else if(/\.ico$/i.test(href))f.type='image/x-icon';if(!f.parentNode)document.head.appendChild(f);})();

// ===== JSON-LD Schema Injection =====
window.injectOrganizationSchema = function() {
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'lightcirle',
    url: 'https://lightcirle.com',
    description: 'Premium custom yoga wear manufacturer. MOQ 50pcs, OEM/ODM services, factory-direct pricing.',
    foundingDate: '2016',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-123-4567-8900',
      email: 'inquiry@lightcirle.com',
      contactType: 'sales',
      availableLanguage: ['English']
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Guangzhou',
      addressCountry: 'China'
    }
  });
  document.head.appendChild(s);
};

window.injectWebSiteSchema = function() {
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://lightcirle.com',
    name: 'lightcirle',
    description: 'Premium Custom Yoga Wear Manufacturer | MOQ 50pcs',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://lightcirle.com/search.html?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  });
  document.head.appendChild(s);
};

window.injectBreadcrumbSchema = function(items) {
  if (!items || items.length < 2) return;
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(function(item, i) {
      return { '@type': 'ListItem', position: i + 1, name: item.name, item: 'https://lightcirle.com' + item.url };
    })
  });
  document.head.appendChild(s);
};

window.injectProductSchema = function(product) {
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { '@type': 'Brand', name: 'lightcirle' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description: 'MOQ ' + product.moq + 'pcs. Contact for pricing.'
    }
  });
  document.head.appendChild(s);
};

window.injectArticleSchema = function(article) {
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: article.date,
    dateModified: article.date,
    author: { '@type': 'Organization', name: 'lightcirle' },
    publisher: { '@type': 'Organization', name: 'lightcirle' }
  });
  document.head.appendChild(s);
};

// Auto-inject common schema on page load
document.addEventListener('DOMContentLoaded', function() {
  injectOrganizationSchema();
  injectWebSiteSchema();
});
