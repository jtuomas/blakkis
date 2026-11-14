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
    /admin_groups
    Shows anonymized group summary and member counts for admins.
*/
'use strict';

const Commands = require('../lib/commands.js');
const stats = require('../db/stats.js');
const strings = require('../strings.js');

function adminGroups(context) {
  return stats.getGroupSummary().then(summary => {
    const sizesList =
      summary.topGroupSizes.length > 0
        ? summary.topGroupSizes.map((count, idx) => `${idx + 1}. ${count} käyttäjää`).join('\n')
        : strings.commands.admin_groups.no_groups;

    return context.privateReply(
      strings.commands.admin_groups.groups_text.format({
        totalGroups: summary.totalGroups,
        activeGroups14Days: summary.activeGroups14Days,
        sizesList: sizesList,
      }),
    );
  });
}

Commands.register(
  '/admin_groups',
  strings.commands.admin_groups.cmd_description,
  Commands.SCOPE_PRIVATE,
  Commands.PRIVILEGE_ADMIN,
  Commands.TYPE_SINGLE,
  adminGroups,
);
