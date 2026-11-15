/* Prissiden: fyller inn satsene og regneeksemplene fra PRISMODELL, slik at teksten
   aldri kan komme i utakt med kalkulatoren. */
(function () {
  'use strict';
  var P = (window.SO || {}).pris;
  if (!P) return;
  var M = P.PRISMODELL;

  document.querySelectorAll('[data-sats]').forEach(function (el) {
    el.textContent = P.sats(M[el.getAttribute('data-sats')]) + (el.getAttribute('data-enhet') || '');
  });

  document.querySelectorAll('[data-typefaktorer]').forEach(function (el) {
    el.textContent = P.TYPER.map(function (t) {
      return t.navn + ' ' + P.faktorTekst(M.typeFaktor[t.id]);
    }).join(' · ');
  });

  document.querySelectorAll('[data-eksempel]').forEach(function (el) {
    var d = el.getAttribute('data-eksempel').split('.');
    var tilstand = { enheter: [{ type: d[0], ansatte: d[1], elever: d[2] }], arsoppgjor: true, lonn: false };
    var r = P.beregn(tilstand);
    var pris = document.createElement('p');
    pris.innerHTML = '<span class="eksempel__mnd"></span><br><span class="eksempel__ar"></span>';
    pris.querySelector('.eksempel__mnd').textContent = P.kr(r.mnd) + ' per måned';
    pris.querySelector('.eksempel__ar').textContent = P.kr(r.ar) + ' per år med årsoppgjør';
    var lenke = document.createElement('a');
    lenke.className = 'pil';
    lenke.href = 'priser.html?' + P.kod(tilstand) + '#kalkulator';
    lenke.textContent = 'Åpne i kalkulatoren';
    var fot = document.createElement('p');
    fot.style.marginTop = '1rem';
    fot.appendChild(lenke);
    el.appendChild(pris);
    el.appendChild(fot);
  });
})();
