const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const bcrypt = require('bcrypt');
const { accountKey, loadAccountStore, saveAccountStore, verifyAccountPassword } = require('../account-store');

test('account store persists account hashes and roles with private permissions', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-accounts-'));
  const filePath = path.join(directory, 'accounts.json');
  const passwordHash = await bcrypt.hash('test-password', 4);
  const accounts = new Map([
    [accountKey('Marek'), { username: 'Marek', passwordHash, role: 'owner' }]
  ]);

  try {
    saveAccountStore(filePath, accounts);
    const loadedAccounts = loadAccountStore(filePath);
    const account = loadedAccounts.get(accountKey('MAREK'));

    assert.equal(account.username, 'Marek');
    assert.equal(account.role, 'owner');
    assert.equal(await bcrypt.compare('test-password', account.passwordHash), true);
    assert.equal(await verifyAccountPassword(account, 'test-password'), true);
    assert.equal(await verifyAccountPassword(account, 'wrong-password'), false);
    assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('account store rejects malformed JSON instead of discarding stored accounts', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-accounts-'));
  const filePath = path.join(directory, 'accounts.json');

  try {
    fs.writeFileSync(filePath, '{invalid', 'utf8');
    assert.throws(() => loadAccountStore(filePath), /JSON úložisko účtov/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});