/* globals describe, it, beforeEach */
'use strict';
require('../../app/commands/lampokartta.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');
const strings = require('../../app/strings.js');

function groupMessage() {
  const mocked = blakkistest.mockMsgAndBot();
  mocked.msg.from.id = blakkistest.realIds[0];
  mocked.msg.chat.type = 'chat';
  mocked.msg.chat.id = blakkistest.groups[0].realId;
  return mocked;
}

describe('lampokartta.js', function() {
  describe('with drinks', function() {
    beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);

    it('Calling /lampokartta should send a photo to the group', function(done) {
      this.timeout(10000); // rendering the image can be slow on a cold CI runner
      const mocked = groupMessage();
      Commands.call('/lampokartta', mocked.msg, ['/lampokartta'])
        .then(() => {
          assert.equal(mocked.internals.sentChatId, mocked.msg.chat.id);
          assert.notEqual(mocked.internals.sentStream, false);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('without drinks', function() {
    beforeEach(blakkistest.resetDbWithTestUsersAndGroups);

    it('should tell that the map would be empty instead of sending an empty image', function(done) {
      const mocked = groupMessage();
      Commands.call('/lampokartta', mocked.msg, ['/lampokartta'])
        .then(() => {
          assert.equal(mocked.internals.sentChatId, mocked.msg.chat.id);
          assert.equal(mocked.internals.sentText, strings.commands.lampokartta.no_drinks);
          assert.equal(mocked.internals.sentStream, false);
          done();
        })
        .catch(err => done(err));
    });
  });
});
