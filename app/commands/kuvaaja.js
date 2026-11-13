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
    /kuvaaja
*/
'use strict';

const log = require('loglevel').getLogger('commands');
const Commands = require('../lib/commands.js');
const alcomath = require('../lib/alcomath.js');
const utils = require('../lib/utils.js');
const groups = require('../db/groups.js');
const users = require('../db/users.js');
const linechart = require('../lib/linechart.js');
const strings = require('../strings.js');

const lastNHours = 24;
const predictNHours = 12;

// Build Chart.js data with one colored line per user who has had alcohol in the
// chart's time window. Each user gets a solid line for the past and a dashed
// line for the prediction in the same color.
function buildChartData(drinksByUser) {
  const labels = [];
  const datasets = [];
  for (let userId in drinksByUser) {
    const details = drinksByUser[userId];
    const user = new users.User(
      details.userid,
      details.nick,
      details.weight,
      details.gender,
      details.height,
    );
    const permillesByHour = alcomath.calculateEBACByHourFromDrinks(
      user,
      details.drinks,
      lastNHours,
      predictNHours,
    );
    if (!permillesByHour.some(hour => hour.permilles > 0)) {
      continue;
    }

    const permillesLastNHours = [];
    const permillesPredictNHours = [];
    for (let i = 0; i < permillesByHour.length; i += 1) {
      if (labels.length < permillesByHour.length) {
        labels.push(permillesByHour[i].hour);
      }
      if (i <= lastNHours) {
        permillesLastNHours[i] = permillesByHour[i].permilles;
      }
      if (i >= lastNHours) {
        permillesPredictNHours[i] = permillesByHour[i].permilles;
      }
    }

    const color = utils.getChartColor(datasets.length / 2);
    datasets.push({
      label: details.nick,
      data: permillesLastNHours,
      fill: false,
      backgroundColor: color,
      borderColor: color,
    });
    datasets.push({
      label: '', // hidden from the legend, the solid line already names the user
      data: permillesPredictNHours,
      fill: false,
      backgroundColor: color,
      borderColor: color,
      borderDash: [5, 15],
    });
  }
  return { labels: labels, datasets: datasets };
}

function kuvaaja(context, msg, words, user) {
  log.debug('Trying to form graph image');

  const graphTitle = strings.commands.kuvaaja.graph_title.format({
    chat_title: msg.chat.title || user.username,
  });
  context.end();

  const group = new groups.Group(msg.chat.id);
  const drinkTimes = context.isPrivateChat()
    ? user.getDrinkTimesByUser()
    : group.getDrinkTimesByUser();

  return drinkTimes
    .then(drinksByUser => linechart.getLineGraphBuffer(buildChartData(drinksByUser), graphTitle))
    .then(buffer => context.photoReply(buffer, graphTitle));
}

Commands.register(
  '/kuvaaja',
  strings.commands.kuvaaja.cmd_description,
  Commands.SCOPE_ALL,
  Commands.PRIVILEGE_USER,
  Commands.TYPE_SINGLE,
  kuvaaja,
);

module.exports = { buildChartData };
