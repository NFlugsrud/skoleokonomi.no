/* Prismodellen for fastpriskalkulatoren. Ren logikk uten DOM, slik at den kan testes
   (tester/prismodell.test.mjs) og brukes både på nettstedet og i kalibreringsverktøyet. */
(function (rot, lag) {
  var api = lag();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else rot.SO = Object.assign(rot.SO || {}, { pris: api });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ====================================================================
  //  PRISMODELL — juster satsene her.
  //  Tallene er FORELØPIGE plassholdere og skal kalibreres mot reelle
  //  elev-/barnetall før lansering (se TODO.md).
  // ====================================================================
  //
  //  Tanken bak strukturen: det meste av arbeidet er likt uansett størrelse
  //  (månedsavslutning, avstemming, rapportering), så grunnprisen bærer mest.
  //  Ansatte og elever/barn er en tilnærming til bilagsmengden. Elevsatsen
  //  halveres over en terskel, fordi merarbeidet per elev er lite i store enheter.
  //  Lønnskjøring er det som faktisk følger antall ansatte, og prises deretter.
  //  Forskjell mellom typer virksomhet er et fast tillegg, ikke en faktor.
  var PRISMODELL = {
    grunnpris: 10000,         // kr/mnd basisarbeid per enhet
    perAnsatt: 75,            // kr/mnd per ansatt (uten lønnskjøring)
    perElev: 9,               // kr/mnd per elev/barn opp til terskelen
    elevTerskel: 200,         // antall elever/barn før lavere sats slår inn
    perElevOver: 4.5,         // kr/mnd per elev/barn over terskelen
    perAnsattLonn: 200,       // kr/mnd per ansatt HVIS lønnskjøring inkluderes
    arsoppgjor: 18000,        // kr/år per enhet (forberedelse, eks. revisjon)
    typeTillegg: { barnehage: 0, grunnskole: 0, ungdomsskole: 0, videregaaende: 500 }, // kr/mnd
    sammenlignTimepris: 1090  // timepris brukt i sammenligningen mot timebasert byrå
  };

  var TYPER = [
    { id: 'barnehage', kode: 'b', navn: 'Barnehage', teller: 'barn', Teller: 'Barn' },
    { id: 'grunnskole', kode: 'g', navn: 'Grunnskole', teller: 'elever', Teller: 'Elever' },
    { id: 'ungdomsskole', kode: 'u', navn: 'Ungdomsskole', teller: 'elever', Teller: 'Elever' },
    { id: 'videregaaende', kode: 'v', navn: 'Videregående', teller: 'elever', Teller: 'Elever' }
  ];

  var GRENSER = {
    ansatte: { min: 0, max: 500 },
    elever: { min: 0, max: 3000 },
    maksEnheter: 8,
    maksNavn: 40
  };

  function typeInfo(id) {
    for (var i = 0; i < TYPER.length; i++) if (TYPER[i].id === id) return TYPER[i];
    return TYPER[1];
  }

  function heltall(verdi, grense, reserve) {
    var n = Math.round(Number(verdi));
    if (!isFinite(n)) n = reserve;
    return Math.min(grense.max, Math.max(grense.min, n));
  }

  // Navn på enheter kan komme fra en delt lenke. Bare bokstaver, tall og enkel tegnsetting slipper gjennom.
  function rensNavn(navn) {
    if (typeof navn !== 'string') return '';
    return navn.replace(/[^\p{L}\p{N} .,&()\/-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, GRENSER.maksNavn);
  }

  function nyEnhet(e) {
    e = e || {};
    return {
      type: typeInfo(e.type).id,
      ansatte: heltall(e.ansatte, GRENSER.ansatte, 20),
      elever: heltall(e.elever, GRENSER.elever, 150),
      navn: rensNavn(e.navn)
    };
  }

  function standardTilstand() {
    return { enheter: [nyEnhet({ type: 'grunnskole', ansatte: 20, elever: 150 })], arsoppgjor: true, lonn: false };
  }

  // Gjør vilkårlig inndata (lagret tilstand, delt lenke) om til en gyldig tilstand.
  function rens(t) {
    t = t || {};
    var enheter = Array.isArray(t.enheter) ? t.enheter.slice(0, GRENSER.maksEnheter).map(nyEnhet) : [];
    if (!enheter.length) enheter = standardTilstand().enheter;
    return { enheter: enheter, arsoppgjor: t.arsoppgjor !== false, lonn: t.lonn === true };
  }

  // Månedspris for én enhet. Hver rad avrundes til hele kroner, og månedsprisen er summen
  // av radene, slik at utregningen som vises alltid går opp.
  function beregnEnhet(enhet, medLonn, modell) {
    var m = modell || PRISMODELL;
    var e = nyEnhet(enhet);
    var terskel = m.elevTerskel > 0 ? Math.round(m.elevTerskel) : Infinity;
    var antallUnder = Math.min(e.elever, terskel);
    var antallOver = e.elever - antallUnder;
    var grunnpris = Math.round(m.grunnpris);
    var ansatte = Math.round(e.ansatte * m.perAnsatt);
    var eleverUnder = Math.round(antallUnder * m.perElev);
    var eleverOver = Math.round(antallOver * m.perElevOver);
    var lonn = medLonn ? Math.round(e.ansatte * m.perAnsattLonn) : 0;
    var typetillegg = Math.round((m.typeTillegg || {})[e.type] || 0);
    return {
      enhet: e,
      grunnpris: grunnpris,
      ansatte: ansatte,
      antallUnder: antallUnder,
      antallOver: antallOver,
      eleverUnder: eleverUnder,
      eleverOver: eleverOver,
      elever: eleverUnder + eleverOver,
      lonn: lonn,
      typetillegg: typetillegg,
      mnd: grunnpris + ansatte + eleverUnder + eleverOver + lonn + typetillegg
    };
  }

  function beregn(tilstand, modell) {
    var m = modell || PRISMODELL;
    var t = rens(tilstand);
    var enheter = t.enheter.map(function (e) { return beregnEnhet(e, t.lonn, m); });
    var mnd = enheter.reduce(function (s, e) { return s + e.mnd; }, 0);
    var arsoppgjor = t.arsoppgjor ? enheter.length * Math.round(m.arsoppgjor) : 0;
    var ar = mnd * 12 + arsoppgjor;
    return {
      tilstand: t,
      enheter: enheter,
      mnd: mnd,
      arsoppgjor: arsoppgjor,
      ar: ar,
      timer: m.sammenlignTimepris > 0 ? ar / m.sammenlignTimepris : 0
    };
  }

  // Tilstand <-> adresselinje, slik at et estimat kan deles som lenke.
  // Format: e=g.20.150_b.8.45&ao=1&l=0&n=Navn%201~Navn%202
  function kod(tilstand) {
    var t = rens(tilstand);
    var deler = ['e=' + t.enheter.map(function (e) {
      return typeInfo(e.type).kode + '.' + e.ansatte + '.' + e.elever;
    }).join('_'), 'ao=' + (t.arsoppgjor ? 1 : 0), 'l=' + (t.lonn ? 1 : 0)];
    if (t.enheter.some(function (e) { return e.navn; })) {
      deler.push('n=' + t.enheter.map(function (e) { return encodeURIComponent(e.navn); }).join('~'));
    }
    return deler.join('&');
  }

  function dekod(sok) {
    if (typeof sok !== 'string') return null;
    var par = {};
    sok.replace(/^[?#]/, '').split('&').forEach(function (bit) {
      var i = bit.indexOf('=');
      if (i > 0) par[bit.slice(0, i)] = bit.slice(i + 1);
    });
    if (!par.e) return null;
    var navn = (par.n || '').split('~').map(function (n) {
      try { return decodeURIComponent(n); } catch (feil) { return ''; }
    });
    var enheter = [];
    par.e.split('_').forEach(function (bit, i) {
      var d = bit.split('.');
      var type = null;
      for (var k = 0; k < TYPER.length; k++) if (TYPER[k].kode === d[0]) type = TYPER[k].id;
      if (!type || d.length !== 3 || !/^\d+$/.test(d[1]) || !/^\d+$/.test(d[2])) return;
      enheter.push({ type: type, ansatte: d[1], elever: d[2], navn: navn[i] || '' });
    });
    if (!enheter.length) return null;
    return rens({ enheter: enheter, arsoppgjor: par.ao !== '0', lonn: par.l === '1' });
  }

  var tallformat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
  var satsformat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 });
  function tall(v) { return tallformat.format(Math.round(v)).replace(/-/g, '−'); }
  function sats(v) { return satsformat.format(v); }
  function kr(v) { return tall(v) + ' kr'; }
  function enhetsnavn(e, i) { return e.navn || 'Enhet ' + (i + 1); }

  // Estimatet som ren tekst, én linje per element. Brukes i e-post fra kontaktskjemaet.
  function oppsummering(tilstand, modell) {
    var r = beregn(tilstand, modell);
    var linjer = r.enheter.map(function (u, i) {
      var info = typeInfo(u.enhet.type);
      return enhetsnavn(u.enhet, i) + ' (' + info.navn.toLowerCase() + '): ' + tall(u.enhet.ansatte) + ' ansatte, ' +
        tall(u.enhet.elever) + ' ' + info.teller + ' – ' + kr(u.mnd) + ' per måned';
    });
    var tilvalg = [];
    if (r.tilstand.arsoppgjor) tilvalg.push('årsoppgjør');
    if (r.tilstand.lonn) tilvalg.push('lønnskjøring og a-melding');
    linjer.push('Tilvalg: ' + (tilvalg.length ? tilvalg.join(', ') : 'ingen'));
    linjer.push('Veiledende estimat: ' + kr(r.mnd) + ' per måned, ' + kr(r.ar) + ' per år (eks. mva)');
    return linjer;
  }

  return {
    PRISMODELL: PRISMODELL,
    TYPER: TYPER,
    GRENSER: GRENSER,
    typeInfo: typeInfo,
    nyEnhet: nyEnhet,
    standardTilstand: standardTilstand,
    rens: rens,
    rensNavn: rensNavn,
    beregnEnhet: beregnEnhet,
    beregn: beregn,
    kod: kod,
    dekod: dekod,
    tall: tall,
    sats: sats,
    kr: kr,
    enhetsnavn: enhetsnavn,
    oppsummering: oppsummering
  };
});
