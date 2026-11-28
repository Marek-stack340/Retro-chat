const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const bcrypt = require('bcrypt');
const { io } = require('socket.io-client');
const { accountKey, saveAccountStore } = require('../account-store');

async function getFreePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.listen(0, '127.0.0.1', (error) => error ? reject(error) : resolve()));
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function postJson(baseUrl, route, payload) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { status: response.status, body: await response.json() };
}

function waitForSocketEvent(socket, eventName, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 5000);
    const handler = (...args) => {
      if (!predicate(...args)) return;
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(args);
    };
    socket.on(eventName, handler);
  });
}

test('chat account authentication protects moderator access and roles', { timeout: 30000 }, async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-auth-flow-'));
  const accountsFile = path.join(directory, 'accounts.json');
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const ownerPassword = 'owner-test-password';
  saveAccountStore(accountsFile, new Map([
    [accountKey('OwnerOne'), {
      username: 'OwnerOne',
      passwordHash: await bcrypt.hash(ownerPassword, 4),
      role: 'owner'
    }]
  ]));

  const serverProcess = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), CHAT_ACCOUNTS_FILE: accountsFile },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let serverErrors = '';
  serverProcess.stderr.on('data', (chunk) => { serverErrors += chunk.toString(); });
  const sockets = [];

  t.after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => {
      if (serverProcess.exitCode !== null) return resolve();
      serverProcess.once('exit', resolve);
      setTimeout(resolve, 3000).unref();
    });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch (_) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.equal(ready, true, `server did not start: ${serverErrors}`);

  const anonymousOwner = await postJson(baseUrl, '/api/enter', { username: 'OwnerOne', password: '' });
  assert.equal(anonymousOwner.status, 400);
  const wrongOwnerPassword = await postJson(baseUrl, '/api/enter', { username: 'OwnerOne', password: 'wrong-password' });
  assert.equal(wrongOwnerPassword.status, 400);

  const guestEntry = await postJson(baseUrl, '/api/enter', { username: 'mod', password: '' });
  assert.equal(guestEntry.status, 200);
  assert.equal(guestEntry.body.role, null);

  const guestSocket = io(baseUrl, { auth: { token: guestEntry.body.token }, transports: ['websocket'], reconnection: false });
  sockets.push(guestSocket);
  await waitForSocketEvent(guestSocket, 'connect');
  const guestList = waitForSocketEvent(guestSocket, 'user-list', (users) => users.some((user) => user.username === 'mod'));
  guestSocket.emit('join', { username: 'mod', room: 'Spoločná' });
  const [guestUsers] = await guestList;
  assert.equal(guestUsers.find((user) => user.username === 'mod').role, null);

  const guestRevoked = waitForSocketEvent(guestSocket, 'auth-required');
  const registeredMod = await postJson(baseUrl, '/api/enter', { username: 'mod', password: 'mod-test-password' });
  assert.equal(registeredMod.status, 200);
  assert.equal(registeredMod.body.role, 'user');
  assert.equal(JSON.parse(fs.readFileSync(accountsFile, 'utf8')).accounts.find((account) => account.username === 'mod').role, 'user');
  await guestRevoked;

  const ownerEntry = await postJson(baseUrl, '/api/enter', { username: 'OwnerOne', password: ownerPassword });
  assert.equal(ownerEntry.status, 200);
  assert.equal(ownerEntry.body.role, 'owner');
  const ownerSocket = io(baseUrl, { auth: { token: ownerEntry.body.token }, transports: ['websocket'], reconnection: false });
  sockets.push(ownerSocket);
  await waitForSocketEvent(ownerSocket, 'connect');
  const ownerList = waitForSocketEvent(ownerSocket, 'user-list', (users) => users.some((user) => user.username === 'OwnerOne'));
  ownerSocket.emit('join', { username: 'OwnerOne', room: 'Spoločná' });
  const [ownerUsers] = await ownerList;
  assert.equal(ownerUsers.find((user) => user.username === 'OwnerOne').role, 'owner');

  const wrongUnlock = waitForSocketEvent(ownerSocket, 'moderation-panel:unlock-result');
  ownerSocket.emit('moderation-panel:unlock', { password: 'wrong-password' });
  assert.equal((await wrongUnlock)[0].ok, false);

  const correctUnlock = waitForSocketEvent(ownerSocket, 'moderation-panel:unlock-result');
  ownerSocket.emit('moderation-panel:unlock', { password: ownerPassword });
  assert.equal((await correctUnlock)[0].ok, true);

  const promotionConfirmed = waitForSocketEvent(ownerSocket, 'system-message', (message) => message.includes('dostal rolu Moderátor'));
  ownerSocket.emit('moderation:assign-role', { target: 'mod', role: 'moderator' });
  await promotionConfirmed;
  assert.equal(JSON.parse(fs.readFileSync(accountsFile, 'utf8')).accounts.find((account) => account.username === 'mod').role, 'moderator');
  const moderatorLogin = await postJson(baseUrl, '/api/enter', { username: 'mod', password: 'mod-test-password' });
  assert.equal(moderatorLogin.body.role, 'moderator');

  const untrustedSocket = io(baseUrl, { transports: ['websocket'], reconnection: false });
  sockets.push(untrustedSocket);
  await waitForSocketEvent(untrustedSocket, 'connect');
  const authRequired = waitForSocketEvent(untrustedSocket, 'auth-required');
  untrustedSocket.emit('join', { username: 'administrator', room: 'Spoločná' });
  await authRequired;
});