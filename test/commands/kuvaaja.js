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
    kuvaaja.js
    unit tests for kuvaaja.js functions
*/

/* globals describe, it, beforeEach */

'use strict';
const kuvaaja = require('../../app/commands/kuvaaja.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');

function drinker(userid, nick, drinkHoursAgo) {
  return {
    userid: userid,
    nick: nick,
    weight: 80,
    gender: 'mies',
    height: 180,
    drinks: drinkHoursAgo.map(hoursAgo => ({
      alcohol: 14000,
      created: new Date(Date.now() - hoursAgo * 3600 * 1000),
    })),
  };
}

describe('kuvaaja.buildChartData()', function() {
  it('should give every drinker their own color', function() {
    const data = kuvaaja.buildChartData({
      a: drinker('a', 'Eka', [1]),
      b: drinker('b', 'Toka', [2]),
      c: drinker('c', 'Kolmas', [1, 0.5]),
    });
    const named = data.datasets.filter(dataset => dataset.label !== '');
    assert.deepEqual(named.map(dataset => dataset.label), ['Eka', 'Toka', 'Kolmas']);
    assert.equal(new Set(named.map(dataset => dataset.borderColor)).size, 3);
  });

  it('should draw the prediction in the same color without a legend label', function() {
    const data = kuvaaja.buildChartData({ a: drinker('a', 'Eka', [1]) });
    assert.equal(data.datasets.length, 2);
    assert.equal(data.datasets[1].label, '');
    assert.equal(data.datasets[1].borderColor, data.datasets[0].borderColor);
  });

  it('should leave out users with no alcohol in the time window', function() {
    const data = kuvaaja.buildChartData({
      a: drinker('a', 'Eka', [1]),
      b: drinker('b', 'Selvä', [47]),
    });
    assert.deepEqual(data.datasets.filter(d => d.label !== '').map(d => d.label), ['Eka']);
  });
});

describe('kuvaaja.js', function() {
  beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);
  it('Calling /kuvaaja should sent a photo to the group', function(done) {
    const mocked = blakkistest.mockMsgAndBot();
    mocked.msg.from.id = blakkistest.realIds[0];
    mocked.msg.chat.type = 'chat';
    mocked.msg.chat.id = blakkistest.groups[0].realId;
    Commands.call('/kuvaaja', mocked.msg, ['/kuvaaja'])
      .then(() => {
        assert.equal(mocked.internals.sentChatId, mocked.msg.chat.id);
        assert.notEqual(mocked.internals.sentStream, false);
        done();
      })
      .catch(err => done(err));
  });
});
