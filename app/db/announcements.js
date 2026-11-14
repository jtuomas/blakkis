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
    announcements.js
    Database storage and in-memory cache for bot announcements.
*/

'use strict';

const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const announcements = (module.exports = {});
let cachedMessages = null;

/**
 * Return all announcements in creation order. Uses an in-memory cache after the first read.
 */
announcements.getAll = function() {
  if (cachedMessages !== null) {
    return Promise.resolve(cachedMessages);
  }
  return pool.query('select message from announcements order by id asc').then(res => {
    cachedMessages = res.rows.map(row => row.message);
    return cachedMessages;
  });
};

/**
 * Insert a new announcement into the database and update the cache.
 * Resolves to the total number of announcements after insertion.
 */
announcements.add = function(message) {
  return pool.query('insert into announcements (message) values ($1)', [message]).then(() => {
    cachedMessages = null;
    return announcements.getAll().then(list => list.length);
  });
};

/**
 * Clear the in-memory cache (used in tests and after schema seeding).
 */
announcements.resetCache = function() {
  cachedMessages = null;
};

/**
 * Remove all announcements from the database and clear the cache (for tests).
 */
announcements.clear = function() {
  return pool.query('delete from announcements').then(() => {
    cachedMessages = null;
  });
};
