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
    init.js
    Initialize Bläkkisvuohi, set hooks & load enabled commands

*/

'use strict';

module.exports = function(bot) {
  const Commands = require('./lib/commands.js');
  const utils = require('./lib/utils.js');
  const ratelimit = require('./lib/ratelimit.js');
  const strings = require('./strings.js');
  const log = require('loglevel');
  const syslog = log.getLogger('system');

  syslog.info('Current date and time is ' + new Date().toString());

  // True if the sender is over the rate limit and the message must be ignored.
  // The user is told about the limit once, not on every ignored message.
  function isRateLimited(msg) {
    const result = ratelimit.check(msg.from.id);
    if (result === ratelimit.NOTIFY) {
      msg.sendPrivateMessage(strings.commands.blakkis.rate_limited).catch(() => {});
    }
    return result !== ratelimit.ALLOW;
  }

  // Initialize message hook to Command framework
  bot.on('message', msg => {
    syslog.debug('message in a ' + msg.chat.type + ' chat');

    utils.attachMethods(msg, bot);

    if (!isRateLimited(msg)) {
      Commands.rawCall(msg);
    }
  });

  bot.on('callback_query', msg => {
    syslog.debug('callback query');
    utils.attachMethods(msg, bot);

    if (!isRateLimited(msg)) {
      Commands.call('', msg, []);
    }
  });

  // Remove old drinks and inactive users regularly
  require('./db/maintenance.js')
    .start()
    .catch(err => {
      syslog.error('Database maintenance could not be started');
      syslog.error(err);
    });

  // Enable commands here.
  require('./commands/about.js');
  require('./commands/annokset.js');
  require('./commands/data.js');
  require('./commands/help.js');
  require('./commands/jalkikellotus.js');
  require('./commands/juoma.js');
  require('./commands/kalja033.js');
  require('./commands/kalja05.js');
  require('./commands/komennot.js');
  require('./commands/kuvaaja.js');
  require('./commands/laatta.js');
  require('./commands/moro.js');
  require('./commands/poistu.js');
  require('./commands/promillet.js');
  require('./commands/start.js');
  require('./commands/stats.js');
  require('./commands/stats2.js');
  require('./commands/terms.js');
  require('./commands/tunnus.js');
  require('./commands/whoami.js');

  // Admin commands
  require('./commands/admin_loglevel.js');
  require('./commands/admin_stats.js');
};
