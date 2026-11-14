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
require('../../app/commands/admin_status.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');
const settings = require('../../app/settings.js');
const pkg = require('../../package.json');

describe('admin_status.js', function() {
  it('Calling /admin_status should print bot version and status', function(done) {
    const mocked = blakkistest.mockMsgAndBot();
    mocked.msg.from.id = settings.admin_id;
    Commands.call('/admin_status', mocked.msg, ['/admin_status'])
      .then(() => {
        assert.equal(mocked.internals.sentChatId, mocked.msg.from.id);
        assert(mocked.internals.sentText.includes(pkg.version));
        assert(mocked.internals.sentText.includes('Tietokanta: ok'));
        done();
      })
      .catch(err => done(err));
  });
});
