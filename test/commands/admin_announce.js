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

/* globals describe, it */

'use strict';
require('../../app/commands/admin_announce.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');
const settings = require('../../app/settings.js');
const announcementsDb = require('../../app/db/announcements.js');

describe('admin_announce.js', function() {
  afterEach(function() {
    return announcementsDb.clear();
  });

  it('Calling /admin_announce without text should show usage', function(done) {
    const mocked = blakkistest.mockMsgAndBot();
    mocked.msg.from.id = settings.admin_id;
    mocked.msg.text = '/admin_announce';
    Commands.call('/admin_announce', mocked.msg, ['/admin_announce'])
      .then(() => {
        assert.equal(mocked.internals.sentChatId, mocked.msg.from.id);
        assert(mocked.internals.sentText.includes('Käyttö: /admin_announce'));
        done();
      })
      .catch(err => done(err));
  });

  it('Calling /admin_announce with text should add announcement to db', function(done) {
    const mocked = blakkistest.mockMsgAndBot();
    mocked.msg.from.id = settings.admin_id;
    mocked.msg.text = '/admin_announce Huoltokatko huomenna';
    Commands.call('/admin_announce', mocked.msg, ['/admin_announce', 'Huoltokatko', 'huomenna'])
      .then(() => announcementsDb.getAll())
      .then(list => {
        assert.equal(mocked.internals.sentChatId, mocked.msg.from.id);
        assert(mocked.internals.sentText.includes('Tiedote #'));
        assert(list.includes('Huoltokatko huomenna'));
        done();
      })
      .catch(err => done(err));
  });
});
