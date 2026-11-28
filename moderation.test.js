const test = require('node:test');
const assert = require('node:assert/strict');

const { canModerateAction, getEffectiveModeratorRole } = require('./moderation');

test('moderator roles are never inferred from usernames', () => {
  assert.equal(getEffectiveModeratorRole('mod', null), null);
  assert.equal(getEffectiveModeratorRole('marek', null), null);
  assert.equal(getEffectiveModeratorRole('administrator', null), null);
  assert.equal(getEffectiveModeratorRole('alice', 'moderator'), 'moderator');
});

test('moderators can act on regular users but not on admins or other moderators', () => {
  assert.equal(canModerateAction('moderator', 'user'), true);
  assert.equal(canModerateAction('moderator', 'moderator'), false);
  assert.equal(canModerateAction('moderator', 'admin'), false);
  assert.equal(canModerateAction('admin', 'user'), true);
  assert.equal(canModerateAction('admin', 'admin'), false);
});

