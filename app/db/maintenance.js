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
    maintenance.js
    Schema upgrades and removal of old data, so that drink history and
    profiles of inactive users are not stored forever.
*/

'use strict';
const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const log = require('loglevel').getLogger('db');
const settings = require('../settings.js');

let maintenance = (module.exports = {});

// Bring an existing database up to date with app/schema.sql
maintenance.upgradeSchema = function() {
  return pool.query(
    'alter table users add column if not exists last_active timestamp with time zone not null default now()',
  );
};

// Delete drinks older than drinkDays and every row of users who have not
// marked a drink in inactiveUserDays. Resolves to the deleted row counts.
maintenance.purgeOldData = function(drinkDays, inactiveUserDays) {
  drinkDays = drinkDays || settings.drink_retention_days;
  inactiveUserDays = inactiveUserDays || settings.inactive_user_retention_days;

  return pool.connect().then(client => {
    const inactiveUsers =
      "select userId from users where last_active < now() - make_interval(days => $1)";
    return client
      .query('begin')
      .then(() =>
        client.query(
          "delete from users_drinks where created < now() - make_interval(days => $1)",
          [drinkDays],
        ),
      )
      .then(oldDrinks =>
        client
          .query(`delete from users_in_groups where userId in (${inactiveUsers})`, [
            inactiveUserDays,
          ])
          .then(() =>
            client.query(`delete from users_drinks where userId in (${inactiveUsers})`, [
              inactiveUserDays,
            ]),
          )
          .then(inactiveDrinks =>
            client
              .query('delete from users where last_active < now() - make_interval(days => $1)', [
                inactiveUserDays,
              ])
              .then(deletedUsers => ({
                drinks: oldDrinks.rowCount + inactiveDrinks.rowCount,
                users: deletedUsers.rowCount,
              })),
          ),
      )
      .then(deleted =>
        client.query('commit').then(() => {
          log.info(`Purged ${deleted.drinks} old drinks and ${deleted.users} inactive users`);
          return deleted;
        }),
      )
      .catch(err => client.query('rollback').then(() => Promise.reject(err)))
      .finally(() => client.release());
  });
};

// Upgrade the schema, purge now and then purge every hour
maintenance.start = function() {
  const purge = () =>
    maintenance.purgeOldData().catch(err => {
      log.error('Purging old data failed');
      log.error(err);
    });
  return maintenance
    .upgradeSchema()
    .then(purge)
    .then(() => setInterval(purge, 60 * 60 * 1000));
};
