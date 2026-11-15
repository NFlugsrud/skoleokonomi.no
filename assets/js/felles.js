/* Felles oppførsel på alle sider: meny, små hjelpere, inn-animasjon og utskrift. */
(function () {
  'use strict';
  var SO = window.SO = window.SO || {};

  // --- Hjelpere ---------------------------------------------------------
  SO.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // Lagring i nettleseren. Kan være avslått (privat modus, åpnet fra disk) – da skjer det bare ingenting.
  SO.lager = {
    hent: function (nokkel) {
      try { var r = window.localStorage.getItem(nokkel); return r ? JSON.parse(r) : null; } catch (feil) { return null; }
    },
    sett: function (nokkel, verdi) {
      try { window.localStorage.setItem(nokkel, JSON.stringify(verdi)); } catch (feil) { /* ikke tilgjengelig */ }
    },
    fjern: function (nokkel) {
      try { window.localStorage.removeItem(nokkel); } catch (feil) { /* ikke tilgjengelig */ }
    }
  };

  var varselEl = null, varselTid = null;
  SO.varsle = function (tekst) {
    if (!varselEl) {
      varselEl = document.createElement('div');
      varselEl.className = 'varsel';
      varselEl.setAttribute('role', 'status');
      document.body.appendChild(varselEl);
    }
    varselEl.textContent = tekst;
    varselEl.hidden = false;
    clearTimeout(varselTid);
    varselTid = setTimeout(function () { varselEl.hidden = true; }, 3500);
  };

  SO.kopier = function (tekst) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(tekst).then(function () { return true; }, function () { return reserve(); });
    }
    return Promise.resolve(reserve());
    function reserve() {
      try {
        var felt = document.createElement('textarea');
        felt.value = tekst;
        felt.setAttribute('readonly', '');
        felt.style.position = 'fixed';
        felt.style.opacity = '0';
        document.body.appendChild(felt);
        felt.select();
        var ok = document.execCommand('copy');
        felt.remove();
        return ok;
      } catch (feil) { return false; }
    }
  };

  SO.redusertBevegelse = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  // --- Meny på små skjermer --------------------------------------------
  var knapp = document.querySelector('.meny-knapp');
  var meny = document.getElementById('hovedmeny');
  if (knapp && meny) {
    var lukk = function (flyttFokus) {
      meny.classList.remove('er-apen');
      knapp.setAttribute('aria-expanded', 'false');
      if (flyttFokus) knapp.focus();
    };
    knapp.addEventListener('click', function () {
      var apen = meny.classList.toggle('er-apen');
      knapp.setAttribute('aria-expanded', String(apen));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && meny.classList.contains('er-apen')) lukk(true);
    });
    meny.addEventListener('click', function (e) { if (e.target.closest('a')) lukk(false); });
    document.addEventListener('click', function (e) {
      if (meny.classList.contains('er-apen') && !e.target.closest('.topp')) lukk(false);
    });
  }

  // --- Årstall i bunnteksten -------------------------------------------
  document.querySelectorAll('[data-ar]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // --- Inn-animasjon (bare når brukeren ikke har bedt om redusert bevegelse) ---
  var inn = document.querySelectorAll('.inn');
  if (inn.length) {
    if ('IntersectionObserver' in window && !SO.redusertBevegelse()) {
      var io = new IntersectionObserver(function (treff) {
        treff.forEach(function (t) {
          if (t.isIntersecting) { t.target.classList.add('er-inne'); io.unobserve(t.target); }
        });
      }, { threshold: 0.08 });
      inn.forEach(function (el) { io.observe(el); });
      // Sikkerhetsnett: innhold skal aldri bli stående usynlig.
      setTimeout(function () { inn.forEach(function (el) { el.classList.add('er-inne'); }); }, 2500);
    } else {
      inn.forEach(function (el) { el.classList.add('er-inne'); });
    }
  }

  // --- Spørsmål og svar: åpne riktig spørsmål når adressen peker på det ---
  function apneFraAnker() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', apneFraAnker);
  apneFraAnker();

  // --- Utskrift: åpne alle sammenfoldede svar, og lukk dem igjen etterpå ---
  var apnetForUtskrift = [];
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details:not([open])').forEach(function (d) { d.open = true; apnetForUtskrift.push(d); });
  });
  window.addEventListener('afterprint', function () {
    apnetForUtskrift.forEach(function (d) { d.open = false; });
    apnetForUtskrift = [];
    document.documentElement.classList.remove('skriv-estimat');
  });
})();
