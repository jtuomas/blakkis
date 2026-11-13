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
    /lampokartta
    Heat map of everyone's permilles over the last 24 hours and the forecast: one row per person,
    so it works also when the group is too big for the line chart of /kuvaaja.
*/
'use strict';

const log = require('loglevel').getLogger('commands');
const Commands = require('../lib/commands.js');
const chartdata = require('../lib/chartdata.js');
const heatmap = require('../lib/heatmap.js');
const groups = require('../db/groups.js');
const strings = require('../strings.js');

function lampokartta(context, msg, words, user) {
  log.debug('Trying to form heat map image');

  const title = strings.commands.lampokartta.graph_title.format({
    chat_title: msg.chat.title || user.username,
  });
  context.end();

  const group = new groups.Group(msg.chat.id);
  const drinkTimes = context.isPrivateChat()
    ? user.getDrinkTimesByUser()
    : group.getDrinkTimesByUser();

  return drinkTimes.then(drinksByUser => {
    const { rows, nowIndex } = chartdata.getRows(
      drinksByUser,
      chartdata.lastNHours,
      chartdata.predictNHours,
    );
    if (rows.length === 0) {
      return context.chatReply(strings.commands.lampokartta.no_drinks);
    }
    const caption =
      rows.length > heatmap.maxRows
        ? strings.commands.lampokartta.title_truncated.format({
            title: title,
            shown: heatmap.maxRows,
            total: rows.length,
          })
        : title;
    return context.photoReply(heatmap.getHeatmapBuffer(rows, nowIndex, title), caption);
  });
}

Commands.register(
  '/lampokartta',
  strings.commands.lampokartta.cmd_description,
  Commands.SCOPE_ALL,
  Commands.PRIVILEGE_USER,
  Commands.TYPE_SINGLE,
  lampokartta,
);
