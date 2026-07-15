// ============================================
// lightcirle — Custom Quote Wizard (quote.html)
// Pure front-end: assembles a pre-filled WhatsApp / Email message.
// No data is stored on the server.
// ============================================
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.SITE_CONFIG || {};
    var waNumber = cfg.whatsappNumber || '8612345678900';
    var emailAddr = cfg.emailAddress || 'inquiry@lightcirle.com';
    var moq = cfg.moq || 50;

    // Track whether the color swatch was actually used
    var colorTouched = false;
    var colorSwatch = document.getElementById('q-color-swatch');
    if (colorSwatch) {
      colorSwatch.addEventListener('input', function () { colorTouched = true; });
    }

    // MOQ hint
    var moqHint = document.getElementById('q-moq-hint');
    if (moqHint) {
      moqHint.textContent = 'Minimum order: ' + moq + ' pcs per style.';
    }

    var panels = Array.prototype.slice.call(document.querySelectorAll('.q-panel'));
    var indicators = Array.prototype.slice.call(document.querySelectorAll('.q-step-indicator'));
    var lines = Array.prototype.slice.call(document.querySelectorAll('.q-step-line'));
    var current = 0;

    function showStep(i) {
      current = i;
      panels.forEach(function (p, idx) {
        p.classList.toggle('hidden', idx !== i);
      });
      indicators.forEach(function (ind, idx) {
        ind.classList.toggle('active', idx === i);
        ind.classList.toggle('completed', idx < i);
      });
      lines.forEach(function (ln, idx) {
        ln.classList.toggle('filled', idx < i);
      });
      if (i === panels.length - 1) buildReview();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Validation ---
    function validateStep(i) {
      var panel = panels[i];
      var required = panel.querySelectorAll('[required]');
      var ok = true;
      required.forEach(function (el) {
        var valid = el.value && el.value.trim() !== '';
        if (el.type === 'email' && valid) {
          valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim());
        }
        if (!valid) {
          el.classList.add('is-error');
          ok = false;
        } else {
          el.classList.remove('is-error');
        }
      });
      if (!ok) {
        var firstErr = panel.querySelector('.is-error');
        if (firstErr) firstErr.focus();
      }
      return ok;
    }

    // Clear error state on input
    document.querySelectorAll('.q-input, .q-select, .q-textarea').forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('is-error'); });
      el.addEventListener('change', function () { el.classList.remove('is-error'); });
    });

    // --- Checkbox visual toggle ---
    document.querySelectorAll('.q-check input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.q-check').classList.toggle('checked', cb.checked);
      });
    });

    // --- Step navigation ---
    document.querySelectorAll('.q-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = parseInt(btn.getAttribute('data-next'), 10);
        if (validateStep(step)) showStep(step + 1);
      });
    });
    document.querySelectorAll('.q-prev').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = parseInt(btn.getAttribute('data-prev'), 10);
        showStep(step - 1);
      });
    });

    // --- Submit to backend (additive; does NOT alter Email/WhatsApp behaviour) ---
    var submitBtn = document.getElementById('q-submit');
    var statusBox = document.getElementById('q-submit-status');
    if (submitBtn && statusBox) {
      submitBtn.addEventListener('click', function () {
        var d = gather();
        var required = ['name', 'company', 'email', 'whatsapp', 'category', 'qty'];
        var missing = required.filter(function (k) { return !String(d[k]).trim(); });
        if (missing.length) {
          statusBox.style.display = 'block';
          statusBox.className = 'q-submit-status err';
          statusBox.textContent = 'Please complete the required fields before submitting.';
          return;
        }
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
        var payload = {
          name: d.name, company: d.company, email: d.email, whatsapp: d.whatsapp,
          category: d.category, qty: d.qty, color: d.color, colorHex: d.colorHex,
          fabric: d.fabric, customization: d.customization, delivery: d.delivery,
          budget: d.budget, notes: d.notes
        };
        fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (!res.ok) return res.json().then(function (j) { throw new Error(j.detail || ('HTTP ' + res.status)); });
            return res.json();
          })
          .then(function () {
            statusBox.style.display = 'block';
            statusBox.className = 'q-submit-status ok';
            statusBox.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Request submitted!</strong> Our team will follow up within 24h. You can also message us directly via WhatsApp or Email below.';
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submitted';
          })
          .catch(function (err) {
            statusBox.style.display = 'block';
            statusBox.className = 'q-submit-status err';
            statusBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Could not reach our server (' + escapeHtml(err.message) + '). Please use WhatsApp or Email below to send your request.';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit to our team';
          });
      });
    }

    // --- Gather data ---
    function gather() {
      var customization = Array.prototype.slice
        .call(document.querySelectorAll('input[name="custom"]:checked'))
        .map(function (c) { return c.value; });
      return {
        name: (document.getElementById('q-name') || {}).value || '',
        company: (document.getElementById('q-company') || {}).value || '',
        email: (document.getElementById('q-email') || {}).value || '',
        whatsapp: (document.getElementById('q-whatsapp') || {}).value || '',
        category: (document.getElementById('q-category') || {}).value || '',
        qty: (document.getElementById('q-qty') || {}).value || '',
        color: (document.getElementById('q-color') || {}).value || '',
        colorHex: (document.getElementById('q-color-swatch') || {}).value || '',
        colorTouched: colorTouched,
        fabric: (document.getElementById('q-fabric') || {}).value || '',
        customization: customization,
        delivery: (document.getElementById('q-delivery') || {}).value || '',
        budget: (document.getElementById('q-budget') || {}).value || '',
        notes: (document.getElementById('q-notes') || {}).value || ''
      };
    }

    function colorLabel(d) {
      if (d.color) {
        return (d.colorTouched && d.colorHex) ? d.color + ' (' + d.colorHex + ')' : d.color;
      }
      if (d.colorTouched && d.colorHex) return d.colorHex;
      return '';
    }

    function buildMessage(d) {
      var L = [];
      L.push('Hi lightcirle! I would like to request a custom quote:');
      L.push('');
      L.push('*Contact*');
      L.push('Name: ' + d.name);
      L.push('Company: ' + d.company);
      L.push('Email: ' + d.email);
      L.push('WhatsApp: ' + d.whatsapp);
      L.push('');
      L.push('*Product Requirements*');
      L.push('Category: ' + d.category);
      L.push('Estimated Quantity: ' + d.qty + ' pcs');
      var cl = colorLabel(d);
      if (cl) L.push('Color: ' + cl);
      if (d.fabric) L.push('Fabric / Style: ' + d.fabric);
      if (d.customization.length) L.push('Customization: ' + d.customization.join(', '));
      L.push('');
      L.push('*Timeline & Notes*');
      if (d.delivery) L.push('Target Delivery: ' + d.delivery);
      if (d.budget) L.push('Budget: ' + d.budget);
      if (d.notes) L.push('Notes: ' + d.notes);
      return L.join('\n');
    }

    function buildReview() {
      var d = gather();
      var review = document.getElementById('q-review');
      if (!review) return;

      function row(label, value) {
        if (!value) return '';
        return '<dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd>';
      }

      var html = '';
      html += '<h4>Contact</h4><dl>';
      html += row('Name', d.name);
      html += row('Company', d.company);
      html += row('Email', d.email);
      html += row('WhatsApp', d.whatsapp);
      html += '</dl>';

      html += '<h4>Product</h4><dl>';
      html += row('Category', d.category);
      html += row('Quantity', d.qty ? d.qty + ' pcs' : '');
      html += row('Color', colorLabel(d));
      html += row('Fabric / Style', d.fabric);
      html += row('Customization', d.customization.join(', '));
      html += '</dl>';

      html += '<h4>Timeline & Notes</h4><dl>';
      html += row('Target Delivery', d.delivery);
      html += row('Budget', d.budget);
      html += row('Notes', d.notes);
      html += '</dl>';

      review.innerHTML = html;

      // Build send links
      var msg = buildMessage(d);
      var waUrl = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg);
      var emailSubject = 'Custom Quote Request — ' + (d.company || 'New Customer');
      var emailUrl = 'mailto:' + emailAddr + '?subject=' + encodeURIComponent(emailSubject) +
        '&body=' + encodeURIComponent(msg);

      var waBtn = document.getElementById('q-whatsapp');
      var emailBtn = document.getElementById('q-email');
      if (waBtn) waBtn.href = waUrl;
      if (emailBtn) emailBtn.href = emailUrl;
    }

    // Initial state
    showStep(0);
  });
})();
