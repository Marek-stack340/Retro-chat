const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbFile = path.join(__dirname, 'database.sqlite');
let db;

function init() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbFile, (err) => {
      if (err) return reject(err);
        const sql = `CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              username TEXT UNIQUE,
              email TEXT UNIQUE,
              passwordHash TEXT,
              role TEXT,
              createdAt TEXT
            )`;
        db.run(sql, (err2) => {
          if (err2) return reject(err2);
          resolve();
        });
    });
  });
}

function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createUser({ username, email, password, role = 'user' }) {
  return new Promise(async (resolve, reject) => {
    try {
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const id = `u-${Date.now()}`;
      const createdAt = new Date().toISOString();
      db.run(
        'INSERT INTO users (id, username, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, username, email, passwordHash, role, createdAt],
        function (err) {
          if (err) return reject(err);
          resolve({ id, username, email, role, createdAt });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function ensureAdmin(username) {
  return findUserByUsername(username).then((row) => {
    if (!row) {
      return createUser({ username, email: null, password: null, role: 'admin' });
    }
    return row;
  });
}

module.exports = {
  init,
  findUserByUsername,
  findUserByEmail,
  createUser,
  ensureAdmin,
};
