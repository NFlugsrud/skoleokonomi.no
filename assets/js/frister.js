/* Regner ut når fristene i årshjulet faller, og lager kalenderfil (.ics). Ren logikk uten DOM. */
(function (rot, lag) {
  var api = lag();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else rot.SO = Object.assign(rot.SO || {}, { frister: api });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MANEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

  function gjelder(frist, filter) {
    return !filter || filter === 'alle' || frist.gjelder === 'alle' || frist.gjelder === filter;
  }

  // Dagen fristen faller på i en gitt måned (1–12), eller null hvis den ikke faller i den måneden.
  function dagIMnd(frist, mnd) {
    var g = frist.gjentak;
    if (g.type === 'manedlig') return g.dag;
    if (g.type === 'arlig') return g.mnd === mnd ? g.dag : null;
    if (g.type === 'terminvis') return g.mnd.indexOf(mnd) >= 0 ? ((g.unntak && g.unntak[mnd]) || g.dag) : null;
    return null;
  }

  // Fristene i én måned, sortert på dag. Månedlige frister tas bare med når medManedlige er sann.
  function iMnd(frister, mnd, filter, medManedlige) {
    return frister.filter(function (f) { return gjelder(f, filter) && (medManedlige || f.gjentak.type !== 'manedlig'); })
      .map(function (f) { return { frist: f, dag: dagIMnd(f, mnd) }; })
      .filter(function (x) { return x.dag !== null; })
      .sort(function (a, b) { return a.dag - b.dag; });
  }

  // De neste forekomstene fra og med en dato, på tvers av årsskiftet.
  function neste(frister, fra, antall, filter) {
    var ut = [];
    var start = new Date(fra.getFullYear(), fra.getMonth(), fra.getDate());
    for (var i = 0; i < 13; i++) {
      var d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      iMnd(frister, d.getMonth() + 1, filter, true).forEach(function (x) {
        var dato = new Date(d.getFullYear(), d.getMonth(), x.dag);
        if (dato >= start) ut.push({ frist: x.frist, dato: dato });
      });
    }
    ut.sort(function (a, b) { return a.dato - b.dato; });
    return ut.slice(0, antall);
  }

  function datoTekst(dato) { return dato.getDate() + '. ' + MANEDER[dato.getMonth()]; }

  function dagerTil(dato, fra) {
    var a = Date.UTC(fra.getFullYear(), fra.getMonth(), fra.getDate());
    var b = Date.UTC(dato.getFullYear(), dato.getMonth(), dato.getDate());
    return Math.round((b - a) / 86400000);
  }

  // --- Kalenderfil (iCalendar, RFC 5545) ---------------------------------
  function to(n) { return (n < 10 ? '0' : '') + n; }
  function icsDato(ar, mnd, dag) { return String(ar) + to(mnd) + to(dag); }
  function icsTekst(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function brett(linje) { // linjer over 75 tegn brettes
    var ut = [];
    while (linje.length > 74) { ut.push(linje.slice(0, 74)); linje = ' ' + linje.slice(74); }
    ut.push(linje);
    return ut.join('\r\n');
  }

  function ics(frister, ar, filter) {
    var linjer = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skoleokonomi//Arshjul//NB', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Frister – private skoler og barnehager'];
    frister.filter(function (f) { return gjelder(f, filter); }).forEach(function (f) {
      var g = f.gjentak;
      var hendelser = [];
      if (g.type === 'manedlig') hendelser.push({ mnd: 1, dag: g.dag, regel: 'FREQ=MONTHLY;BYMONTHDAY=' + g.dag });
      else if (g.type === 'arlig') hendelser.push({ mnd: g.mnd, dag: g.dag, regel: 'FREQ=YEARLY' });
      else g.mnd.forEach(function (m) { hendelser.push({ mnd: m, dag: (g.unntak && g.unntak[m]) || g.dag, regel: 'FREQ=YEARLY' }); });
      hendelser.forEach(function (h) {
        var slutt = new Date(Date.UTC(ar, h.mnd - 1, h.dag + 1));
        linjer.push('BEGIN:VEVENT',
          'UID:' + f.id + '-' + h.mnd + '@skoleokonomi',
          'DTSTAMP:' + icsDato(ar, 1, 1) + 'T000000Z',
          'DTSTART;VALUE=DATE:' + icsDato(ar, h.mnd, h.dag),
          'DTEND;VALUE=DATE:' + icsDato(slutt.getUTCFullYear(), slutt.getUTCMonth() + 1, slutt.getUTCDate()),
          'RRULE:' + h.regel,
          'SUMMARY:' + icsTekst('Frist: ' + f.tittel),
          'DESCRIPTION:' + icsTekst(f.beskrivelse + ' Kilde: ' + f.kilde.navn + ', ' + f.kilde.url + '. Kontroller alltid fristen mot kilden.'),
          'TRANSP:TRANSPARENT',
          'END:VEVENT');
      });
    });
    linjer.push('END:VCALENDAR');
    return linjer.map(brett).join('\r\n') + '\r\n';
  }

  return { MANEDER: MANEDER, gjelder: gjelder, dagIMnd: dagIMnd, iMnd: iMnd, neste: neste, datoTekst: datoTekst, dagerTil: dagerTil, ics: ics };
});
