/* Årshjulet: tegner frister per måned med filter, «neste frister» og kalendereksport.
   Brukes på arshjul.html ([data-arshjul]) og på forsiden ([data-neste-frister]). */
(function () {
  'use strict';
  var SO = window.SO || {};
  var F = SO.frister;
  var data = SO.fristdata;
  if (!F || !data) return;

  var FRISTER = data.FRISTER;
  var esc = SO.esc;
  var NOKKEL = 'so.arshjul.filter';
  var GJELDER = { alle: 'Alle', skole: 'Private skoler', barnehage: 'Private barnehager' };
  var i_dag = new Date();

  function stor(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function omDager(n) { return n === 0 ? 'i dag' : n === 1 ? 'i morgen' : 'om ' + n + ' dager'; }

  function nesteHtml(antall, filter) {
    return F.neste(FRISTER, i_dag, antall, filter).map(function (x) {
      return '<li class="hovedbok__rad"><p class="hovedbok__nokkel">' + esc(F.datoTekst(x.dato)) + ' · ' + omDager(F.dagerTil(x.dato, i_dag)) + '</p>' +
        '<p class="hovedbok__tekst"><strong>' + esc(x.frist.tittel) + '</strong>' +
        (x.frist.gjelder !== 'alle' ? ' <span class="merkelapp">' + GJELDER[x.frist.gjelder] + '</span>' : '') +
        '<br>' + esc(x.frist.beskrivelse) + '</p></li>';
    }).join('');
  }

  // Forsiden: en kort liste over de neste fristene.
  document.querySelectorAll('[data-neste-frister]').forEach(function (liste) {
    liste.innerHTML = nesteHtml(Number(liste.getAttribute('data-neste-frister')) || 4, 'alle');
    var seksjon = liste.closest('section');
    if (seksjon) seksjon.hidden = false;
  });

  var rot = document.querySelector('[data-arshjul]');
  if (!rot) return;

  var filter = SO.lager.hent(NOKKEL);
  if (!GJELDER[filter]) filter = 'alle';

  rot.innerHTML =
    '<div class="arshjul__verktoy ikke-skriv">' +
      '<div class="brikker" role="group" aria-label="Vis frister for">' +
        Object.keys(GJELDER).map(function (k) {
          return '<button type="button" class="brikke" data-filter="' + k + '" aria-pressed="' + (k === filter) + '">' + GJELDER[k] + '</button>';
        }).join('') +
      '</div>' +
      '<button type="button" class="knapp knapp--kant knapp--liten" data-ics>Legg fristene i kalenderen (.ics)</button>' +
    '</div>' +
    '<h2 class="arshjul__tittel">Neste frister</h2><ol class="hovedbok" data-neste></ol>' +
    '<h2 class="arshjul__tittel">Faste frister</h2><ul class="hovedbok" data-manedlig></ul>' +
    '<h2 class="arshjul__tittel">Året måned for måned</h2><ol class="maneder" data-maneder></ol>';

  function fristHtml(x) {
    var f = x.frist;
    return '<li class="frist"><span class="frist__dag">' + x.dag + '.</span><div><p class="frist__tittel">' + esc(f.tittel) +
      (f.gjelder !== 'alle' ? ' <span class="merkelapp">' + GJELDER[f.gjelder] + '</span>' : '') + '</p>' +
      '<p class="frist__tekst">' + (f.gjentak.type === 'arlig' ? esc(f.beskrivelse) + ' ' : '') +
      '<a href="' + esc(f.kilde.url) + '" rel="noopener">Kilde: ' + esc(f.kilde.navn) + '</a></p></div></li>';
  }

  function tegn() {
    rot.querySelector('[data-neste]').innerHTML = nesteHtml(4, filter);
    rot.querySelector('[data-manedlig]').innerHTML = FRISTER.filter(function (f) {
      return f.gjentak.type !== 'arlig' && F.gjelder(f, filter);
    }).map(function (f) {
      return '<li class="hovedbok__rad"><p class="hovedbok__nokkel">' + esc(stor(f.nar)) + '</p><p class="hovedbok__tekst"><strong>' + esc(f.tittel) + '</strong><br>' +
        esc(f.beskrivelse) + ' <a href="' + esc(f.kilde.url) + '" rel="noopener">Kilde: ' + esc(f.kilde.navn) + '</a></p></li>';
    }).join('');
    rot.querySelector('[data-maneder]').innerHTML = F.MANEDER.map(function (navn, i) {
      var treff = F.iMnd(FRISTER, i + 1, filter, false);
      var na = i === i_dag.getMonth();
      return '<li class="maned' + (na ? ' maned--na' : '') + '"><h3 class="maned__navn">' + stor(navn) +
        (na ? ' <span class="maned__na">denne måneden</span>' : '') + '</h3>' +
        (treff.length ? '<ul class="maned__liste">' + treff.map(fristHtml).join('') + '</ul>' : '<p class="maned__tom">Ingen årlige frister.</p>') + '</li>';
    }).join('');
    rot.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter));
    });
  }

  rot.addEventListener('click', function (e) {
    var knapp = e.target.closest('button');
    if (!knapp) return;
    if (knapp.hasAttribute('data-filter')) {
      filter = knapp.getAttribute('data-filter');
      SO.lager.sett(NOKKEL, filter);
      tegn();
    } else if (knapp.hasAttribute('data-ics')) {
      var blob = new Blob([F.ics(FRISTER, i_dag.getFullYear(), filter)], { type: 'text/calendar;charset=utf-8' });
      var lenke = document.createElement('a');
      lenke.href = URL.createObjectURL(blob);
      lenke.download = 'frister-' + filter + '.ics';
      document.body.appendChild(lenke);
      lenke.click();
      lenke.remove();
      setTimeout(function () { URL.revokeObjectURL(lenke.href); }, 1000);
      SO.varsle('Kalenderfilen er lastet ned. Åpne den for å legge fristene i kalenderen.');
    }
  });

  tegn();
})();
