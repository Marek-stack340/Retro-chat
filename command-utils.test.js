const test = require('node:test');
const assert = require('node:assert/strict');

const { formatDuration, getPrecMessage, getActivityStatusText } = require('./public/command-utils');

test('prec command creates the expected away message', () => {
  assert.equal(getPrecMessage('Marek'), 'Marek je na chvíľu preč.');
});

test('activity status returns a readable duration for the user', () => {
  const text = getActivityStatusText(2 * 60 * 1000 + 5 * 1000);
  assert.match(text, /2m|2 min|2m 5s|2 min/i);
});

test('duration formatter keeps output compact', () => {
  assert.equal(formatDuration(1500), '1s');
});
