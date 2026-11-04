/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

module.exports = [
  'Lisätty ilmoitukset. Ilmoituksia tulee BläkkisVuohen päivityksien yhteydessä, ja ne näkee ekaa kertaa päivityksen jälkeen jotain komentoa käytettäessä.',
  '15.1.2018 - korjattu /moro bugi, joka aiheutti sen, ettei uusiin ryhmiin voinut liittyä.',
  '17.1.2018 - korjattu /tunnus bugi, jolloin uusia käyttäjiä ei pystynyt tekemään.',
  '23.1.2018 - useita taustamuutoksia jotta virhetilanteet saadaan korjattua nopeammin.',
  '10.4.2018\n\n- /juoma ja /jalkikellotus hyväksyy nyt pilkut desimaalinumeroissa.\n- /jalkikellotus -komentoon ei tarvitse kirjoittaa enää juoman nimeä. \n- korjattu /jalkikellotus -bugi, jonka takia usean rivin syöttö ei toiminut.',
  '15.4.2018\n\nLisätty uusi komento: /wappu - listaa Otaniemen termisestä wapusta eli 10.4. alkaen juodut juomat.',
  '18.4.2018\n\nLisätty uusi komento: /poistu - Poistu ryhmän kaikista listauksista, esim. promille- ja stats-listauksista.',
  '19.5.2018\n\nBläkkisvuohi v4 (beta) on täällä! Pääset käyttämään uutta Bläkkisvuohea /start-komennolla privaviestinä. Ei huolta - kaikki vanhat komennot toimivat vielä myös.',
  '20.5.2018\n\nMonia parannuksia Bläkkisvuohi v4:seen eli /start -komentoon. Mm. pikanäppäimet viimeisimmille juomille ja paljon muuta!',
  '2.6.2018\n\n- Lisätty /stats2, joka listaa ryhmän top10-kuluttajat annoksissa!\n- Useita pieniä bugikorjauksia.',
  '--- On ilon ja onnen päivä! Bläkkisvuohi täyttää 1v! ---\n\nKiitos, että olet käyttänyt Bläkkisvuohea tämän sumean vuoden aikana. Ensiaskelistaan 28.6.2017 lähtien Bläkkis on kasvanut pienestä kilistä täysimittaiseksi vuoheksi, ja näiden 365 päivän aikana käyttäjiä on kertynyt mukaan yli 900! Vuohi on pitänyt tähän mennessä kirjaa noin 56000 juomasta, eli noin 150 juomasta päivässä.\n\nBläkkisvuohi 1v kunniaksi, on aika nostaa malja. Merkkaa siis tänään yksi juoma tilastoihin hienon taipaleen merkiksi. Tai huomenna. Tai milloin vain! Vuohi elää ja bläkkistelee sinun ansiosta!\n\nPäivityksiä:\n- /kuvaaja toimii privaatisti',
  "Bläkkisvuohen suruviikko - bää!\n\nTL;DR: Bläkkisvuohen palvelin ajetaan alas ja tietokanta poistetaan viikon päästä. Jos haluat ladata tietosi ennen sitä talteen, voit tehdä sen komennolla /data. Lisää tietoja alla.\n\nBläkkisvuohi täytti tänä vuonna 9 vuotta. 17121 eri käyttäjää ympäri Suomea palvellut virtuaalivuohi on aikojen saatossa estimoinut promilleja yhteensä 854431 kirjatusta juomasta 4312 eri ryhmässä ja privana. Vuohi on myös saanut huikeaa medianäkyvyyttä esim. Jaakko Keson instastoorissa! Hienosti.\n\nKuitenkin kaikki hyvä loppuu aikanaan, ja myös Bläkkisvuohenkin ansaitsee päästä eläkkeelle. Syynä tähän ovat lisääntyneet tietoturvariskit tekoälyn aikakaudella ja mun jaksaminen pitää botin tietokantaa turvassa. Vaikka henkilökohtaista dataa on suhteellisen vähän (id, paino, pituus, sukupuoli, juomat ajankohtineen, ryhmien metadata) verrattuna nykyajan mihin tahansa muuhun palveluun, niin silti sitä on, ja olen halunnut jo hetken vaan henkilökohtaisesti eroon siitä vastuusta. Nyt lisääntyneet tietoturvauhat vaan tuntuu sopivalta hetkeltä muutokselle.\n\nKaikki data tullaan poistamaan ensi viikon keskiviikkona. Sitä ennen jokainen voi halutessaan ladata kaikki omaan käyttäjätunnukseensa liitetyt tiedot CSV-muodossa komennolla /data.\n\nJa näin alkaa Bläkkiksen suruviikko! Lörs lärä, meno on meno ja sitä rataa. Hyviä kellotteluja!"
];
