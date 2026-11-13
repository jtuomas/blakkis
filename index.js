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
    index.js
    Main entrypoint, initialize tg-bot and then start to initialize 
    the possible web server and finally the app.
*/

'use strict';

const TOKEN = process.env.TOKEN;
const NEWRELIC = process.env.NEWRELIC === 'true';
if (NEWRELIC) {
  global.newrelic = require('newrelic');
}

// Opt in to promise cancellation and file name fixes, silences the library's deprecation warnings
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const Bot = require('node-telegram-bot-api');
const BOT_MODE = process.env.BOT_MODE || 'polling';
const loglevel = require('loglevel');
const settings = require('./app/settings.js');
const log = loglevel.getLogger('system');

// Set before the database upgrade, otherwise its info messages are not shown
loglevel.getLogger('system').setLevel(settings.log_system_level);
loglevel.getLogger('db').setLevel(settings.log_db_level);
loglevel.getLogger('commands').setLevel(settings.log_commands_level);

log.info('Set system log level to ' + settings.log_system_level);
log.info('Set db log level to ' + settings.log_db_level);
log.info('Set commands log level to ' + settings.log_commands_level);

// A failed request caused by one message must not crash the whole bot
process.on('unhandledRejection', reason => {
  log.error('Unhandled promise rejection');
  log.error(reason);
});

function start() {
  // Setup bot
  let bot;

  if (BOT_MODE === 'polling') {
    const botOptions = {
      polling: true, // used when no HTTPS:// connection available
    };
    bot = new Bot(TOKEN, botOptions);
  } else {
    bot = new Bot(TOKEN);

    // This informs the Telegram servers of the new webhook. Telegram sends the
    // secret token back in a header, which web.js checks.
    // Note: we do not need to pass in the cert, as it already provided
    bot
      .setWebHook(process.env.APP_URL.replace(/\/+$/, '') + '/telegram', {
        secret_token: require('./app/lib/utils.js').webhookSecret(),
      })
      .catch(err => {
        log.error('Setting the webhook failed');
        log.error(err);
      });

    // Load web server
    require('./web.js')(bot);
  }

  // Load app
  require('./app/init.js')(bot);

  log.info('BläkkisVuohi started in ' + BOT_MODE + ' mode');
}

const exitWith = message => err => {
  log.error(message);
  log.error(err);
  process.exit(1);
};

// The ids in the database must be up to date before the bot handles any message, otherwise
// every existing user would look unregistered. Running with a half upgraded database is worse
// than not running, so a failure stops the process.
require('./app/db/maintenance.js')
  .upgradeSchema()
  .then(start, exitWith('Database upgrade failed, not starting the bot'))
  .catch(exitWith('Starting the bot failed'));
