/* Felles innstillinger for nettstedet. Ett sted å endre status, e-post og nettadresse.
   Kjør `npm run synk` etter endringer her, slik at alle sidene oppdateres. */
(function (rot, lag) {
  var konfig = lag();
  if (typeof module === 'object' && module.exports) module.exports = konfig;
  else rot.SO = Object.assign(rot.SO || {}, { konfig: konfig });
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    // true = nettstedet er et utkast: sidene får noindex, robots.txt stenger for søkemotorer,
    // og et utkast-banner vises øverst. Settes til false først ved lansering.
    utkast: true,

    navn: 'Skoleøkonomi',
    epost: 'post@skoleøkonomi.no',
    nettadresse: 'https://skoleøkonomi.no',
    status: 'Tar imot de første oppdragene fra 2027'
  };
});
