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
    utils.js
    Commonly used functions.
*/

'use strict';

const log = require('loglevel').getLogger('system');
const constants = require('../constants.js');
const crypto = require('crypto');
const _secret_ = process.env.SECRET;
let utils = (module.exports = {});

utils.getDateMinusHours = function(hours) {
  const hoursAgo = new Date(Date.now() - hours * constants.HOUR_IN_MILLIS);
  return hoursAgo;
};

function createSendPrivateMsgFunction(msg, bot) {
  return function(text) {
    return bot
      .sendMessage(msg.from.id, text)
      .then(() => {
        log.debug('sent a private message');
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't send private msg! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

function createSendChatMsgFunction(msg, bot) {
  return function(text) {
    return bot
      .sendMessage(msg.chat.id, text)
      .then(() => {
        log.debug('sent ' + text + ' to chat ' + msg.chat.title);
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't send chat msg! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

function createSendMsgToFunction(msg, bot) {
  return function(chatId, text, options) {
    return bot
      .sendMessage(chatId, text, options)
      .then(() => {
        log.debug('sent ' + text + ' to chat ' + chatId);
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't send msg! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

function createSendPhotoFunction(msg, bot) {
  return function(chatId, stream, options) {
    return bot
      .sendPhoto(chatId, stream, options)
      .then(() => {
        log.debug('sent photo to chat ' + chatId);
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't send photo! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

function createSendDocumentFunction(msg, bot) {
  return function(chatId, buffer, options, fileOptions) {
    return bot
      .sendDocument(chatId, buffer, options, fileOptions)
      .then(() => {
        log.debug('sent document to chat ' + chatId);
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't send document! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

function createEditMessageTextFunction(msg, bot) {
  return function(text, options) {
    return bot
      .editMessageText(text, options)
      .then(() => {
        log.debug('edited message');
        return Promise.resolve();
      })
      .catch(err => {
        log.error("couldn't edit message! Err: " + err);
        log.debug(err.stack);
        return Promise.reject(err);
      });
  };
}

utils.hookNewRelic = function(url, func) {
  return new Promise(function(resolve, reject) {
    if (global.newrelic && global.newrelic.startWebTransaction) {
      global.newrelic.startWebTransaction(url, function() {
        let p = func();
        if (p && p.then) {
          p.then(() => {
            global.newrelic.getTransaction().end();
            resolve();
          }).catch(err => {
            global.newrelic.noticeError(err);
            global.newrelic.getTransaction().end();
            reject(err);
          });
        } else {
          global.newrelic.getTransaction().end();
          resolve();
        }
      });
    } else {
      let p = func();
      if (p && p.then) {
        p.then(() => {
          resolve();
        }).catch(err => reject(err));
      } else {
        resolve();
      }
    }
  });
};

utils.attachMethods = function attachMethods(msg, bot) {
  msg.sendPrivateMessage = createSendPrivateMsgFunction(msg, bot);
  msg.sendChatMessage = createSendChatMsgFunction(msg, bot);
  msg.sendMessage = createSendMsgToFunction(msg, bot);
  msg.sendPhoto = createSendPhotoFunction(msg, bot);
  msg.sendDocument = createSendDocumentFunction(msg, bot);
  msg.editMessageText = createEditMessageTextFunction(msg, bot);
};

utils.roundTo = (n, t) => {
  t = t || 0;
  return Math.round(n * Math.pow(10, t)) / Math.pow(10, t);
};

utils.getRandomFromArray = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

utils.isValidInt = function(num) {
  const n = Number(num);
  const int = parseInt(num, 10);
  return !isNaN(int) && (typeof int === 'number' || int instanceof Number) && int === n;
};

utils.isValidFloat = function(num) {
  const n = utils.toNumber(num);
  const float = utils.parseFloat(num);
  return !isNaN(float) && (typeof float === 'number' || float instanceof Number) && float === n;
};

utils.parseFloat = function(num) {
  if (typeof num === 'string') {
    // convert , to .
    return parseFloat(num.replace(/\,/g, '.'));
  } else if (typeof num === 'number') {
    return parseFloat(num);
  } else {
    return NaN;
  }
};

utils.toNumber = function(num) {
  if (typeof num === 'string') {
    // convert , to .
    return Number(num.replace(/\,/g, '.'));
  } else if (typeof num === 'number') {
    return Number(num);
  } else {
    return NaN;
  }
};

/*
    Line colors for charts, in the order they are handed out. All are clearly
    distinguishable from each other and readable on a white background.
*/
const chartPalette = [
  '#1f77b4', // blue
  '#d62728', // red
  '#2ca02c', // green
  '#ff7f0e', // orange
  '#9467bd', // purple
  '#17becf', // cyan
  '#e377c2', // pink
  '#8c564b', // brown
  '#bcbd22', // olive
  '#000000', // black
  '#393b79', // navy
  '#7f7f7f', // gray
];

utils.getColorSet = function() {
  return [].concat(chartPalette); // return a copy
};

// Color for the nth line of a chart; wraps around if there are more lines than colors
utils.getChartColor = function(n) {
  return chartPalette[n % chartPalette.length];
};

// Secret that Telegram sends back with every webhook request, derived so that
// it does not need an env variable of its own
utils.webhookSecret = function() {
  if (!_secret_) {
    throw new Error('SECRET is not set');
  }
  return crypto
    .createHmac('sha256', _secret_)
    .update('webhook')
    .digest('hex');
};

// Telegram ids are guessable, so the ids stored in the database are keyed with SECRET.
// The key is applied on top of the plain sha256 that was stored before it was introduced,
// which lets the old rows be converted without knowing the original ids.
let idKey;
function getIdKey() {
  if (!idKey) {
    if (!_secret_) {
      throw new Error('SECRET is not set');
    }
    idKey = crypto.scryptSync(_secret_, 'blakkisvuohi-id', 32);
  }
  return idKey;
}

utils.rehashId = function(sha256Hex) {
  return crypto
    .createHmac('sha256', getIdKey())
    .update(sha256Hex)
    .digest('hex');
};

utils.hashId = function(id) {
  return utils.rehashId(utils.hashSha256(id));
};

utils.hashSha256 = function(data) {
  const hash = crypto.createHash('sha256');
  hash.update('' + data); // tostring
  return hash.digest('hex');
};

// AES-256-GCM with a random IV. Output is hex of iv | auth tag | ciphertext.
let encryptionKey;
function getEncryptionKey() {
  if (!encryptionKey) {
    if (!_secret_) {
      throw new Error('SECRET is not set');
    }
    encryptionKey = crypto.scryptSync(_secret_, 'blakkisvuohi', 32);
  }
  return encryptionKey;
}

utils.encrypt = function(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('hex');
};

utils.decrypt = function(data) {
  const raw = Buffer.from(data, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
};

utils.groupDrinksByUser = drinks => {
  let drinksByUser = {};
  for (let i in drinks) {
    const drink = drinks[i];
    if (!drinksByUser[drink.userid]) {
      drinksByUser[drink.userid] = {
        userid: drink.userid,
        nick: utils.decrypt(drink.nick),
        weight: drink.weight,
        gender: drink.gender,
        height: drink.height,
        drinks: [],
      };
    }
    drinksByUser[drink.userid].drinks.push(drink);
  }
  return drinksByUser;
};

function toCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  let cell = value instanceof Date ? value.toISOString() : '' + value;
  // Stop spreadsheet programs from running user-entered text as a formula
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(cell)) {
    cell = "'" + cell;
  }
  return /[",\r\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
}

/*
    Forms an RFC 4180 CSV string. The leading byte order mark
    makes Excel read the file as UTF-8, so that ä and ö stay intact.
*/
utils.toCsv = (columns, rows) => {
  const lines = [columns].concat(rows.map(row => columns.map(column => row[column])));
  return '﻿' + lines.map(line => line.map(toCsvCell).join(',') + '\r\n').join('');
};

/*
    Placeholder string format
    https://stackoverflow.com/questions/18405736/is-there-a-c-sharp-string-format-equivalent-in-javascript
*/
String.prototype.format = function(placeholders) {
  let s = this;
  for (let propertyName in placeholders) {
    let re = new RegExp('{' + propertyName + '}', 'gm');
    s = s.replace(re, placeholders[propertyName]);
  }
  return s;
};

String.prototype.unformat = function() {
  return this.replace(/{.+}/g, '');
};
