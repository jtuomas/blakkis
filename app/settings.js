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
    settings.js
    Contains all settings
*/

'use strict';

function parseAdminIds(rawIds, fallbackId) {
  const raw = [rawIds, fallbackId].filter(Boolean).join(',');
  const ids = raw
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(Number.isInteger);
  return [...new Set(ids)];
}

const settings = {
  log_system_level: 'info',
  log_db_level: 'info',
  log_commands_level: 'info',
  // Telegram user ids of the bot admins. Without any there is no admin and
  // unknown errors are not forwarded to anyone.
  admin_ids: parseAdminIds(process.env.ADMIN_IDS, process.env.ADMIN_ID),
  get admin_id() {
    return this.admin_ids.length > 0 ? this.admin_ids[0] : null;
  },
  set admin_id(id) {
    this.admin_ids = id === null || id === undefined ? [] : [id];
  },
  isAdmin(userId) {
    return this.admin_ids.includes(userId);
  },
  bot_username: (process.env.BOT_USERNAME || 'blakkisvuohibot').toLowerCase(),
  // Shown to users in /about, /help and the privacy policy
  maintainer_name: process.env.MAINTAINER_NAME || 'the maintainers',
  maintainer_contact:
    process.env.MAINTAINER_CONTACT || 'https://github.com/jtuomas/blakkis/issues',
  // Drinks are deleted after this many days, and users who have not marked a
  // drink in inactive_user_retention_days are deleted completely
  drink_retention_days: parseInt(process.env.DRINK_RETENTION_DAYS, 10) || 30,
  inactive_user_retention_days: parseInt(process.env.INACTIVE_USER_RETENTION_DAYS, 10) || 365,
  // Messages one user (other than an admin) can send per minute before being ignored
  rate_limit_per_minute: parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 20,
  parseAdminIds,
};

module.exports = settings;
