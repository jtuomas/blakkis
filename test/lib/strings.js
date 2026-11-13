/* globals describe, it */
'use strict';

const assert = require('assert');
require('../../app/lib/utils.js'); // adds String.prototype.format
const strings = require('../../app/strings.js');

// Telegram does not accept messages longer than this
const MAX_MESSAGE_LENGTH = 4096;

describe('strings.js (terms and privacy)', function() {
  const privacy = strings.commands.start.help.privacy.on_select;
  const terms = strings.commands.terms.reply;
  const texts = { terms, privacy };

  Object.keys(texts).forEach(name => {
    describe(name, function() {
      const text = texts[name];

      it('should fit in a Telegram message', function() {
        assert(text.length < MAX_MESSAGE_LENGTH, `${text.length} characters`);
      });

      it('should have no placeholders left', function() {
        assert.equal(text.match(/\{[A-Z_]+\}/g), null);
        assert(text.indexOf('@YLLÄPITO') === -1);
      });

      it('should have balanced Markdown that Telegram accepts', function() {
        assert.equal((text.match(/\*/g) || []).length % 2, 0);
        // An underscore would start italics and make Telegram reject the message
        assert(text.indexOf('_') === -1);
      });

      it('should tell about the backups and the data download', function() {
        assert(text.indexOf('varmuuskopio') !== -1);
        assert(text.indexOf('/data') !== -1);
      });
    });
  });

  it('should fit in the question that is asked when creating an account', function() {
    const question = strings.commands.tunnus.terms.format({ terms });
    assert(question.length < MAX_MESSAGE_LENGTH, `${question.length} characters`);
    const startQuestion = strings.commands.start.luo_tunnus.terms.format({ terms });
    assert(startQuestion.length < MAX_MESSAGE_LENGTH, `${startQuestion.length} characters`);
  });

  it('should tell about the rights of the user in the privacy policy', function() {
    assert(privacy.indexOf('tietosuojavaltuutetulle') !== -1);
    assert(privacy.indexOf('/whoami') !== -1);
    assert(privacy.indexOf('Rekisterinpitäjä') !== -1);
  });
});
