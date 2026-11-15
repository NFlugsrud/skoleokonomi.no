/* Enkelt søkefilter for lister (ordliste, spørsmål og svar).
   <input data-filter-for="liste-id"> filtrerer elementene merket [data-post] i listen,
   og kan kombineres med kategoriknapper [data-kategori-for="liste-id"]. */
(function () {
  'use strict';

  function normaliser(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }

  document.querySelectorAll('[data-filter-for]').forEach(function (felt) {
    var id = felt.getAttribute('data-filter-for');
    var liste = document.getElementById(id);
    if (!liste) return;
    var poster = Array.prototype.slice.call(liste.querySelectorAll('[data-post]'));
    var knapper = Array.prototype.slice.call(document.querySelectorAll('[data-kategori-for="' + id + '"]'));
    var status = document.querySelector('[data-filter-status="' + id + '"]');
    var kategori = '';

    function oppdater() {
      var sok = normaliser(felt.value);
      var treff = 0;
      poster.forEach(function (post) {
        var passer = (!sok || normaliser(post.textContent).indexOf(sok) >= 0) &&
          (!kategori || post.getAttribute('data-post') === kategori);
        post.hidden = !passer;
        if (passer) treff++;
      });
      // Skjul gruppeoverskrifter som ikke har noen synlige poster under seg.
      liste.querySelectorAll('[data-gruppe]').forEach(function (gruppe) {
        gruppe.hidden = !gruppe.querySelector('[data-post]:not([hidden])');
      });
      if (status) {
        status.textContent = !sok && !kategori ? '' : treff === 0 ? 'Ingen treff. Prøv et annet ord.' : treff === 1 ? '1 treff' : treff + ' treff';
      }
    }

    felt.addEventListener('input', oppdater);
    knapper.forEach(function (knapp) {
      knapp.addEventListener('click', function () {
        kategori = knapp.getAttribute('data-kategori') || '';
        knapper.forEach(function (k) { k.setAttribute('aria-pressed', String(k === knapp)); });
        oppdater();
      });
    });
  });
})();
