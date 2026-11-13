/* globals describe, it, beforeEach */
'use strict';

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const contexts = require('../../app/lib/context.js');
const InlineKeyboardCommand = require('../../app/lib/inline-keyboard-command.js');

describe('inline-keyboard-command.js (reply keyboard)', () => {
  let mocked;
  let sent;
  let command;
  let context;

  beforeEach(() => {
    mocked = blakkistest.mockMsgAndBot();
    sent = [];
    mocked.bot.sendMessage = (chatId, text, options) => {
      sent.push({ text, options });
      return Promise.resolve();
    };
    command = new InlineKeyboardCommand(
      {
        _root: true,
        _formHeader: () => Promise.resolve('{title}: '),
        _headerTitle: 'title',
        _onText: (context, user, msg, words) =>
          Promise.resolve(
            words[0] === 'ask' ? { text: 'question', keyboard: [['yes', 'no']] } : 'answer',
          ),
        child: {},
      },
      '/testreplykeyboard',
    );
    context = new contexts.Context(command, mocked.msg);
    context.setInlineState(command);
  });

  it('should remove the reply keyboard in a message of its own first', () => {
    return command
      .onText(context, null, mocked.msg, ['ask'])
      .then(() => command.onText(context, null, mocked.msg, ['yes']))
      .then(() => {
        assert.equal(sent.length, 3);
        assert.deepEqual(sent[0].options.reply_markup.keyboard, [['yes', 'no']]);
        assert.equal(sent[1].text, 'answer');
        assert.deepEqual(sent[1].options.reply_markup, { remove_keyboard: true });
        assert.equal(sent[2].text, 'title: ');
        assert.notEqual(sent[2].options.reply_markup.inline_keyboard, undefined);
        assert.equal(context.replyKeyboardShown, false);
      });
  });

  it('should use one message when no reply keyboard is shown', () => {
    return command.onText(context, null, mocked.msg, ['yes']).then(() => {
      assert.equal(sent.length, 1);
      assert.equal(sent[0].text, 'title: answer');
      assert.notEqual(sent[0].options.reply_markup.inline_keyboard, undefined);
    });
  });
});
