const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const allowedRoles = new Set(['owner', 'admin', 'moderator', 'user', 'tester']);
const usernamePattern = /^[\p{L}0-9_]{3,20}$/u;
const bcryptHashPattern = /^\$2[abxy]\$\d\d\$[./A-Za-z0-9]{53}$/;

function accountKey(username) {
  return String(username || '').trim().toLocaleLowerCase('en-US');
}

function validateAccount(account) {
  if (!account || typeof account.username !== 'string' || !usernamePattern.test(account.username)) {
    throw new Error('Úložisko účtov obsahuje neplatnú prezývku.');
  }
  if (typeof account.passwordHash !== 'string' || !bcryptHashPattern.test(account.passwordHash)) {
    throw new Error(`Účet ${account.username} nemá platný bcrypt hash hesla.`);
  }
  if (!allowedRoles.has(account.role)) {
    throw new Error(`Účet ${account.username} má neplatnú rolu.`);
  }
}

function loadAccountStore(filePath) {
  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }

  let data;
  try {
    data = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Nepodarilo sa načítať JSON úložisko účtov: ${error.message}`);
  }
  if (!data || data.version !== 1 || !Array.isArray(data.accounts)) {
    throw new Error('Úložisko účtov musí obsahovať version: 1 a pole accounts.');
  }

  const accounts = new Map();
  data.accounts.forEach((account) => {
    validateAccount(account);
    const key = accountKey(account.username);
    if (accounts.has(key)) throw new Error(`Účet ${account.username} je v úložisku duplicitný.`);
    accounts.set(key, {
      username: account.username.trim(),
      passwordHash: account.passwordHash,
      role: account.role
    });
  });
  return accounts;
}

function saveAccountStore(filePath, accounts) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });

  const serializedAccounts = Array.from(accounts.values(), (account) => {
    validateAccount(account);
    return {
      username: account.username.trim(),
      passwordHash: account.passwordHash,
      role: account.role
    };
  });
  const contents = `${JSON.stringify({ version: 1, accounts: serializedAccounts }, null, 2)}\n`;
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, contents, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(temporaryPath, filePath);
    fs.chmodSync(filePath, 0o600);
  } catch (error) {
    try {
      fs.unlinkSync(temporaryPath);
    } catch (_) {
      // The temporary file may already have been renamed.
    }
    throw error;
  }
}

async function verifyAccountPassword(account, password) {
  if (!account || typeof password !== 'string' || password.length < 1 || password.length > 128) return false;
  if (!bcryptHashPattern.test(account.passwordHash || '')) return false;
  return bcrypt.compare(password, account.passwordHash);
}

module.exports = { accountKey, loadAccountStore, saveAccountStore, verifyAccountPassword };