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

/*
    chartdata.js
    Hourly permille series of the people in a chart, shared by the line chart (/kuvaaja) and
    the heat map (/lampokartta).
*/

'use strict';

const alcomath = require('./alcomath.js');
const users = require('../db/users.js');

const chartdata = (module.exports = {});

const pad2 = number => ('0' + number).slice(-2);

chartdata.formatTime = time => pad2(time.getHours()) + ':' + pad2(time.getMinutes());

/*
    Everyone who has had alcohol in the window, the one with the highest peak first. Each row
    has the nick, the permilles of every hour (values) and the matching times (series). The
    window starts an hour before the first drink, not at the start of the look-back period, so
    an evening chart is not mostly empty. nowIndex is the index of the last full hour: values
    up to it are the past and from it on the forecast.
*/
chartdata.getRows = function(drinksByUser, lastNHours, predictNHours) {
  const rows = [];
  for (let userId in drinksByUser) {
    const details = drinksByUser[userId];
    const user = new users.User(
      details.userid,
      details.nick,
      details.weight,
      details.gender,
      details.height,
    );
    const series = alcomath.calculateEBACByHourFromDrinks(
      user,
      details.drinks,
      lastNHours,
      predictNHours,
    );
    const values = series.map(hour => hour.permilles);
    if (!values.some(value => value > 0)) {
      continue;
    }
    rows.push({ nick: details.nick, series: series, values: values, peak: Math.max(...values) });
  }
  rows.sort((a, b) => b.peak - a.peak);

  let firstHour = lastNHours;
  rows.forEach(row => {
    const index = row.values.findIndex(value => value > 0);
    if (index >= 0 && index < firstHour) {
      firstHour = index;
    }
  });
  const start = Math.max(0, firstHour - 1);
  rows.forEach(row => {
    row.series = row.series.slice(start);
    row.values = row.values.slice(start);
  });

  return { rows: rows, nowIndex: lastNHours - start };
};
