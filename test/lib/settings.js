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

'use strict';

const assert = require('assert');
const settings = require('../../app/settings.js');

describe('settings.js', function() {
  describe('parseAdminIds', function() {
    it('parses comma-separated ADMIN_IDS and ignores invalid entries', function() {
      assert.deepEqual(settings.parseAdminIds(' 123, 456 , ,abc, 123 ', undefined), [123, 456]);
    });

    it('falls back to ADMIN_ID and deduplicates', function() {
      assert.deepEqual(settings.parseAdminIds(undefined, '789'), [789]);
      assert.deepEqual(settings.parseAdminIds('123,456', '456'), [123, 456]);
    });

    it('returns empty array when neither is set', function() {
      assert.deepEqual(settings.parseAdminIds(undefined, undefined), []);
    });
  });

  describe('isAdmin', function() {
    it('matches any id in admin_ids and stays compatible with admin_id', function() {
      const originalIds = settings.admin_ids;
      try {
        settings.admin_ids = [101, 202];
        assert.equal(settings.isAdmin(101), true);
        assert.equal(settings.isAdmin(202), true);
        assert.equal(settings.isAdmin(303), false);
        assert.equal(settings.admin_id, 101);

        settings.admin_id = 404;
        assert.deepEqual(settings.admin_ids, [404]);
        assert.equal(settings.isAdmin(404), true);
      } finally {
        settings.admin_ids = originalIds;
      }
    });
  });
});
