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
const chartdata = require('../lib/chartdata.js');
const utils = require('../lib/utils.js');
const groups = require('../db/groups.js');
const linechart = require('../lib/linechart.js');
const strings = require('../strings.js');

// The legend has to fit next to the chart, so this many people at most
const maxLines = 60;

const markerEveryOtherHour = point => (point.dataIndex % 2 === 0 ? 5 : 0);

// Build Chart.js data with one line per user who has had alcohol in the chart's time window,
// the highest peak first. Each user has their own combination of a color and a marker shape,
// a solid line for the past and a dashed line for the prediction in the same color and shape.
function buildChartData(drinksByUser) {
  const { rows, nowIndex } = chartdata.getRows(
    drinksByUser,
    chartdata.lastNHours,
    chartdata.predictNHours,
  );
  const shown = rows.slice(0, maxLines);
  const datasets = [];
  shown.forEach((row, i) => {
    const color = utils.getChartColor(i);
    const style = {
      fill: false,
      backgroundColor: color,
      borderColor: color,
      borderWidth: 2,
      pointStyle: utils.getChartShape(i),
      pointBackgroundColor: color,
      pointBorderColor: color,
      pointBorderWidth: 2,
      pointRadius: markerEveryOtherHour,
    };
    const past = [];
    const future = [];
    row.values.forEach((permilles, hour) => {
      if (hour <= nowIndex) {
        past[hour] = permilles;
      }
      if (hour >= nowIndex) {
        future[hour] = permilles;
      }
    });
    datasets.push(Object.assign({ label: row.nick, data: past }, style));
    // No label so that it is hidden from the legend, the solid line already names the user
    datasets.push(Object.assign({ label: '', data: future, borderDash: [6, 6] }, style));
  });
  return {
    labels: shown.length > 0 ? shown[0].series.map(hour => chartdata.formatTime(hour.time)) : [],
    datasets: datasets,
    totalCount: rows.length,
  };
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

  return drinkTimes.then(drinksByUser => {
    const chartData = buildChartData(drinksByUser);
    const caption =
      chartData.totalCount > maxLines
        ? strings.commands.kuvaaja.graph_title_truncated.format({
            graph_title: graphTitle,
            shown: maxLines,
            total: chartData.totalCount,
          })
        : graphTitle;
    return linechart
      .getLineGraphBuffer(chartData, graphTitle)
      .then(buffer => context.photoReply(buffer, caption));
  });
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
