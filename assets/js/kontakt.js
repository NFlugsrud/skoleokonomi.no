/* Kontaktskjemaet. Nettstedet har ingen server ennå, så skjemaet validerer feltene og lager en
   ferdig utfylt e-post i brukerens eget e-postprogram. Ved lansering kan sendingen byttes til et
   ekte endepunkt ved å endre funksjonen `send` under. */
(function () {
  'use strict';
  var SO = window.SO || {};
  var P = SO.pris;
  var skjema = document.querySelector('[data-kontaktskjema]');
  if (!skjema) return;

  var k = SO.konfig || {};
  var epost = k.epost || 'post@skoleøkonomi.no';
  var sammendrag = skjema.querySelector('[data-feilsammendrag]');
  var resultat = document.querySelector('[data-kontakt-resultat]');
  var estimatBoks = skjema.querySelector('[data-estimat]');
  var estimatMed = skjema.querySelector('[data-estimat-med]');
  var estimatLinjer = [];

  // Estimatet kommer med i lenken fra kalkulatoren, eller hentes fra det som er lagret i nettleseren.
  if (P && estimatBoks) {
    var tilstand = P.dekod(window.location.search) || (SO.lager.hent('so.kalkulator.v1') ? P.rens(SO.lager.hent('so.kalkulator.v1')) : null);
    if (tilstand) {
      estimatLinjer = P.oppsummering(tilstand);
      var liste = skjema.querySelector('[data-estimat-linjer]');
      estimatLinjer.forEach(function (linje) {
        var li = document.createElement('li');
        li.textContent = linje;
        liste.appendChild(li);
      });
      estimatBoks.hidden = false;
    }
  }

  function verdi(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function valider() {
    var feil = [];
    skjema.querySelectorAll('[required]').forEach(function (felt) {
      var ugyldig = !felt.value.trim() || (felt.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(felt.value.trim()));
      var boks = felt.closest('.felt');
      boks.classList.toggle('har-feil', ugyldig);
      felt.setAttribute('aria-invalid', String(ugyldig));
      if (ugyldig) feil.push({ felt: felt, tekst: boks.querySelector('.felt__feil').textContent });
    });
    return feil;
  }

  function visFeil(feil) {
    sammendrag.hidden = !feil.length;
    if (!feil.length) { sammendrag.textContent = ''; return; }
    sammendrag.innerHTML = '<h3>Skjemaet mangler noe</h3><ul></ul>';
    var ul = sammendrag.querySelector('ul');
    feil.forEach(function (f) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + f.felt.id;
      a.textContent = f.tekst;
      li.appendChild(a);
      ul.appendChild(li);
    });
    sammendrag.focus();
  }

  function byggTekst() {
    var linjer = ['Hei,', '', verdi('k-melding') || 'Vi ønsker å høre mer om Skoleøkonomi.', ''];
    linjer.push('Navn: ' + verdi('k-navn'));
    if (verdi('k-rolle')) linjer.push('Rolle: ' + verdi('k-rolle'));
    linjer.push('Virksomhet: ' + verdi('k-virksomhet'));
    linjer.push('E-post: ' + verdi('k-epost'));
    if (verdi('k-telefon')) linjer.push('Telefon: ' + verdi('k-telefon'));
    linjer.push('Gjelder: ' + verdi('k-gjelder'));
    if (estimatLinjer.length && estimatMed && estimatMed.checked) {
      linjer.push('', 'Estimat fra kalkulatoren:');
      estimatLinjer.forEach(function (l) { linjer.push('  ' + l); });
    }
    return linjer.join('\n');
  }

  // Domenet har ø. E-postprogrammer er tryggest med punycode-formen i selve lenken.
  function adresseForLenke() {
    var deler = epost.split('@');
    try { return deler[0] + '@' + new URL('http://' + deler[1]).hostname; } catch (feil) { return epost; }
  }

  function send(emne, tekst) {
    window.location.href = 'mailto:' + adresseForLenke() + '?subject=' + encodeURIComponent(emne) + '&body=' + encodeURIComponent(tekst);
  }

  // Fjern feilmarkeringen når feltet rettes.
  skjema.addEventListener('input', function (e) {
    var boks = e.target.closest('.felt.har-feil');
    if (boks && e.target.value.trim()) { boks.classList.remove('har-feil'); e.target.setAttribute('aria-invalid', 'false'); }
  });

  skjema.addEventListener('submit', function (e) {
    e.preventDefault();
    var feil = valider();
    visFeil(feil);
    if (feil.length) return;
    var tekst = byggTekst();
    var emne = verdi('k-gjelder') + ' – ' + verdi('k-virksomhet');
    document.querySelector('[data-kontakt-tekst]').textContent = 'Emne: ' + emne + '\n\n' + tekst;
    skjema.hidden = true;
    resultat.hidden = false;
    resultat.focus();
    send(emne, tekst);
  });

  resultat.addEventListener('click', function (e) {
    var knapp = e.target.closest('button');
    if (!knapp) return;
    if (knapp.hasAttribute('data-kontakt-kopier')) {
      SO.kopier(document.querySelector('[data-kontakt-tekst]').textContent).then(function (ok) {
        SO.varsle(ok ? 'Teksten er kopiert.' : 'Kunne ikke kopiere. Marker teksten og kopier den manuelt.');
      });
    } else if (knapp.hasAttribute('data-kontakt-tilbake')) {
      resultat.hidden = true;
      skjema.hidden = false;
      document.getElementById('k-navn').focus();
    }
  });
})();
