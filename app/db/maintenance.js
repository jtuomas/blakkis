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
const utils = require('../lib/utils.js');

let maintenance = (module.exports = {});

// Columns that hold a hashed Telegram user or group id
const ID_COLUMNS = [
  ['users', 'userId'],
  ['users_drinks', 'userId'],
  ['users_in_groups', 'userId'],
  ['users_in_groups', 'groupId'],
];

// Replace the plain sha256 ids with the ones keyed with SECRET (see utils.hashId).
// Resolves to the number of distinct ids that were converted.
function rehashIds(client) {
  return Promise.all(
    ID_COLUMNS.map(([table, column]) =>
      client.query(`select distinct ${column} as id from ${table}`).then(res => ({
        table,
        column,
        ids: res.rows.map(row => row.id),
      })),
    ),
  ).then(found =>
    found.reduce(
      (previous, { table, column, ids }) =>
        previous.then(converted =>
          ids
            .reduce(
              (updated, id) =>
                updated.then(() =>
                  client.query(`update ${table} set ${column}=$1 where ${column}=$2`, [
                    utils.rehashId(id),
                    id,
                  ]),
                ),
              Promise.resolve(),
            )
            .then(() => converted + ids.length),
        ),
      Promise.resolve(0),
    ),
  );
}

// Runs once per database, the schema_meta row tells that it has been done. The tables are
// locked so that two instances starting at the same time cannot both convert the ids.
maintenance.migrateIdHashes = function() {
  return pool.connect().then(client =>
    client
      .query('begin')
      .then(() =>
        client.query(
          'lock table users, users_drinks, users_in_groups, schema_meta in access exclusive mode',
        ),
      )
      .then(() => client.query("select value from schema_meta where key='id_hash'"))
      .then(res => {
        if (res.rows.length > 0 && res.rows[0].value === 'hmac') {
          return 0;
        }
        return rehashIds(client).then(converted =>
          client
            .query(
              "insert into schema_meta (key, value) values ('id_hash', 'hmac') on conflict (key) do update set value=excluded.value",
            )
            .then(() => converted),
        );
      })
      .then(converted => client.query('commit').then(() => converted))
      .catch(err => client.query('rollback').then(() => Promise.reject(err)))
      .finally(() => client.release()),
  );
};

// Bring an existing database up to date with app/schema.sql
maintenance.upgradeSchema = function() {
  return pool
    .query(
      'alter table users add column if not exists last_active timestamp with time zone not null default now()',
    )
    .then(() =>
      pool.query(
        'create table if not exists schema_meta (key text primary key, value text not null)',
      ),
    )
    .then(() => maintenance.migrateIdHashes())
    .then(converted => {
      if (converted > 0) {
        log.info(`Converted ${converted} ids to keyed hashes`);
      }
    });
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
