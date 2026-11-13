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
    ratelimit.js
    Limits how many messages a single user can send to the bot per minute, so
    that expensive commands (like the chart rendering) cannot be used to
    overload the bot. The counters live in memory only.
*/

'use strict';

const settings = require('../settings.js');

const WINDOW_MILLIS = 60 * 1000;
const ratelimit = (module.exports = {});

ratelimit.ALLOW = 'allow';
// Over the limit, the first time in a while: the user should be told
ratelimit.NOTIFY = 'notify';
// Over the limit, already told: ignore silently
ratelimit.DROP = 'drop';

let users = new Map();
let lastSweep = 0;

// Forget users who have not sent anything within the window
function sweep(now) {
  if (now - lastSweep < WINDOW_MILLIS) {
    return;
  }
  lastSweep = now;
  users.forEach((state, userId) => {
    if (state.times.every(time => now - time >= WINDOW_MILLIS)) {
      users.delete(userId);
    }
  });
}

ratelimit.check = function(userId, now) {
  now = now === undefined ? Date.now() : now;
  if (userId === settings.admin_id) {
    return ratelimit.ALLOW;
  }
  sweep(now);

  let state = users.get(userId);
  if (!state) {
    state = { times: [], notified: false };
    users.set(userId, state);
  }
  state.times = state.times.filter(time => now - time < WINDOW_MILLIS);

  if (state.times.length >= settings.rate_limit_per_minute) {
    if (state.notified) {
      return ratelimit.DROP;
    }
    state.notified = true;
    return ratelimit.NOTIFY;
  }
  state.notified = false;
  state.times.push(now);
  return ratelimit.ALLOW;
};

ratelimit.reset = function() {
  users = new Map();
  lastSweep = 0;
};
