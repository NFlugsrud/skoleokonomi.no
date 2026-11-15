/* Gjennomgangsmodus. Lastes bare så lenge konfig.utkast er true.
   Knappen i utkast-banneret markerer alt som er merket data-bekreft="…" på siden
   og viser en liste over hva som må bekreftes før lansering. */
(function () {
  'use strict';
  var bryter = document.querySelector('[data-bekreft-bryter]');
  var merket = Array.prototype.slice.call(document.querySelectorAll('[data-bekreft]'));
  if (!bryter || !merket.length) return;

  bryter.hidden = false;
  bryter.textContent = 'Vis punkter som må bekreftes (' + merket.length + ')';
  var panel = null;

  function lagPanel() {
    panel = document.createElement('aside');
    panel.className = 'bekreft-panel ikke-skriv';
    panel.setAttribute('aria-label', 'Punkter som må bekreftes');
    var tittel = document.createElement('h2');
    tittel.textContent = 'Må bekreftes på denne siden (' + merket.length + ')';
    var liste = document.createElement('ol');
    merket.forEach(function (el) {
      var li = document.createElement('li');
      var knapp = document.createElement('button');
      knapp.type = 'button';
      knapp.textContent = el.getAttribute('data-bekreft');
      knapp.addEventListener('click', function () {
        var d = el.closest('details');
        if (d) d.open = true;
        el.scrollIntoView({ block: 'center' });
      });
      li.appendChild(knapp);
      liste.appendChild(li);
    });
    panel.appendChild(tittel);
    panel.appendChild(liste);
    document.body.appendChild(panel);
  }

  bryter.addEventListener('click', function () {
    var pa = bryter.getAttribute('aria-pressed') !== 'true';
    bryter.setAttribute('aria-pressed', String(pa));
    document.documentElement.classList.toggle('vis-bekreft', pa);
    if (pa && !panel) lagPanel();
    if (panel) panel.hidden = !pa;
  });
})();
