const test = require('node:test');
const assert = require('node:assert/strict');

const { isAdminName, isModeratorName, canModerateAction } = require('./moderation');

test('admin names are recognized', () => {
  assert.equal(isAdminName('admin'), true);
  assert.equal(isAdminName('správca'), true);
});

test('moderator names are recognized', () => {
  assert.equal(isModeratorName('moderator'), true);
  assert.equal(isModeratorName('mod'), true);
});

test('moderators can act on regular users but not on admins or other moderators', () => {
  assert.equal(canModerateAction('moderator', 'user'), true);
  assert.equal(canModerateAction('moderator', 'moderator'), false);
  assert.equal(canModerateAction('moderator', 'admin'), false);
  assert.equal(canModerateAction('admin', 'user'), true);
  assert.equal(canModerateAction('admin', 'admin'), false);
});
