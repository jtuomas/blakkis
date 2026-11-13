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
  const named = data => data.datasets.filter(dataset => dataset.label !== '');

  function drinkers(count) {
    const byUser = {};
    for (let i = 0; i < count; i += 1) {
      byUser['u' + i] = drinker('u' + i, 'Juoja' + i, [1]);
    }
    return byUser;
  }

  it('should give every drinker their own color', function() {
    const data = kuvaaja.buildChartData({
      a: drinker('a', 'Eka', [1]),
      b: drinker('b', 'Toka', [2]),
      c: drinker('c', 'Kolmas', [1, 0.5]),
    });
    assert.deepEqual(named(data).map(dataset => dataset.label).sort(), ['Eka', 'Kolmas', 'Toka']);
    assert.equal(new Set(named(data).map(dataset => dataset.borderColor)).size, 3);
  });

  it('should list the drinker with the highest peak first', function() {
    const data = kuvaaja.buildChartData({
      a: drinker('a', 'Eka', [1]),
      b: drinker('b', 'Kolmas', [1, 0.5, 0.2]),
    });
    assert.equal(named(data)[0].label, 'Kolmas');
  });

  it('should draw the prediction in the same color and shape without a legend label', function() {
    const data = kuvaaja.buildChartData({ a: drinker('a', 'Eka', [1]) });
    assert.equal(data.datasets.length, 2);
    assert.equal(data.datasets[1].label, '');
    assert.equal(data.datasets[1].borderColor, data.datasets[0].borderColor);
    assert.equal(data.datasets[1].pointStyle, data.datasets[0].pointStyle);
  });

  it('should leave out users with no alcohol in the time window', function() {
    const data = kuvaaja.buildChartData({
      a: drinker('a', 'Eka', [1]),
      b: drinker('b', 'Selvä', [47]),
    });
    assert.deepEqual(named(data).map(d => d.label), ['Eka']);
  });

  it('should use a new marker shape when the colors have run out', function() {
    const lines = named(kuvaaja.buildChartData(drinkers(13)));
    assert.equal(lines.length, 13);
    assert.equal(lines[12].borderColor, lines[0].borderColor);
    assert.notEqual(lines[12].pointStyle, lines[0].pointStyle);
    const combinations = lines.map(line => line.borderColor + line.pointStyle);
    assert.equal(new Set(combinations).size, 13);
  });

  it('should label the hours as HH:mm and start an hour before the first drink', function() {
    const data = kuvaaja.buildChartData({ a: drinker('a', 'Eka', [2]) });
    assert(data.labels.every(label => /^\d\d:\d\d$/.test(label)));
    // 24 hours back and 12 forward would be 37 hours
    assert(data.labels.length > 12 && data.labels.length < 20, data.labels.length);
    // the prediction runs to the end of the chart, the past stops at the last full hour
    assert.equal(data.datasets[1].data.length, data.labels.length);
    assert(data.datasets[0].data.length < data.labels.length);
  });

  it('should show at most 60 people and tell how many there were', function() {
    const data = kuvaaja.buildChartData(drinkers(65));
    assert.equal(named(data).length, 60);
    assert.equal(data.totalCount, 65);
  });
});

describe('kuvaaja.js', function() {
  beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);
  it('Calling /kuvaaja should sent a photo to the group', function(done) {
    this.timeout(10000); // rendering the image can be slow on a cold CI runner
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
