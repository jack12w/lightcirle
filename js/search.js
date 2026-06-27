// ============================================
// Yoga B2B — Search Engine
// ============================================

class SearchEngine {
  constructor(options = {}) {
    this.dataSource = options.dataSource || null;
    this.dataUrl = options.dataUrl || '';
    this.searchInputId = options.searchInputId || 'searchInput';
    this.resultsContainerId = options.resultsContainerId || 'searchResults';
    this.resultCountId = options.resultCountId || 'resultCount';
    this.noResultsId = options.noResultsId || 'noResults';
    this.renderCard = options.renderCard || (() => '');
    this.filterFields = options.filterFields || ['name', 'description', 'title', 'excerpt', 'category', 'tags'];
    this.sortBy = options.sortBy || null;
    this.localData = [];
    this.init();
  }

  async init() {
    if (this.dataSource) {
      this.localData = this.dataSource;
    } else if (this.dataUrl) {
      await this.loadData();
    }
    this.bindEvents();
    this.performSearch();
  }

  async loadData() {
    try {
      const response = await fetch(this.dataUrl);
      this.localData = await response.json();
    } catch (error) {
      console.error('Failed to load search data:', error);
      this.localData = [];
    }
  }

  bindEvents() {
    const input = document.getElementById(this.searchInputId);
    if (input) {
      input.addEventListener('input', () => this.performSearch());
    }
  }

  getQuery() {
    const input = document.getElementById(this.searchInputId);
    if (input) return input.value.toLowerCase().trim();

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('search') || params.get('q') || '';
    if (urlQuery && input) {
      input.value = urlQuery;
      return urlQuery.toLowerCase().trim();
    }
    return '';
  }

  performSearch(externalQuery = null) {
    const query = externalQuery !== null ? externalQuery.toLowerCase().trim() : this.getQuery();
    let results = this.localData;

    if (query) {
      const terms = query.split(/\s+/);
      results = this.localData.filter(item => {
        return terms.every(term => {
          return this.filterFields.some(field => {
            const value = this.getValue(item, field);
            return value && value.toLowerCase().includes(term);
          });
        });
      });
    }

    if (this.sortBy) {
      results = this.sortResults(results);
    }

    this.renderResults(results, query);
    return results;
  }

  getValue(obj, path) {
    if (!obj) return '';
    if (typeof path === 'string') {
      if (path.includes('.')) {
        return path.split('.').reduce((o, k) => (o || {})[k], obj) || '';
      }
      const val = obj[path];
      if (Array.isArray(val)) return val.join(' ');
      return val || '';
    }
    return '';
  }

  sortResults(results) {
    if (this.sortBy === 'date') {
      return results.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return results;
  }

  renderResults(results, query) {
    const container = document.getElementById(this.resultsContainerId);
    const countEl = document.getElementById(this.resultCountId);
    const noResults = document.getElementById(this.noResultsId);

    if (countEl) {
      countEl.textContent = `Showing ${results.length} of ${this.localData.length} ${this.localData.length === 1 ? 'item' : 'items'}`;
    }

    if (results.length === 0 && noResults) {
      noResults.classList.remove('hidden');
      if (container) container.innerHTML = '';
      return;
    }

    if (noResults) noResults.classList.add('hidden');

    if (container) {
      container.innerHTML = results.map(item => this.renderCard(item)).join('');
    }
  }

  // External API to filter by category
  filterByCategory(category) {
    if (!category || category === 'all') {
      return this.performSearch();
    }
    const query = this.getQuery();
    let results = this.localData.filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      return itemCat === category.toLowerCase();
    });
    if (query) {
      const terms = query.split(/\s+/);
      results = results.filter(item => {
        return terms.every(term => {
          return this.filterFields.some(field => {
            const value = this.getValue(item, field);
            return value && value.toLowerCase().includes(term);
          });
        });
      });
    }
    this.renderResults(results, query);
    return results;
  }
}
