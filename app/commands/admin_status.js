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
    /admin_status
    Shows bot version, uptime, memory usage, admin count and database connectivity.
*/
'use strict';

const Commands = require('../lib/commands.js');
const stats = require('../db/stats.js');
const settings = require('../settings.js');
const strings = require('../strings.js');
const pkg = require('../../package.json');

function formatUptime(seconds) {
  const totalMinutes = Math.floor(seconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  return `${days}d ${hours}h ${mins}m`;
}

function adminStatus(context) {
  return stats
    .ping()
    .then(ms => `ok (${ms} ms)`)
    .catch(err => `virhe (${err.message})`)
    .then(dbStatus => {
      const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
      return context.privateReply(
        strings.commands.admin_status.status_text.format({
          version: pkg.version,
          uptime: formatUptime(process.uptime()),
          memoryMb: memoryMb,
          adminCount: settings.admin_ids.length,
          dbStatus: dbStatus,
        }),
      );
    });
}

Commands.register(
  '/admin_status',
  strings.commands.admin_status.cmd_description,
  Commands.SCOPE_PRIVATE,
  Commands.PRIVILEGE_ADMIN,
  Commands.TYPE_SINGLE,
  adminStatus,
);
