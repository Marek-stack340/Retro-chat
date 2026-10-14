const test = require('node:test');
const assert = require('node:assert/strict');

const { generateRobotReply } = require('./bot');

test('Robot replies to greeting and continues the conversation', () => {
  const reply = generateRobotReply('ahoj');
  assert.match(reply.toLowerCase(), /ahoj|dobrý|r.a|pripraven/);
});

test('Robot replies politely for a general conversation', () => {
  const reply = generateRobotReply('ako sa máš');
  assert.match(reply.toLowerCase(), /dobre|pripraven|povedz/);
});
