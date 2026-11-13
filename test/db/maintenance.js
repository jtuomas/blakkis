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
    unit tests for removing old data
*/

/* globals describe, it, beforeEach */

'use strict';

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const maintenance = require('../../app/db/maintenance.js');
const users = require('../../app/db/users.js');
const pg = require('pg');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

function count(table, userId) {
  return pool
    .query(`select count(*)::int as count from ${table} where userId=$1`, [userId])
    .then(res => res.rows[0].count);
}

describe('maintenance.js', function() {
  beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);

  describe('maintenance.upgradeSchema()', function() {
    it('should be safe to run on an up to date database', function() {
      return maintenance.upgradeSchema().then(() => maintenance.upgradeSchema());
    });
  });

  describe('maintenance.purgeOldData()', function() {
    it('should delete only drinks older than the retention time', function() {
      const userId = blakkistest.users[0].userId;
      return pool
        .query(
          "insert into users_drinks (userid, alcohol, description, created) values ($1, 1000, 'vanha', now() - interval '31 days'), ($1, 1000, 'tuore', now() - interval '29 days')",
          [userId],
        )
        .then(() => maintenance.purgeOldData(30, 365))
        .then(deleted => {
          assert.equal(deleted.drinks, 1);
          assert.equal(deleted.users, 0);
          return pool.query('select description from users_drinks where userId=$1', [userId]);
        })
        .then(res => {
          const descriptions = res.rows.map(row => row.description);
          assert(descriptions.indexOf('vanha') === -1);
          assert(descriptions.indexOf('tuore') !== -1);
          assert.equal(descriptions.length, 3);
        });
    });

    it('should delete every row of inactive users and keep active users', function() {
      const inactiveId = blakkistest.users[0].userId;
      const activeId = blakkistest.users[1].userId;
      return Promise.all([count('users_in_groups', inactiveId), count('users_drinks', inactiveId)])
        .then(counts => {
          // Make sure there is something to delete
          assert(counts[0] > 0);
          assert(counts[1] > 0);
          return pool.query(
            "update users set last_active = now() - interval '366 days' where userId=$1",
            [inactiveId],
          );
        })
        .then(() => maintenance.purgeOldData(30, 365))
        .then(deleted => {
          assert.equal(deleted.users, 1);
          return Promise.all([
            count('users', inactiveId),
            count('users_in_groups', inactiveId),
            count('users_drinks', inactiveId),
            count('users', activeId),
            count('users_drinks', activeId),
          ]);
        })
        .then(counts => {
          assert.deepEqual(counts, [0, 0, 0, 1, 1]);
        });
    });
  });

  describe('last_active', function() {
    it('should be updated when a user marks a drink', function() {
      const userId = blakkistest.users[1].userId;
      return pool
        .query("update users set last_active = now() - interval '100 days' where userId=$1", [
          userId,
        ])
        .then(() => users.find(blakkistest.realIds[1]))
        .then(user => user.drinkBooze(1000, 'kalja'))
        .then(() =>
          pool.query(
            "select last_active > now() - interval '1 minute' as recent from users where userId=$1",
            [userId],
          ),
        )
        .then(res => assert.equal(res.rows[0].recent, true));
    });
  });
});
