const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const bcrypt = require('bcrypt');
const { accountKey, loadAccountStore, saveAccountStore } = require('../account-store');

const usernamePattern = /^[\p{L}0-9_]{3,20}$/u;
const filePath = process.env.CHAT_ACCOUNTS_FILE || path.join(__dirname, '..', 'private', 'accounts.json');

function ask(question) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => prompt.question(question, (answer) => {
    prompt.close();
    resolve(answer.trim());
  }));
}

function askSecret(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Spusti tento príkaz v interaktívnom SSH termináli.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const input = process.stdin;
    const output = process.stdout;
    const finish = (error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      output.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') return finish(new Error('Prerušené.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            output.write('\b \b');
          }
          continue;
        }
        if (character >= ' ') {
          value += character;
          output.write('*');
        }
      }
    };

    output.write(question);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function main() {
  const accounts = loadAccountStore(filePath);
  if (Array.from(accounts.values()).some((account) => account.role === 'owner')) {
    throw new Error('Úložisko už obsahuje účet správcu.');
  }

  const username = await ask('Prezývka prvého správcu: ');
  if (!usernamePattern.test(username)) throw new Error('Prezývka musí mať 3 až 20 znakov.');
  if (accounts.has(accountKey(username))) throw new Error('Účet s touto prezývkou už existuje.');

  const password = await askSecret('Heslo chat účtu: ');
  if (password.length < 4 || password.length > 128) throw new Error('Heslo musí mať 4 až 128 znakov.');
  const confirmation = await askSecret('Zopakuj heslo: ');
  if (password !== confirmation) throw new Error('Heslá sa nezhodujú.');

  accounts.set(accountKey(username), {
    username,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'owner'
  });
  saveAccountStore(filePath, accounts);
  fs.chmodSync(filePath, 0o600);
  console.log(`Účet správcu ${username} bol uložený do ${filePath}.`);
}

main().catch((error) => {
  console.error(error.message || 'Inicializácia účtu zlyhala.');
  process.exitCode = 1;
});