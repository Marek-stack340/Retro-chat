const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBanScreenData, buildKickScreenData } = require('./ban-utils');

test('ban screen data includes the required fields and duration', () => {
  const data = buildBanScreenData({
    username: 'Marek',
    reason: 'Porušenie pravidiel',
    hours: 24,
    startedAt: new Date('2026-11-13T10:00:00Z').getTime(),
    initiator: 'Správca'
  });

  assert.equal(data.username, 'Marek');
  assert.equal(data.reason, 'Porušenie pravidiel');
  assert.equal(data.hours, 24);
  assert.equal(data.initiator, 'Správca');
  assert.ok(data.endsAt);
  assert.ok(data.startedAtLabel.length > 0);
  assert.ok(data.endsAtLabel.length > 0);
});

test('kick screen data includes room removal details', () => {
  const data = buildKickScreenData({
    username: 'Jano',
    room: 'Spoločná',
    reason: 'Vyhodenie z miestnosti',
    initiatedAt: new Date('2026-11-13T12:00:00Z').getTime(),
    initiator: 'Správca'
  });

  assert.equal(data.username, 'Jano');
  assert.equal(data.reason, 'Vyhodenie z miestnosti');
  assert.equal(data.room, 'Spoločná');
  assert.equal(data.initiator, 'Správca');
  assert.ok(data.startedAtLabel.length > 0);
  assert.equal(data.durationLabel, 'Dočasne');
});
