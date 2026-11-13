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
    web.js
    Web endpoints for HTTPS webhook bot setups (like Heroku)
*/

'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const log = require('loglevel').getLogger('system');
const utils = require('./app/lib/utils.js');

// Telegram sends the secret token given to setWebHook in this header
function hasValidSecret(req, res, next) {
  const expected = Buffer.from(utils.webhookSecret());
  const given = Buffer.from(req.get('x-telegram-bot-api-secret-token') || '');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return res.sendStatus(401);
  }
  next();
}

function createApp(bot) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/', (req, res) => {
    res.send('ok');
  });

  // The secret is checked before the body is parsed
  app.post('/telegram', hasValidSecret, bodyParser.json(), (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  return app;
}

// Web endpoints for HTTPS webhook bot setups (like Heroku)
module.exports = function(bot) {
  const server = createApp(bot).listen(process.env.PORT, '0.0.0.0', () => {
    log.info('Web server started at http://%s:%s', server.address().address, server.address().port);
  });
};
module.exports.createApp = createApp;
