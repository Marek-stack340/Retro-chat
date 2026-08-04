const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Príliš veľa pokusov o prihlásenie. Skús to znova o chvíľu.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Príliš veľa pokusov o registráciu. Skús to znova o chvíľu.' }
});

app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];
const users = new Map();
const banList = new Map();
const accounts = new Map();
const authTokens = new Map();
const adminUsernames = new Set(['admin', 'administrator', 'spravca', 'správca']);
const testerUsernames = new Set(['kika_c123']);
const protectedUsernames = new Set(['správca', 'spravca']);
const oddychPoints = new Map();
const antivirusStrikes = new Map();
const usernamePattern = /^[\p{L}0-9_]{3,20}$/u;

const curseWords = ['hovno', 'kurva', 'kokot', 'sranie', 'sračky', 'debil', 'blbec', 'piča', 'chuj', 'zmetok', 'sprostost', 'nadavka', 'nadávka', 'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'fucker', 'motherfucker', 'slut', 'whore'];
const curseWordsSet = new Set(curseWords);
const MAX_MESSAGE_LENGTH = 280;
const MAX_ROOM_LENGTH = 40;
const MAX_USERNAME_LENGTH = 20;
const SUSPICIOUS_PATTERN = /(?:https?:\/\/|www\.|mailto:|javascript:|data:|<script|on\w+\s*=)/i;
const SECURITY_BANNER = '🛡 SILNÝ ANTIVIRUS · 10000000909% ZABEZPEČENIE PROTI HACKEROM';
const SECURITY_PROTECTIONS = ['rate limiting', 'helmet headers', 'súborové filtry', 'zabanovanie podozrivých používateľov', 'blokovanie škodlivých skriptov'];
const ANTIVIRUS_DANGEROUS_PATTERN = /(?:<script\b|<iframe\b|<svg\b|javascript:|data:text\/html|onerror\s*=|onload\s*=|document\.(cookie|location)|window\.(location|open)|localStorage|sessionStorage|eval\(|fromcharcode\(|atob\(|\b(?:cmd|powershell|bash|sh)\b|\b(?:wget|curl|nc|python|perl)\b|\b(?:mshta|rundll32)\b|\.(?:exe|bat|ps1|cmd)\b|__proto__|constructor\.constructor)/i;
const ANTIVIRUS_MAX_STRIKES = 3;
const ANTIVIRUS_STRIKE_WINDOW_MS = 30 * 60 * 1000;

function sanitizeProfanity(text) {
  if (!text) return text;
  return text.replace(/\b([a-zA-ZáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    if (curseWordsSet.has(lower)) {
      return '#'.repeat(match.length);
    }
    return match;
  });
}

function broadcastUserList() {
  io.emit('user-list', Array.from(users.values()));
}

function cleanBans() {
  const now = Date.now();
  for (const [username, expires] of banList.entries()) {
    if (expires <= now) {
      banList.delete(username);
    }
  }
}

function isBanned(username) {
  cleanBans();
  return banList.has(username.toLowerCase());
}

function normalizeUsername(value) {
  return (value || '').toString().trim();
}

function normalizeRoomName(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ').slice(0, 40) || 'Spoločná';
}

function normalizePointsKey(username) {
  return normalizeUsername(username).toLowerCase();
}

function formatChatTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function ensureOddychPoints(username) {
  const key = normalizePointsKey(username);
  if (!key) return;
  if (!oddychPoints.has(key)) {
    oddychPoints.set(key, 0);
  }
}

function getOddychPointsSnapshot() {
  const snapshot = {};
  for (const [key, value] of oddychPoints.entries()) {
    snapshot[key] = Number(value || 0);
  }
  return snapshot;
}

function broadcastOddychPoints() {
  io.emit('user-points', getOddychPointsSnapshot());
}

function emitPresenceSystemMessage(username, kind) {
  const action = kind === 'join' ? 'vstúpil do miestnosti' : 'odišiel z chatu';
  io.emit('system-message', `${username} ${action} (${formatChatTimestamp(new Date())})`);
}

function addOddychPoints(username, delta) {
  const key = normalizePointsKey(username);
  if (!key) return;
  ensureOddychPoints(username);
  oddychPoints.set(key, Number(oddychPoints.get(key) || 0) + Number(delta || 0));
  broadcastOddychPoints();
}

function addOddychPointsToAllActiveUsers(delta) {
  const amount = Math.floor(Number(delta));
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  let updatedCount = 0;
  for (const user of users.values()) {
    const key = normalizePointsKey(user.username);
    if (!key) continue;
    ensureOddychPoints(user.username);
    oddychPoints.set(key, Number(oddychPoints.get(key) || 0) + amount);
    updatedCount += 1;
  }

  if (updatedCount > 0) {
    broadcastOddychPoints();
  }

  return updatedCount;
}

function sanitizeChatText(text) {
  if (typeof text !== 'string') return '';
  let cleaned = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+=/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, MAX_MESSAGE_LENGTH);
}

function isSuspiciousText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  return SUSPICIOUS_PATTERN.test(trimmed) || trimmed.length > MAX_MESSAGE_LENGTH;
}

function detectDangerousContent(text) {
  const value = String(text || '').trim();
  if (!value) return null;
  if (!ANTIVIRUS_DANGEROUS_PATTERN.test(value)) return null;
  return {
    reason: 'detegovaný podozrivý skript/škodlivý príkaz',
    preview: value.slice(0, 80)
  };
}

function getAntivirusState(username) {
  const key = normalizeUsername(username).toLowerCase();
  if (!key) return { strikes: 0, expiresAt: 0 };

  const current = antivirusStrikes.get(key);
  if (!current) return { strikes: 0, expiresAt: 0 };

  if (current.expiresAt <= Date.now()) {
    antivirusStrikes.delete(key);
    return { strikes: 0, expiresAt: 0 };
  }
  return current;
}

function notifyAdminsSecurity(message) {
  for (const [socketId, user] of users.entries()) {
    if (!user || user.role !== 'admin') continue;
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit('system-message', message);
    }
  }
}

function getSecurityStatus(username) {
  const state = getAntivirusState(username);
  return {
    ok: true,
    active: true,
    level: '10000000909%',
    message: `${SECURITY_BANNER}\nAktívne ochrany: ${SECURITY_PROTECTIONS.join(', ')}\nTvoje varovania: ${state.strikes || 0}/${ANTIVIRUS_MAX_STRIKES}.`
  };
}

function registerAntivirusStrike(socket, user, threat) {
  const key = normalizeUsername(user.username).toLowerCase();
  if (!key) return;

  const current = getAntivirusState(user.username);
  const nextStrikes = Number(current.strikes || 0) + 1;
  antivirusStrikes.set(key, {
    strikes: nextStrikes,
    expiresAt: Date.now() + ANTIVIRUS_STRIKE_WINDOW_MS
  });

  socket.emit('system-message', `${SECURITY_BANNER} · zablokoval správu (${threat.reason}). Pokus ${nextStrikes}/${ANTIVIRUS_MAX_STRIKES}.`);
  notifyAdminsSecurity(`${SECURITY_BANNER} · ${user.username} poslal podozrivý obsah (${threat.reason}).`);

  if (nextStrikes < ANTIVIRUS_MAX_STRIKES) {
    return;
  }

  const banHours = 24;
  const banUntil = Date.now() + banHours * 60 * 60 * 1000;
  banList.set(key, banUntil);

  socket.emit('system-message', `${SECURITY_BANNER} · podozrivá aktivita bola zaznamenaná. Získal si automatický ban na ${banHours} hodín.`);
  socket.emit('security-banner', {
    ok: true,
    active: true,
    level: '10000000909%',
    message: `${SECURITY_BANNER}\nAutomatický ban: ${banHours} hodín. Pokus o ďalšie útoky bude okamžite zablokovaný.`
  });
  socket.disconnect(true);
  notifyAdminsSecurity(`${SECURITY_BANNER} · ${user.username} bol automaticky zabanovaný na ${banHours} hodín kvôli opakovanému podozrivému obsahu.`);
}

function isValidUsername(username) {
  return usernamePattern.test(username);
}

function createSocketThrottle(limit, windowMs) {
  const timestamps = [];
  return () => {
    const now = Date.now();
    while (timestamps.length && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= limit) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
}

function normalizePassword(value) {
  return (value || '').toString().trim();
}

function createAuthToken(username) {
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.${username.toLowerCase()}`;
}

function cleanupAuthTokens() {
  const now = Date.now();
  for (const [token, record] of authTokens.entries()) {
    if (!record || record.expiresAt <= now) {
      authTokens.delete(token);
    }
  }
}

function requireAuthToken(req, res, next) {
  cleanupAuthTokens();
  const token = normalizePassword(req.headers['x-auth-token']);
  if (!token || !authTokens.has(token)) {
    res.status(401).json({ ok: false, message: 'Neplatné prihlásenie.' });
    return;
  }
  req.authToken = token;
  req.authRecord = authTokens.get(token);
  next();
}

app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');
    const email = normalizePassword(req.body && req.body.email ? req.body.email : '');

    if (!isValidUsername(username)) {
      res.status(400).json({ ok: false, message: 'Meno musí mať 3 až 20 znakov a môže obsahovať iba písmená, čísla alebo _.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ ok: false, message: 'Heslo musí mať aspoň 4 znaky.' });
      return;
    }
    if (!email) {
      res.status(400).json({ ok: false, message: 'Zadaj e-mail.' });
      return;
    }

    const normalizedUsername = username.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    accounts.set(normalizedUsername, {
      username,
      email,
      passwordHash: hashedPassword,
      role: adminUsernames.has(normalizedUsername)
        ? 'admin'
        : (testerUsernames.has(normalizedUsername) ? 'tester' : null)
    });
    res.json({ ok: true, message: 'Registrácia uložená.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Registrácia zlyhala.' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');

    if (!username) {
      res.status(400).json({ ok: false, message: 'Zadaj nick.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ ok: false, message: 'Heslo musí mať aspoň 4 znaky.' });
      return;
    }

    const account = accounts.get(username.toLowerCase());
    if (!account) {
      res.status(404).json({ ok: false, message: 'Tento nick neexistuje. Najprv sa zaregistruj.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    account.passwordHash = hashedPassword;
    accounts.set(username.toLowerCase(), account);

    res.json({ ok: true, message: 'Heslo bolo úspešne zmenené. Teraz sa môžeš prihlásiť novým heslom.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Obnovenie hesla zlyhalo.' });
  }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');

    if (!isValidUsername(username)) {
      res.status(400).json({ ok: false, message: 'Neplatné meno.' });
      return;
    }
    if (!password) {
      res.status(400).json({ ok: false, message: 'Zadaj heslo.' });
      return;
    }

    const account = accounts.get(username.toLowerCase());
    if (!account) {
      res.status(401).json({ ok: false, message: 'Účet neexistuje. Najprv sa zaregistruj.' });
      return;
    }

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      res.status(401).json({ ok: false, message: 'Nesprávne heslo.' });
      return;
    }

    const token = createAuthToken(account.username);
    authTokens.set(token, {
      username: account.username,
      role: account.role || null,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, token, username: account.username, role: account.role || null });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Prihlásenie zlyhalo.' });
  }
});

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  socket.emit('load-messages', messages);
  socket.emit('user-list', Array.from(users.values()));
  socket.emit('user-points', getOddychPointsSnapshot());

  const allowJoin = createSocketThrottle(4, 60 * 1000);
  const allowMessage = createSocketThrottle(20, 10 * 1000);
  const allowPrivateMessage = createSocketThrottle(10, 10 * 1000);

  socket.on('join', (data) => {
    if (!allowJoin()) {
      socket.emit('join-denied', 'Príliš veľa pokusov o vstup. Počkaj chvíľu.');
      return;
    }

    const username = normalizeUsername(data && data.username ? data.username : 'Správca');
    const safeUsername = username || 'Správca';
    socket.data.room = normalizeRoomName(data && data.room ? data.room : 'Spoločná');
    const normalizedUsername = safeUsername.toLowerCase();
    if (safeUsername.length > MAX_USERNAME_LENGTH) {
      socket.emit('join-denied', 'Meno je príliš dlhé. Použi max 20 znakov.');
      return;
    }
    if (!isValidUsername(safeUsername)) {
      socket.emit('join-denied', 'Meno musí mať 3 až 20 znakov a môže obsahovať iba písmená, čísla alebo _.');
      return;
    }
    if (protectedUsernames.has(normalizedUsername)) {
      socket.emit('join-denied', 'Meno je už obsadené. Skús si dať iné meno.');
      return;
    }
    if (isBanned(safeUsername)) {
      socket.emit('system-message', 'Si zabanovaný na 24 hodín.');
      socket.disconnect(true);
      return;
    }

    const duplicateUser = Array.from(users.values()).find(
      (user) => user.username.toLowerCase() === normalizedUsername && user.id !== socket.id
    );
    if (duplicateUser) {
      socket.emit('join-denied', 'Meno je už obsadené. Skús si dať iné meno.');
      return;
    }

    users.set(socket.id, {
      id: socket.id,
      username: safeUsername,
      role: adminUsernames.has(normalizedUsername)
        ? 'admin'
        : (testerUsernames.has(normalizedUsername) ? 'tester' : null)
    });
    ensureOddychPoints(safeUsername);
    socket.data.joined = true;
    socket.emit('security-banner', getSecurityStatus(safeUsername));
    socket.emit('system-message', `${SECURITY_BANNER} · ochrana je aktívna a chat je chránený pred hackerom, škodlivými skriptami a útokmi.`);
    broadcastUserList();
    broadcastOddychPoints();
    emitPresenceSystemMessage(safeUsername, 'join');
  });

  socket.on('command', (data) => {
    if (!data || !data.target) return;
    const fromUser = users.get(socket.id);
    if (!fromUser) return;

    const targetName = String(data.target).trim();
    if (!targetName) return;
    if (adminUsernames.has(targetName.toLowerCase())) {
      socket.emit('system-message', 'Administrátora nevyhodíš alebo nezakážeš.');
      return;
    }

    const targetEntry = Array.from(users.values()).find((user) => user.username.toLowerCase() === targetName.toLowerCase());
    if (!targetEntry) {
      socket.emit('system-message', `Užívateľ ${targetName} nie je pripojený.`);
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetEntry.id);
    if (!targetSocket) {
      socket.emit('system-message', `Užívateľ ${targetName} sa nenašiel.`);
      return;
    }

    if (data.type === 'ban') {
      const hoursValue = Number(data.hours);
      const banHours = Number.isFinite(hoursValue) && hoursValue > 0 ? Math.min(Math.floor(hoursValue), 240) : 29;
      const expires = Date.now() + banHours * 60 * 60 * 1000;
      banList.set(targetName.toLowerCase(), expires);
      targetSocket.emit('system-message', `Bol si zabanovaný na ${banHours} hodín.`);
      targetSocket.disconnect(true);
      users.delete(targetEntry.id);
      broadcastUserList();
      io.emit('system-message', `${fromUser.username} zabanoval ${targetName} na ${banHours} hodín.`);
      return;
    }

    const expires = Date.now() + 24 * 60 * 60 * 1000;
    banList.set(targetName.toLowerCase(), expires);
    if (targetSocket) {
      targetSocket.emit('system-message', 'Bol si vyhodený na 24 hodín.');
      targetSocket.disconnect(true);
    }
    users.delete(targetEntry.id);
    broadcastUserList();
    io.emit('system-message', `${fromUser.username} vyhodil ${targetName} na 24 hodín.`);
  });

  socket.on('clear-chat', () => {
    const user = users.get(socket.id);
    if (!user) return;

    messages.length = 0;
    io.emit('clear-chat', {
      byUsername: user.username,
      timestamp: new Date().toISOString()
    });
    io.emit('system-message', `${user.username} vymazal chat pre všetkých.`);
  });

  socket.on('countdown:start', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    if (user.role !== 'admin') {
      socket.emit('system-message', 'Príkaz .countdown môže použiť iba Správca/admin.');
      return;
    }

    const value = Math.floor(Number(data && data.value));
    if (!Number.isFinite(value) || value < 1 || value > 9999) {
      socket.emit('system-message', 'Použi .countdown s číslom od 1 do 9999.');
      return;
    }

    const rewardedUsers = addOddychPointsToAllActiveUsers(value);
    io.emit('system-message', `${user.username} spustil odpočet. Každý v chate dostáva ${value} bodov.`);

    io.emit('countdown:start', {
      value,
      byUsername: user.username || 'Správca',
      rewardPoints: value,
      rewardText: `Dostávaš ${value} bodov!`,
      rewardedUsers
    });
  });

  socket.on('antivirus:status', () => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('antivirus-status', {
        ok: false,
        message: 'Najprv sa prihlás do chatu.'
      });
      return;
    }

    const state = getAntivirusState(user.username);
    const status = getSecurityStatus(user.username);
    socket.emit('security-banner', status);
    socket.emit('antivirus-status', {
      ok: true,
      message: `${SECURITY_BANNER}\nAktívne ochrany: ${SECURITY_PROTECTIONS.join(', ')}\nTvoje varovania: ${state.strikes || 0}/${ANTIVIRUS_MAX_STRIKES}.`
    });
  });

  socket.on('send-message', (data) => {
    if (!allowMessage()) {
      socket.emit('system-message', 'Spomaľ trochu, posielaš správy príliš rýchlo.');
      return;
    }

    const user = users.get(socket.id);
    if (!user) {
      socket.emit('system-message', 'Najprv sa prihlás do chatu.');
      return;
    }

    const rawText = String(data && data.text ? data.text : '');
    const cleanedText = sanitizeChatText(rawText);
    const dangerous = detectDangerousContent(rawText);
    if (!cleanedText) {
      socket.emit('system-message', 'Prázdna správa sa neodosiela.');
      return;
    }
    if (dangerous) {
      registerAntivirusStrike(socket, user, dangerous);
      return;
    }
    if (isSuspiciousText(rawText)) {
      socket.emit('system-message', `${SECURITY_BANNER} · správa obsahuje podozrivý obsah a nebola odoslaná.`);
      return;
    }

    const msg = {
      id: Date.now(),
      username: user.username || 'Správca',
      text: sanitizeProfanity(cleanedText),
      timestamp: new Date().toISOString(),
      room: normalizeRoomName(data && data.room ? data.room : socket.data.room || 'Spoločná'),
      reactions: {}
    };
    messages.push(msg);
    addOddychPoints(user.username, 2);
    io.emit('receive-message', msg);
  });

  socket.on('admin-broadcast', (data) => {
    const user = users.get(socket.id);
    if (!user || user.role !== 'admin') {
      socket.emit('system-message', 'Príkaz :m môže spustiť iba Správca/admin.');
      return;
    }

    const rawText = String(data && data.text ? data.text : '');
    const cleanedText = sanitizeChatText(rawText);
    const dangerous = detectDangerousContent(rawText);
    if (!cleanedText) return;
    if (dangerous) {
      registerAntivirusStrike(socket, user, dangerous);
      return;
    }
    if (isSuspiciousText(rawText)) {
      socket.emit('system-message', `${SECURITY_BANNER} · oznam obsahuje podozrivý obsah a nebol odoslaný.`);
      return;
    }

    io.emit('system-message', `📢 ${user.username}: ${sanitizeProfanity(cleanedText)}`);
  });

  socket.on('notify-ignored', (data) => {
    if (!data || !data.targetName || !data.byName) return;
    const targetEntry = Array.from(users.values()).find(
      (u) => u.username.toLowerCase() === data.targetName.toString().toLowerCase()
    );
    if (!targetEntry) return;
    const targetSocket = io.sockets.sockets.get(targetEntry.id);
    if (targetSocket) {
      targetSocket.emit('system-message',
        `Správal/a si sa tak, že ti ${data.byName} udelil/a ignoráciu.`
      );
    }
  });

  socket.on('toggle-reaction', (data) => {
    const user = users.get(socket.id);
    if (!user || !data || !data.messageId || !data.emoji) return;

    const messageId = Number(data.messageId);
    const emoji = data.emoji.toString();
    const message = messages.find((m) => Number(m.id) === messageId);
    if (!message) return;

    if (!message.reactions || typeof message.reactions !== 'object') {
      message.reactions = {};
    }

    const reactedUsers = Array.isArray(message.reactions[emoji])
      ? message.reactions[emoji]
      : [];
    const existingIndex = reactedUsers.indexOf(user.username);

    if (existingIndex >= 0) {
      reactedUsers.splice(existingIndex, 1);
    } else {
      reactedUsers.push(user.username);
      addOddychPoints(user.username, 1);
    }

    if (reactedUsers.length > 0) {
      message.reactions[emoji] = reactedUsers;
    } else {
      delete message.reactions[emoji];
    }

    io.emit('message-reaction-updated', {
      messageId: message.id,
      reactions: message.reactions
    });
  });

  socket.on('send-private-message', (data) => {
    if (!allowPrivateMessage()) {
      socket.emit('system-message', 'Súkromné správy posielaš príliš rýchlo.');
      return;
    }
    const user = users.get(socket.id);
    const rawText = data && data.text ? data.text.toString() : '';
    const text = sanitizeChatText(rawText);
    const dangerous = detectDangerousContent(rawText);
    const toId = data && data.to;
    if (!user || !toId || !text) return;
    if (dangerous) {
      registerAntivirusStrike(socket, user, dangerous);
      return;
    }
    if (isSuspiciousText(rawText)) {
      socket.emit('system-message', `${SECURITY_BANNER} · súkromná správa obsahuje podozrivý obsah a nebola odoslaná.`);
      return;
    }

    const payload = {
      id: Date.now(),
      from: user.username,
      to: toId,
      text: sanitizeProfanity(text),
      timestamp: new Date().toISOString(),
      self: false
    };

    addOddychPoints(user.username, 1);

    const targetSocket = io.sockets.sockets.get(toId);
    if (targetSocket) {
      targetSocket.emit('receive-private-message', payload);
    }

    socket.emit('receive-private-message', {
      ...payload,
      self: true,
      toUsername: users.get(toId) ? users.get(toId).username : 'niekto'
    });
  });


  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
    const leavingUser = users.get(socket.id);
    users.delete(socket.id);
    if (leavingUser && leavingUser.username && socket.data && socket.data.joined) {
      emitPresenceSystemMessage(leavingUser.username, 'leave');
    }
    broadcastUserList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`New chat running on http://localhost:${PORT}`));
