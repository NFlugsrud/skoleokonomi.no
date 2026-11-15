/* Fristene i årshjulet. Hver frist har kilde.

   gjelder:  'alle' | 'skole' | 'barnehage'
   gjentak:  { type: 'arlig', mnd, dag } | { type: 'terminvis', mnd: [..], dag } | { type: 'manedlig', dag } */
(function (rot, lag) {
  var data = lag();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else rot.SO = Object.assign(rot.SO || {}, { fristdata: data });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var UDIR = 'Utdanningsdirektoratet';
  var SKATT = 'Skatteetaten';

  var FRISTER = [
    {
      id: 'a-melding', tittel: 'A-melding', nar: 'den 5. hver måned', gjelder: 'alle', kategori: 'Lønn',
      gjentak: { type: 'manedlig', dag: 5 },
      beskrivelse: 'Lønn, forskuddstrekk og arbeidsforhold for forrige måned. Er den 5. helg eller helligdag, er fristen første påfølgende hverdag.',
      kilde: { navn: SKATT, url: 'https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/a-meldingen/frister-og-betaling-i-a-meldingen/' },
      bekreftet: true
    },
    {
      id: 'arbeidsgiveravgift', tittel: 'Arbeidsgiveravgift', nar: 'den 15. annenhver måned', gjelder: 'alle', kategori: 'Lønn',
      gjentak: { type: 'terminvis', mnd: [1, 3, 5, 7, 9, 11], dag: 15 },
      beskrivelse: 'Betales samlet per termin på to måneder. Forskuddstrekk forfaller fra 2026 første virkedag etter lønnsutbetalingen.',
      kilde: { navn: SKATT, url: 'https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/a-meldingen/frister-og-betaling-i-a-meldingen/' },
      bekreftet: true
    },
    {
      id: 'momskompensasjon', tittel: 'Kompensasjonsmelding for merverdiavgift', nar: 'annenhver måned', gjelder: 'alle', kategori: 'Avgift',
      gjentak: { type: 'terminvis', mnd: [2, 4, 6, 8, 10, 12], dag: 10, unntak: { 8: 31 } },
      beskrivelse: 'Krav om momskompensasjon for termin på to måneder. Fristene er absolutte, og revisor må attestere meldingen innen fristen.',
      kilde: { navn: SKATT, url: 'https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/compensation/' },
      bekreftet: false
    },
    {
      id: 'aksjonarregister', tittel: 'Aksjonærregisteroppgaven', nar: '31. januar', gjelder: 'alle', kategori: 'Årsoppgjør',
      gjentak: { type: 'arlig', mnd: 1, dag: 31 },
      beskrivelse: 'Gjelder virksomheter organisert som aksjeselskap.',
      kilde: { navn: SKATT, url: 'https://www.skatteetaten.no/bedrift-og-organisasjon/rapportering-og-bransjer/aksjonarregisteroppgaven/' },
      bekreftet: true
    },
    {
      id: 'elevtelling-april', tittel: 'Elevtall og prognose per 1. april', nar: '1. april', gjelder: 'skole', kategori: 'Tilskudd',
      gjentak: { type: 'arlig', mnd: 4, dag: 1 },
      beskrivelse: 'Videregående skoler rapporterer elevtall. Grunnskoler rapporterer elevtallsprognose for høsten. Nøyaktig frist står i tilskuddsbrevet.',
      kilde: { navn: UDIR, url: 'https://www.udir.no/utdanningslopet/spesielt-for-private-skoler/rapportering-av-elevtall/' },
      bekreftet: true
    },
    {
      id: 'skattemelding', tittel: 'Skattemelding for selskap', nar: '31. mai', gjelder: 'alle', kategori: 'Årsoppgjør',
      gjentak: { type: 'arlig', mnd: 5, dag: 31 },
      beskrivelse: 'For virksomheter som leverer skattemelding for selskap.',
      kilde: { navn: SKATT, url: 'https://www.skatteetaten.no/en/business-and-organisation/tax-for-businesses/tax-return/companies/' },
      bekreftet: true
    },
    {
      id: 'arsregnskap-udir', tittel: 'Årsregnskap til Udir', nar: '1. juni', gjelder: 'skole', kategori: 'Rapportering',
      gjentak: { type: 'arlig', mnd: 6, dag: 1 },
      beskrivelse: 'Årsregnskap, revisjonsberetning og avdelingsregnskap for forrige regnskapsår.',
      kilde: { navn: UDIR, url: 'https://www.udir.no/om-udir/tilskudd-og-prosjektmidler/tilskudd-til-private-skoler/private-grunnskoler-i-norge/' },
      bekreftet: true
    },
    {
      id: 'arsregnskap-brreg', tittel: 'Årsregnskap til Regnskapsregisteret', nar: '31. juli', gjelder: 'alle', kategori: 'Årsoppgjør',
      gjentak: { type: 'arlig', mnd: 7, dag: 31 },
      beskrivelse: 'Fristen kan ikke forlenges. Leveres årsregnskapet for sent, påløper forsinkelsesgebyr.',
      kilde: { navn: 'Brønnøysundregistrene', url: 'https://www.brreg.no/en/other-topics/remember-the-deadline-31-july/' },
      bekreftet: true
    },
    {
      id: 'basil-regnskap', tittel: 'Regnskap i Basil', nar: 'frist i september', gjelder: 'barnehage', kategori: 'Rapportering',
      gjentak: { type: 'arlig', mnd: 9, dag: 20 },
      beskrivelse: 'Regnskapsopplysninger for forrige år, attestert av revisor. Udir fastsetter fristen hvert år – for regnskapsåret 2025 var den 20. september 2026.',
      kilde: { navn: UDIR, url: 'https://www.udir.no/tall-og-forskning/innrapportering/basil/private-barnehagers-rapporteringsplikt-i-basil/' },
      bekreftet: true
    },
    {
      id: 'elevtelling-oktober', tittel: 'Elevtelling per 1. oktober', nar: '1. oktober', gjelder: 'skole', kategori: 'Tilskudd',
      gjentak: { type: 'arlig', mnd: 10, dag: 1 },
      beskrivelse: 'Elevtall per 1. oktober, som tilskuddet beregnes ut fra. Revisor bekrefter elevtallsrapportene. Nøyaktig frist står i tilskuddsbrevet.',
      kilde: { navn: UDIR, url: 'https://www.udir.no/utdanningslopet/spesielt-for-private-skoler/rapportering-av-elevtall/' },
      bekreftet: true
    },
    {
      id: 'basil-arsmelding', tittel: 'Årsmelding i Basil åpner', nar: 'tidlig i desember', gjelder: 'barnehage', kategori: 'Rapportering',
      gjentak: { type: 'arlig', mnd: 12, dag: 7 },
      beskrivelse: 'Årsmelding og kommuneskjema. Datoene fastsettes av Udir hvert år – for 2026 åpner rapporteringen 7. desember.',
      kilde: { navn: UDIR, url: 'https://www.udir.no/tall-og-forskning/datainnsamling--kilder/basil/' },
      bekreftet: true
    }
  ];

  return { FRISTER: FRISTER };
});
