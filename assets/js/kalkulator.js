/* Fastpriskalkulatoren – signaturelementet. Monteres i elementer med [data-kalkulator].
   All regning skjer i prismodell.js; denne filen tegner skjema og hovedbok og holder dem i takt. */
(function () {
  'use strict';
  var SO = window.SO || {};
  var P = SO.pris;
  if (!P || !SO.lager) return;

  var M = P.PRISMODELL;
  var NOKKEL = 'so.kalkulator.v1';
  var SKYVMAKS = { ansatte: 150, elever: 600 };
  var STEG = { ansatte: 1, elever: 5 };
  var esc = SO.esc;
  var montert = 0;

  function fortegn(v) { return v > 0 ? '+ ' + P.kr(v) : v < 0 ? '− ' + P.kr(-v) : P.kr(0); }

  function klem(felt, verdi) {
    var g = P.GRENSER[felt];
    var n = Math.round(Number(verdi));
    if (!isFinite(n)) n = 0;
    return Math.min(g.max, Math.max(g.min, n));
  }

  // Radene i utregningen for én enhet, som [etikett, beløp].
  function deler(u, medLonn) {
    var info = P.typeInfo(u.enhet.type);
    var rader = [
      ['Grunnpris', P.kr(u.grunnpris)],
      ['Ansatte (' + P.tall(u.enhet.ansatte) + ' × ' + P.sats(M.perAnsatt) + ')', P.kr(u.ansatte)],
      [info.Teller + ' (' + P.tall(u.antallUnder) + ' × ' + P.sats(M.perElev) + ')', P.kr(u.eleverUnder)]
    ];
    if (u.antallOver > 0) rader.push([info.Teller + ' over ' + P.tall(M.elevTerskel) + ' (' + P.tall(u.antallOver) + ' × ' + P.sats(M.perElevOver) + ')', P.kr(u.eleverOver)]);
    if (medLonn) rader.push(['Lønn (' + P.tall(u.enhet.ansatte) + ' × ' + P.sats(M.perAnsattLonn) + ')', P.kr(u.lonn)]);
    if (u.typetillegg) rader.push(['Tillegg for ' + info.navn.toLowerCase(), fortegn(u.typetillegg)]);
    return rader;
  }

  function arsoppgjorEtikett(r) {
    return r.enheter.length > 1 ? 'Årsoppgjør (' + r.enheter.length + ' × ' + P.tall(M.arsoppgjor) + ')' : 'Årsoppgjør';
  }

  function skall(id) {
    return '' +
      '<div class="kalk__inn">' +
        '<h2 class="kalk__tittel">Hva koster det?</h2>' +
        '<p class="kalk__ingress">Prisen følger størrelsen på virksomheten – antall ansatte og antall elever eller barn. Juster tallene, så regner vi.</p>' +
        '<div data-enheter></div>' +
        '<button type="button" class="kalk__leggtil" data-leggtil>+ Legg til enhet</button>' +
        '<fieldset class="kalk__valg"><legend>Inkluder</legend>' +
          '<label class="kryss"><input type="checkbox" data-valg="arsoppgjor"> Årsoppgjør (forberedelse, eks. revisjon)</label>' +
          '<label class="kryss"><input type="checkbox" data-valg="lonn"> Lønnskjøring og a-melding</label>' +
        '</fieldset>' +
        '<div class="kalk__flyt" aria-hidden="true"><span>Estimat</span><span><b data-flyt></b> /mnd</span></div>' +
      '</div>' +
      '<div class="kalk__ut pa-blekk">' +
        '<h2 class="kalk__tittel">Ditt estimat</h2>' +
        '<p class="kalk__ingress">Veiledende fastpris basert på dagens modell.</p>' +
        '<table class="bok"><caption class="skjult">Utregning av fastpris</caption>' +
          '<tbody data-rader></tbody><tfoot data-fot></tfoot></table>' +
        '<button type="button" class="kalk__vis" data-vis hidden></button>' +
        '<div class="kalk__ar"><span class="kalk__stor" data-ar></span><span class="kalk__kr">kr / år</span>' +
          '<div class="kalk__arnote" data-arnote></div></div>' +
        '<div class="kalk__sammenlign"><span data-sammenlign></span>' +
          '<details class="kalk__idag"><summary>Sammenlign med det dere betaler i dag</summary>' +
            '<div class="kalk__idag-felt"><label for="' + id + '-idag">Dagens årskostnad, kr eks. mva</label>' +
            '<input id="' + id + '-idag" type="number" inputmode="numeric" min="0" step="1000" data-idag></div>' +
            '<p class="kalk__idag-svar" data-idag-svar aria-live="polite"></p>' +
          '</details></div>' +
        '<div class="kalk__verktoy">' +
          '<a class="knapp knapp--lys knapp--liten" data-send href="kontakt.html">Send estimatet til oss</a>' +
          '<button type="button" class="knapp knapp--lyskant knapp--liten" data-del>Kopier lenke</button>' +
          '<button type="button" class="knapp knapp--lyskant knapp--liten" data-skriv>Skriv ut</button>' +
          '<button type="button" class="knapp knapp--lyskant knapp--liten" data-nullstill>Nullstill</button>' +
        '</div>' +
        '<p class="skjult" aria-live="polite" data-live></p>' +
      '</div>';
  }

  function tallfelt(id, i, felt, verdi) {
    var g = P.GRENSER[felt];
    var fid = id + '-' + felt + '-' + i;
    return '<div class="felt"><label for="' + fid + '" data-etikett="' + felt + '"></label>' +
      '<div class="teller">' +
        '<button type="button" data-steg="-' + STEG[felt] + '" data-felt="' + felt + '">−</button>' +
        '<input id="' + fid + '" type="number" inputmode="numeric" min="' + g.min + '" max="' + g.max + '" step="1" value="' + verdi + '" data-felt="' + felt + '">' +
        '<button type="button" data-steg="' + STEG[felt] + '" data-felt="' + felt + '">+</button>' +
      '</div>' +
      // Skyvekontrollen er et tillegg for mus og berøring. Tastatur og skjermleser bruker tallfeltet.
      '<input class="skyv" type="range" min="0" max="' + SKYVMAKS[felt] + '" step="1" value="' + Math.min(verdi, SKYVMAKS[felt]) + '" data-skyv="' + felt + '" tabindex="-1" aria-hidden="true">' +
    '</div>';
  }

  function enhetHtml(id, i, e, flere) {
    var n = i + 1;
    var typer = P.TYPER.map(function (ty) {
      return '<label><input type="radio" name="' + id + '-type-' + i + '" value="' + ty.id + '"' +
        (ty.id === e.type ? ' checked' : '') + ' data-felt="type"><span>' + ty.navn + '</span></label>';
    }).join('');
    return '<fieldset class="enhet" data-i="' + i + '">' +
      '<legend class="skjult">Enhet ' + n + '</legend>' +
      (flere
        ? '<div class="enhet__hode"><span class="enhet__nr" aria-hidden="true">Enhet ' + n + '</span>' +
          '<input class="enhet__navn" type="text" maxlength="' + P.GRENSER.maksNavn + '" data-felt="navn" aria-label="Navn på enhet ' + n + ' (valgfritt)" placeholder="Navn (valgfritt)" value="' + esc(e.navn) + '">' +
          '<button type="button" class="enhet__fjern" data-fjern aria-label="Fjern enhet ' + n + '">Fjern</button></div>'
        : '') +
      '<div class="felt"><span class="felt__etikett" id="' + id + '-tl-' + i + '">Type virksomhet</span>' +
        '<div class="segment" role="radiogroup" aria-labelledby="' + id + '-tl-' + i + '">' + typer + '</div></div>' +
      '<div class="tallfelt">' + tallfelt(id, i, 'ansatte', e.ansatte) + tallfelt(id, i, 'elever', e.elever) + '</div>' +
    '</fieldset>';
  }

  // Etiketter som avhenger av typen: «elever» for skoler, «barn» for barnehager.
  function settEtiketter(fs, e) {
    var info = P.typeInfo(e.type);
    var navn = { ansatte: 'ansatte', elever: info.teller };
    ['ansatte', 'elever'].forEach(function (felt) {
      fs.querySelector('[data-etikett="' + felt + '"]').textContent = 'Antall ' + navn[felt];
      var knapper = fs.querySelectorAll('button[data-felt="' + felt + '"]');
      knapper[0].setAttribute('aria-label', 'Færre ' + navn[felt]);
      knapper[1].setAttribute('aria-label', 'Flere ' + navn[felt]);
    });
  }

  function estimatHtml(r) {
    var t = r.tilstand;
    var k = SO.konfig || {};
    var flere = r.enheter.length > 1;
    var dato = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    var grunnlag = r.enheter.map(function (u, i) {
      var info = P.typeInfo(u.enhet.type);
      return '<tr><td>' + esc(P.enhetsnavn(u.enhet, i)) + '</td><td>' + info.navn + '</td><td class="tall">' + P.tall(u.enhet.ansatte) +
        '</td><td class="tall">' + P.tall(u.enhet.elever) + ' ' + info.teller + '</td></tr>';
    }).join('');
    var utregning = r.enheter.map(function (u, i) {
      var rader = deler(u, t.lonn).map(function (d) {
        return '<tr class="ea__del"><th scope="row">' + esc(d[0]) + '</th><td class="tall">' + d[1] + '</td></tr>';
      }).join('');
      return (flere ? '<tr><th scope="row"><strong>' + esc(P.enhetsnavn(u.enhet, i)) + '</strong></th><td class="tall"><strong>' + P.kr(u.mnd) + '</strong></td></tr>' : '') + rader;
    }).join('');
    var tilvalg = [];
    if (t.arsoppgjor) tilvalg.push('årsoppgjør (forberedelse, eks. revisjon)');
    if (t.lonn) tilvalg.push('lønnskjøring og a-melding');
    return '' +
      '<div class="ea__topp"><div class="ea__merke"><span class="merke__rute"></span>' + esc(k.navn || 'Skoleøkonomi') + '</div><div class="ea__dato">' + dato + '</div></div>' +
      '<h1>Veiledende fastprisestimat</h1>' +
      '<p class="ea__ingress">Regnet ut med fastpriskalkulatoren. Prisen følger antall ansatte og antall elever eller barn.</p>' +
      '<h2>Grunnlag</h2>' +
      '<table class="ea__tabell"><thead><tr><th>Enhet</th><th>Type</th><th class="tall">Ansatte</th><th class="tall">Elever / barn</th></tr></thead><tbody>' + grunnlag + '</tbody></table>' +
      '<p class="ea__note">Tilvalg: ' + (tilvalg.length ? tilvalg.join(', ') : 'ingen') + '.</p>' +
      '<h2>Utregning per måned</h2>' +
      '<table class="ea__tabell"><tbody>' + utregning +
        '<tr class="ea__sum"><th scope="row">Pris per måned</th><td class="tall">' + P.kr(r.mnd) + '</td></tr>' +
        (t.arsoppgjor ? '<tr><th scope="row">' + arsoppgjorEtikett(r) + '</th><td class="tall">' + P.kr(r.arsoppgjor) + ' per år</td></tr>' : '') +
      '</tbody></table>' +
      '<div class="ea__total"><span>Estimert pris per år, eks. mva</span><strong>' + P.kr(r.ar) + '</strong></div>' +
      '<p class="ea__note">Estimatet er veiledende og er ikke et bindende tilbud. Endelig pris fastsettes etter en kort gjennomgang av virksomheten. Modellen og satsene er under utarbeidelse.</p>' +
      '<div class="ea__bunn"><span>' + esc(k.epost || '') + '</span><span>' + esc(k.status || '') + '</span></div>';
  }

  function monter(rot) {
    var id = 'kalk' + (++montert);
    var t = P.dekod(window.location.search) || P.rens(SO.lager.hent(NOKKEL) || P.standardTilstand());
    var visDeler = false;
    var forrigeAr = null;
    var lop = 0;
    var liveTid = null;

    rot.classList.add('kalk');
    rot.innerHTML = skall(id);
    var q = function (s) { return rot.querySelector(s); };
    var el = {
      enheter: q('[data-enheter]'), leggtil: q('[data-leggtil]'), rader: q('[data-rader]'), fot: q('[data-fot]'),
      vis: q('[data-vis]'), ar: q('[data-ar]'), arnote: q('[data-arnote]'), sammenlign: q('[data-sammenlign]'),
      idag: q('[data-idag]'), idagSvar: q('[data-idag-svar]'), send: q('[data-send]'), flyt: q('[data-flyt]'), live: q('[data-live]')
    };

    function tegnEnheter() {
      var flere = t.enheter.length > 1;
      el.enheter.innerHTML = t.enheter.map(function (e, i) { return enhetHtml(id, i, e, flere); }).join('');
      Array.prototype.forEach.call(el.enheter.children, function (fs, i) { settEtiketter(fs, t.enheter[i]); });
      el.leggtil.hidden = t.enheter.length >= P.GRENSER.maksEnheter;
      q('[data-valg="arsoppgjor"]').checked = t.arsoppgjor;
      q('[data-valg="lonn"]').checked = t.lonn;
    }

    function settAr(ny) {
      var fra = forrigeAr;
      forrigeAr = ny;
      if (fra === null || fra === ny || SO.redusertBevegelse() || !window.requestAnimationFrame) { el.ar.textContent = P.tall(ny); return; }
      var denne = ++lop;
      var start = null;
      window.requestAnimationFrame(function steg(tid) {
        if (denne !== lop) return;
        if (start === null) start = tid;
        var p = Math.min(1, (tid - start) / 220);
        el.ar.textContent = P.tall(fra + (ny - fra) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) window.requestAnimationFrame(steg);
      });
    }

    function tegnIdag(r) {
      var dagens = Math.round(Number(el.idag.value));
      if (!el.idag.value || !isFinite(dagens) || dagens <= 0) { el.idagSvar.textContent = ''; return; }
      var diff = dagens - r.ar;
      el.idagSvar.textContent = diff > 0
        ? 'Estimatet er ' + P.kr(diff) + ' lavere per år enn det dere betaler i dag.'
        : diff < 0
          ? 'Estimatet er ' + P.kr(-diff) + ' høyere per år enn det dere betaler i dag. Sammenlign gjerne hva som er inkludert.'
          : 'Estimatet er likt det dere betaler i dag.';
    }

    function tegnResultat() {
      var r = P.beregn(t);
      var flere = r.enheter.length > 1;
      el.rader.innerHTML = r.enheter.map(function (u, i) {
        var rader = deler(u, t.lonn).map(function (d) {
          return '<tr' + (flere ? ' class="bok__del"' : '') + '><th scope="row">' + esc(d[0]) + '</th><td>' + d[1] + '</td></tr>';
        }).join('');
        if (!flere) return rader;
        return '<tr class="bok__enhet"><th scope="row">' + esc(P.enhetsnavn(u.enhet, i)) + ' · ' + P.typeInfo(u.enhet.type).navn + '</th><td>' + P.kr(u.mnd) + '</td></tr>' +
          (visDeler ? rader : '');
      }).join('');
      el.fot.innerHTML = '<tr><th scope="row">Pris per måned</th><td>' + P.kr(r.mnd) + ' /mnd</td></tr>' +
        (t.arsoppgjor ? '<tr class="bok__ao"><th scope="row">' + arsoppgjorEtikett(r) + '</th><td>' + P.kr(r.arsoppgjor) + ' /år</td></tr>' : '');
      el.vis.hidden = !flere;
      el.vis.textContent = visDeler ? 'Skjul utregningen per enhet' : 'Vis utregningen per enhet';
      el.vis.setAttribute('aria-expanded', String(visDeler));
      settAr(r.ar);
      el.arnote.textContent = (t.arsoppgjor ? 'inkl. årsoppgjør' : 'eks. årsoppgjør') + ' · eks. mva' + (flere ? ' · ' + r.enheter.length + ' enheter' : '');
      el.sammenlign.innerHTML = 'Til sammenligning tilsvarer årsprisen omtrent <b>' + P.tall(r.timer) + ' timer</b> hos et byrå som fakturerer ' +
        P.tall(M.sammenlignTimepris) + ' kr per time. Hos oss er prisen fast.';
      el.flyt.textContent = P.kr(r.mnd);
      el.send.setAttribute('href', 'kontakt.html?' + P.kod(t));
      tegnIdag(r);
      clearTimeout(liveTid);
      liveTid = setTimeout(function () {
        el.live.textContent = 'Estimat: ' + P.kr(r.mnd) + ' per måned, ' + P.kr(r.ar) + ' per år.';
      }, 700);
    }

    function endret() {
      tegnResultat();
      SO.lager.sett(NOKKEL, t);
    }

    function enhetFra(node) {
      var fs = node.closest('[data-i]');
      return fs ? { i: Number(fs.getAttribute('data-i')), fs: fs } : null;
    }

    function synkFelt(fs, felt, verdi, unntatt) {
      var tallEl = fs.querySelector('input[type="number"][data-felt="' + felt + '"]');
      var skyvEl = fs.querySelector('[data-skyv="' + felt + '"]');
      if (tallEl !== unntatt) tallEl.value = verdi;
      if (skyvEl !== unntatt) skyvEl.value = Math.min(verdi, SKYVMAKS[felt]);
    }

    rot.addEventListener('input', function (e) {
      var node = e.target;
      if (node === el.idag) { tegnIdag(P.beregn(t)); return; }
      var treff = enhetFra(node);
      if (!treff) return;
      var enhet = t.enheter[treff.i];
      var felt = node.getAttribute('data-skyv') || node.getAttribute('data-felt');
      if (felt === 'navn') enhet.navn = P.rensNavn(node.value);
      else if (felt === 'ansatte' || felt === 'elever') { enhet[felt] = klem(felt, node.value); synkFelt(treff.fs, felt, enhet[felt], node); }
      else return;
      endret();
    });

    rot.addEventListener('change', function (e) {
      var node = e.target;
      if (node.hasAttribute('data-valg')) { t[node.getAttribute('data-valg')] = node.checked; endret(); return; }
      if (node.getAttribute('data-felt') === 'type') {
        var treff = enhetFra(node);
        t.enheter[treff.i].type = node.value;
        settEtiketter(treff.fs, t.enheter[treff.i]);
        endret();
      }
    });

    // Når et felt forlates, vises den rensede verdien (f.eks. hvis noen skrev 9999 ansatte).
    rot.addEventListener('focusout', function (e) {
      var node = e.target;
      var treff = enhetFra(node);
      if (!treff) return;
      var felt = node.getAttribute('data-felt');
      if (node.type === 'number' && (felt === 'ansatte' || felt === 'elever')) node.value = t.enheter[treff.i][felt];
      else if (felt === 'navn') node.value = t.enheter[treff.i].navn;
    });

    rot.addEventListener('click', function (e) {
      var knapp = e.target.closest('button');
      if (!knapp || !rot.contains(knapp)) return;
      var treff = enhetFra(knapp);
      if (knapp.hasAttribute('data-steg') && treff) {
        var felt = knapp.getAttribute('data-felt');
        var ny = klem(felt, t.enheter[treff.i][felt] + Number(knapp.getAttribute('data-steg')));
        t.enheter[treff.i][felt] = ny;
        synkFelt(treff.fs, felt, ny, null);
        endret();
      } else if (knapp.hasAttribute('data-leggtil')) {
        t.enheter.push(P.nyEnhet({ type: 'barnehage', ansatte: 10, elever: 50 }));
        tegnEnheter();
        endret();
        var nyNavn = el.enheter.lastElementChild.querySelector('.enhet__navn');
        if (nyNavn) nyNavn.focus();
      } else if (knapp.hasAttribute('data-fjern') && treff) {
        t.enheter.splice(treff.i, 1);
        tegnEnheter();
        endret();
        el.leggtil.focus();
      } else if (knapp.hasAttribute('data-vis')) {
        visDeler = !visDeler;
        tegnResultat();
      } else if (knapp.hasAttribute('data-del')) {
        var lenke = window.location.href.split('#')[0].split('?')[0] + '?' + P.kod(t) + '#kalkulator';
        SO.kopier(lenke).then(function (ok) {
          if (ok) SO.varsle('Lenken til estimatet er kopiert.');
          else window.prompt('Kopier lenken til estimatet:', lenke);
        });
      } else if (knapp.hasAttribute('data-skriv')) {
        var ark = document.querySelector('.estimatark');
        if (!ark) {
          ark = document.createElement('section');
          ark.className = 'estimatark';
          ark.setAttribute('aria-hidden', 'true');
          document.body.appendChild(ark);
        }
        ark.innerHTML = estimatHtml(P.beregn(t));
        document.documentElement.classList.add('skriv-estimat');
        window.print();
      } else if (knapp.hasAttribute('data-nullstill')) {
        t = P.standardTilstand();
        visDeler = false;
        el.idag.value = '';
        tegnEnheter();
        endret();
        SO.varsle('Kalkulatoren er nullstilt.');
      }
    });

    tegnEnheter();
    tegnResultat();
  }

  document.querySelectorAll('[data-kalkulator]').forEach(monter);
})();
