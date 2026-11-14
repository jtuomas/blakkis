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
    /admin_announce
    Adds a new announcement to the database so every user sees it once on their next command.
*/
'use strict';

const Commands = require('../lib/commands.js');
const announcementsDb = require('../db/announcements.js');
const strings = require('../strings.js');

function adminAnnounce(context, msg) {
  const rawText = (msg.text || '').replace(/^\/\S+/, '').trim();
  if (!rawText) {
    return announcementsDb.getAll().then(list =>
      context.privateReply(
        strings.commands.admin_announce.usage.format({
          count: list.length,
        }),
      ),
    );
  }

  return announcementsDb.add(rawText).then(count =>
    context.privateReply(
      strings.commands.admin_announce.added.format({
        count: count,
      }),
    ),
  );
}

Commands.register(
  '/admin_announce',
  strings.commands.admin_announce.cmd_description,
  Commands.SCOPE_PRIVATE,
  Commands.PRIVILEGE_ADMIN,
  Commands.TYPE_SINGLE,
  adminAnnounce,
);
