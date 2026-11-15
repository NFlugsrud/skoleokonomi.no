/* Sjekklister som husker avkrysningene i nettleseren. Brukes med [data-sjekkliste="navn"]. */
(function () {
  'use strict';
  var SO = window.SO || {};
  if (!SO.lager) return;

  document.querySelectorAll('[data-sjekkliste]').forEach(function (rot) {
    var nokkel = 'so.sjekkliste.' + rot.getAttribute('data-sjekkliste');
    var bokser = Array.prototype.slice.call(rot.querySelectorAll('input[type="checkbox"][data-id]'));
    var tekst = rot.querySelector('[data-fremdrift-tekst]');
    var fyll = rot.querySelector('[data-fremdrift-fyll]');
    var lagret = SO.lager.hent(nokkel) || {};

    bokser.forEach(function (b) { b.checked = lagret[b.getAttribute('data-id')] === true; });

    function oppdater() {
      var ferdig = bokser.filter(function (b) { return b.checked; }).length;
      if (tekst) tekst.textContent = ferdig + ' av ' + bokser.length + ' punkter';
      if (fyll) fyll.style.width = (bokser.length ? Math.round(ferdig / bokser.length * 100) : 0) + '%';
    }

    rot.addEventListener('change', function (e) {
      if (!e.target.matches('input[type="checkbox"][data-id]')) return;
      var tilstand = {};
      bokser.forEach(function (b) { if (b.checked) tilstand[b.getAttribute('data-id')] = true; });
      SO.lager.sett(nokkel, tilstand);
      oppdater();
    });

    rot.addEventListener('click', function (e) {
      var knapp = e.target.closest('button');
      if (!knapp) return;
      if (knapp.hasAttribute('data-sjekk-skriv')) window.print();
      if (knapp.hasAttribute('data-sjekk-nullstill')) {
        bokser.forEach(function (b) { b.checked = false; });
        SO.lager.fjern(nokkel);
        oppdater();
        SO.varsle('Sjekklisten er nullstilt.');
      }
    });

    oppdater();
  });
})();
