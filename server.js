const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { ROBOT_NAME, generateRobotReply, generateRobotReplyFromApi } = require('./bot');
const { buildBanScreenData, buildKickScreenData } = require('./ban-utils');
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
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }
  if (req.body && containsSuspiciousPayload(req.body)) {
    res.status(400).json({ ok: false, message: 'Neplatná požiadavka.' });
    return;
  }
  next();
});

function servePublicPage(pageName) {
  return (req, res) => {
    const filePath = path.join(__dirname, 'public', `${pageName}.html`);
    res.sendFile(filePath);
  };
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/home', (req, res) => res.redirect(301, '/'));
app.get('/index', (req, res) => res.redirect(301, '/'));
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/chat', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  servePublicPage('chat')(req, res);
});
app.get('/chat/', (req, res) => res.redirect(301, '/chat'));
app.get('/chat.html', (req, res) => res.redirect(301, '/chat'));
app.get('/messenger', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  servePublicPage('messenger')(req, res);
});
app.get('/messenger/', (req, res) => res.redirect(301, '/messenger'));
app.get('/messenger.html', (req, res) => res.redirect(301, '/messenger'));
app.get('/register', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  servePublicPage('register')(req, res);
});
app.get('/register/', (req, res) => res.redirect(301, '/register'));
app.get('/register.html', (req, res) => res.redirect(301, '/register'));
app.get('/guestbook', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  servePublicPage('guestbook')(req, res);
});
app.get('/guestbook/', (req, res) => res.redirect(301, '/guestbook'));
app.get('/guestbook.html', (req, res) => res.redirect(301, '/guestbook'));
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/contribute', (req, res) => res.redirect(301, '/chat'));
app.get('/contribute/', (req, res) => res.redirect(301, '/chat'));
app.get('/contribute.html', (req, res) => res.redirect(301, '/chat'));
app.use((req, res, next) => {
  if (req.path === '/contribute' || req.path === '/contribute.html' || req.path === '/contribute/') {
    return res.redirect(301, '/chat');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const messages = [];
const users = new Map();
const robotUser = { id: 'robot', username: ROBOT_NAME, role: 'bot' };
const quizReminderCache = new Set();
const banList = new Map();
const accounts = new Map();
const authTokens = new Map();
const moderationReports = [];
const appeals = [];
const moderationNotifications = [];
const moderationHistory = [];
const { ownerUsernames, adminUsernames, moderatorUsernames, isOwnerName, isAdminName, isModeratorName, getModeratorRole, getEffectiveModeratorRole, canModerateAction } = require('./moderation');
const testerUsernames = new Set(['kika_c123']);
const protectedUsernames = new Set([...ownerUsernames, ...adminUsernames, ...moderatorUsernames]);
const reservedJoinNames = new Set([...ownerUsernames, ...adminUsernames, ...moderatorUsernames]);
const resetEmailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});
const antivirusStrikes = new Map();
const usernamePattern = /^[\p{L}0-9_]{3,20}$/u;

const curseWords = ['hovno', 'kurva', 'kokot', 'sranie', 'sračky', 'debil', 'blbec', 'piča', 'chuj', 'zmetok', 'sprostost', 'nadavka', 'nadávka', 'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'fucker', 'motherfucker', 'slut', 'whore'];
const curseWordsSet = new Set(curseWords);
const MAX_MESSAGE_LENGTH = 280;
const MAX_ROOM_LENGTH = 40;
const MAX_USERNAME_LENGTH = 20;
const SUSPICIOUS_PATTERN = /(?:javascript:|vbscript:|data:|<script|on\w+\s*=)/i;
const SECURITY_BANNER = '🛡 Bezpečnostná ochrana';
const SECURITY_PROTECTIONS = ['rate limiting', 'helmet headers', 'súborové filtry', 'zabanovanie podozrivých používateľov', 'blokovanie škodlivých skriptov', 'kontrola vstupov'];
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

let moderationSequence = 1;

function createModerationId(prefix) {
  const next = moderationSequence++;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

function recordModerationEvent(event) {
  moderationHistory.push({
    id: `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event
  });
  if (moderationHistory.length > 200) moderationHistory.shift();
}

function addModerationNotification(notification) {
  const entry = {
    id: notification.id || `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    readBy: [],
    ...notification
  };
  moderationNotifications.push(entry);
  if (moderationNotifications.length > 200) moderationNotifications.shift();
  const humanModerators = Array.from(users.values()).filter((user) => user && ['owner', 'moderator'].includes(user.role));
  humanModerators.forEach((user) => {
    const socket = io.sockets.sockets.get(user.id);
    if (socket) {
      socket.emit('moderation-notification', entry);
      socket.emit('moderation-sound', { type: entry.type || 'alert' });
    }
  });
  return entry;
}

function getModeratorStateForRole(role) {
  const activeReports = moderationReports.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedAppeals = appeals.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const summary = {
    totalReports: activeReports.length,
    totalAppeals: sortedAppeals.length,
    openAppeals: sortedAppeals.filter((item) => item.status === 'pending' || item.status === 'review').length,
    totalActions: moderationHistory.length,
    activeUsers: users.size
  };

  return {
    role,
    summary,
    reports: activeReports,
    appeals: sortedAppeals,
    notifications: moderationNotifications,
    history: moderationHistory.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    stats: summary
  };
}

function broadcastModerationState() {
  const targets = Array.from(users.values()).filter((user) => user && ['owner', 'moderator'].includes(user.role));
  targets.forEach((user) => {
    const socket = io.sockets.sockets.get(user.id);
    if (socket) {
      socket.emit('moderation-center-state', getModeratorStateForRole(user.role));
    }
  });
}

function getVisibleUsers() {
  const list = Array.from(users.values());
  const hasRobot = list.some((user) => user && user.username === ROBOT_NAME);
  if (!hasRobot) {
    list.push(robotUser);
  }
  return list;
}

function sendDailyQuizInvitation(targetUser) {
  const targetSocket = io.sockets.sockets.get(targetUser.id);
  if (!targetSocket) return;

  const inviteText = `Ahoj ${targetUser.username}! Dnes je večerný kvíz o 20:00. Napíš ANO a dám ti vedieť do kalendára. Keď napíšeš NIE, zruším to.`;
  const payload = {
    id: Date.now() + Math.random(),
    from: ROBOT_NAME,
    to: targetUser.username,
    text: inviteText,
    timestamp: new Date().toISOString(),
    self: false
  };
  targetSocket.emit('receive-private-message', payload);
}

function maybeSendDailyQuizInvitations() {
  const now = new Date();
  if (now.getHours() !== 20 || now.getMinutes() !== 0) return;

  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (quizReminderCache.has(dayKey)) return;

  quizReminderCache.add(dayKey);
  Array.from(users.values()).forEach((targetUser) => {
    if (!targetUser || !targetUser.username) return;
    sendDailyQuizInvitation(targetUser);
  });
}

setInterval(() => {
  maybeSendDailyQuizInvitations();
}, 30000);

function broadcastUserList() {
  io.emit('user-list', getVisibleUsers());
}

async function maybeRobotReply(authorUsername, roomName, text) {
  if (!text || authorUsername === ROBOT_NAME) return;

  const normalized = String(text).trim();
  const shouldReact = /(ahoj|hello|hi|dobrý deň|dobry den|zdravo|nazdar|servus|ciao|robot|ako sa|čo robíš|co robis|kde si|chceš|chces|\?)/i.test(normalized);
  if (!shouldReact) return;

  const reply = await generateRobotReplyFromApi(normalized);
  if (!reply) return;

  const botMessage = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    username: ROBOT_NAME,
    text: reply,
    timestamp: new Date().toISOString(),
    room: normalizeRoomName(roomName || 'Spoločná'),
    reactions: {}
  };

  io.emit('receive-message', botMessage);
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

function getUserSocketsByName(username) {
  const lookup = String(username || '').trim().toLowerCase();
  if (!lookup) return [];

  const matches = [];
  for (const [socketId, user] of users.entries()) {
    if (!user || !user.username) continue;
    if (user.username.toLowerCase() !== lookup) continue;

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      matches.push({ id: socketId, socket, user });
    }
  }
  return matches;
}

function applyBanForUser(username, hours, reason, initiatorName) {
  const safeName = String(username || '').trim();
  if (!safeName) return;

  const banHours = Number.isFinite(hours) && hours > 0 ? Math.min(Math.floor(hours), 240) : 24;
  const startedAt = Date.now();
  const expires = startedAt + banHours * 60 * 60 * 1000;
  banList.set(safeName.toLowerCase(), expires);

  const banScreenData = buildBanScreenData({
    username: safeName,
    reason,
    hours: banHours,
    startedAt,
    initiator: initiatorName || 'Moderátor'
  });

  const sockets = getUserSocketsByName(safeName);
  sockets.forEach(({ socket, id }) => {
    socket.emit('system-message', `Bol si ${reason} na ${banHours} hodín.`);
    socket.emit('ban-screen', banScreenData);
    setTimeout(() => {
      socket.disconnect(true);
      users.delete(id);
    }, 120);
  });

  if (initiatorName) {
    io.emit('system-message', `${initiatorName} ${reason} ${safeName} na ${banHours} hodín.`);
  }

  broadcastUserList();
}

function normalizeUsername(value) {
  return (value || '').toString().trim();
}

function normalizeRoomName(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ').slice(0, 40) || 'Spoločná';
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

function sanitizeChatText(text) {
  if (typeof text !== 'string') return '';
  let cleaned = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+=/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, MAX_MESSAGE_LENGTH);
}

function containsSuspiciousPayload(value) {
  if (value == null) return false;
  if (typeof value === 'string') {
    return SUSPICIOUS_PATTERN.test(value) || ANTIVIRUS_DANGEROUS_PATTERN.test(value);
  }
  if (typeof value === 'object') {
    try {
      return containsSuspiciousPayload(JSON.stringify(value));
    } catch (_) {
      return false;
    }
  }
  return false;
}

function isSuspiciousText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_MESSAGE_LENGTH) return true;
  return SUSPICIOUS_PATTERN.test(trimmed);
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

function hasSmtpConfiguration() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendPasswordResetEmail(account, resetCode) {
  const resetMessage = `Ahoj ${account.username},\n\nTvoje nové dočasné heslo je: ${resetCode}\n\nPo prihlásení sa môžeš prihlásiť a zmeniť ho v nastaveniach alebo po prihlásení.\n\nOddych Chat`;

  if (!hasSmtpConfiguration()) {
    console.log(`[password-reset] fallback email delivery for ${account.email}: ${resetCode}`);
    return { delivered: false, fallback: true, resetCode };
  }

  try {
    await resetEmailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: account.email,
      subject: 'Oddych Chat – obnovenie hesla',
      text: resetMessage
    });
    return { delivered: true, fallback: false, resetCode };
  } catch (error) {
    console.error('[password-reset] email send failed', error.message);
    return { delivered: false, fallback: true, resetCode };
  }
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

async function handleEntryRequest({ username, password }) {
  const normalizedUsername = normalizeUsername(username);
  const passwordValue = normalizePassword(password);

  if (!isValidUsername(normalizedUsername)) {
    throw new Error('Meno musí mať 3 až 20 znakov a môže obsahovať iba písmená, čísla alebo _.');
  }

  const normalizedKey = normalizedUsername.toLowerCase();
  const existingAccount = accounts.get(normalizedKey);
  if (existingAccount) {
    if (passwordValue && existingAccount.passwordHash) {
      const passwordOk = await bcrypt.compare(passwordValue, existingAccount.passwordHash);
      if (!passwordOk) {
        throw new Error('Nesprávne heslo.');
      }
    }
    return {
      ok: true,
      created: false,
      username: existingAccount.username,
      role: existingAccount.role || null
    };
  }

  const newAccount = {
    username: normalizedUsername,
    passwordHash: passwordValue ? await bcrypt.hash(passwordValue, 10) : null,
    role: isAdminName(normalizedKey)
      ? 'admin'
      : (isModeratorName(normalizedKey) ? 'moderator' : (testerUsernames.has(normalizedKey) ? 'tester' : null))
  };
  accounts.set(normalizedKey, newAccount);
  return {
    ok: true,
    created: true,
    username: newAccount.username,
    role: newAccount.role || null
  };
}

app.post('/api/enter', async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');

    if (containsSuspiciousPayload({ username, password })) {
      res.status(400).json({ ok: false, message: 'Neplatná požiadavka.' });
      return;
    }

    const result = await handleEntryRequest({ username, password });
    const token = createAuthToken(result.username);
    authTokens.set(token, {
      username: result.username,
      role: result.role || null,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, created: result.created, token, username: result.username, role: result.role || null });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || 'Vstup do chatu zlyhal.' });
  }
});

app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');

    if (containsSuspiciousPayload({ username, password })) {
      res.status(400).json({ ok: false, message: 'Neplatná požiadavka.' });
      return;
    }

    const result = await handleEntryRequest({ username, password });
    res.json({ ok: true, created: result.created, username: result.username, role: result.role || null });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || 'Registrácia zlyhala.' });
  }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body && req.body.username ? req.body.username : '');
    const password = normalizePassword(req.body && req.body.password ? req.body.password : '');

    if (containsSuspiciousPayload({ username, password })) {
      res.status(400).json({ ok: false, message: 'Neplatná požiadavka.' });
      return;
    }

    const result = await handleEntryRequest({ username, password });
    const token = createAuthToken(result.username);
    authTokens.set(token, {
      username: result.username,
      role: result.role || null,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, token, username: result.username, role: result.role || null, created: result.created });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || 'Prihlásenie zlyhalo.' });
  }
});

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  socket.emit('load-messages', messages);
  socket.emit('user-list', getVisibleUsers());

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
    const isProtectedModerationName = isAdminName(normalizedUsername) || isModeratorName(normalizedUsername);
    if ((protectedUsernames.has(normalizedUsername) || reservedJoinNames.has(normalizedUsername)) && !isProtectedModerationName) {
      socket.emit('join-denied', 'Meno je už obsadené. Názov správcu alebo moderátora nie je možné použiť.');
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
      const existingSocket = io.sockets.sockets.get(duplicateUser.id);
      if (existingSocket && existingSocket !== socket) {
        existingSocket.emit('system-message', 'Tvoje spojenie bolo nahradené novým pripojením.');
        existingSocket.disconnect(true);
      }
      users.delete(duplicateUser.id);
    }

    const storedRole = accounts.get(normalizedUsername)?.role || null;
    const resolvedRole = getEffectiveModeratorRole(normalizedUsername, storedRole) || (testerUsernames.has(normalizedUsername) ? 'tester' : null);
    users.set(socket.id, {
      id: socket.id,
      username: safeUsername,
      role: resolvedRole || null
    });
    socket.data.joined = true;
    socket.emit('security-banner', getSecurityStatus(safeUsername));
    broadcastUserList();
  });

  socket.on('command', (data) => {
    if (!data || !data.target) return;
    const fromUser = users.get(socket.id);
    if (!fromUser) return;

    const targetName = String(data.target).trim();
    if (!targetName) return;
    if (isAdminName(targetName) || isModeratorName(targetName)) {
      socket.emit('system-message', 'Správcu alebo moderátora nevyhodíš alebo nezakážeš.');
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

    if (!canModerateAction(fromUser.role, targetEntry.role)) {
      socket.emit('system-message', 'Na moderovanie máš oprávnenie iba pre bežných používateľov.');
      return;
    }

    if (data.type === 'ban') {
      const hoursValue = Number(data.hours);
      const banHours = Number.isFinite(hoursValue) && hoursValue > 0 ? Math.min(Math.floor(hoursValue), 240) : 29;
      applyBanForUser(targetName, banHours, 'zabanoval', fromUser.username);
      recordModerationEvent({
        type: 'ban',
        actor: fromUser.username,
        target: targetName,
        reason: `zabanoval ${targetName} na ${banHours} hodín`,
        timestamp: new Date().toISOString()
      });
      broadcastModerationState();
      return;
    }

    if (data.type === 'kick') {
      if (targetSocket) {
        const kickScreenData = buildKickScreenData({
          username: targetName,
          room: normalizeRoomName(data.room || 'Spoločná'),
          reason: 'Vyhodenie z miestnosti',
          initiatedAt: Date.now(),
          initiator: fromUser.username
        });

        targetSocket.emit('system-message', 'Bol si vyhodený z miestnosti.');
        targetSocket.emit('kick-screen', kickScreenData);
        setTimeout(() => {
          targetSocket.disconnect(true);
        }, 180);
      }
      users.delete(targetEntry.id);
      recordModerationEvent({
        type: 'kick',
        actor: fromUser.username,
        target: targetName,
        reason: 'vyhodil z miestnosti',
        timestamp: new Date().toISOString()
      });
      broadcastUserList();
      io.emit('system-message', `${fromUser.username} vyhodil ${targetName} z chatu.`);
      broadcastModerationState();
      return;
    }

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
    if (!user || !canModerateAction(user.role, 'user')) {
      if (user) {
        socket.emit('system-message', 'Vymazať chat môže iba správca alebo moderátor.');
      }
      return;
    }

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

    io.emit('system-message', `${user.username} spustil odpočet. Číslo ${value} je teraz zobrazené všetkým v chate.`);

    io.emit('countdown:start', {
      value,
      byUsername: user.username || 'Správca',
      rewardPoints: 0,
      rewardText: 'Odpočet bez bodov.',
      rewardedUsers: []
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

  socket.on('report-message', (data) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('system-message', 'Najprv sa prihlás do chatu.');
      return;
    }

    const reportedUsername = String(data && data.username ? data.username : '').trim();
    const reportedText = String(data && data.text ? data.text : '').trim();
    const roomName = normalizeRoomName(data && data.room ? data.room : 'Spoločná');
    if (!reportedUsername || !reportedText) {
      socket.emit('system-message', 'Nahlásenie neobsahuje správnu správu.');
      return;
    }

    const safeText = sanitizeProfanity(sanitizeChatText(reportedText)).slice(0, 160);
    const reportEntry = {
      id: `REPORT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reporter: user.username,
      reportedUser: reportedUsername,
      reason: safeText,
      room: roomName,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    moderationReports.push(reportEntry);
    recordModerationEvent({
      type: 'report',
      actor: user.username,
      target: reportedUsername,
      reason: safeText,
      room: roomName,
      timestamp: new Date().toISOString()
    });

    addModerationNotification({
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'report',
      title: 'Nové nahlásenie',
      message: `${user.username} nahlásil ${reportedUsername} v miestnosti ${roomName}.`,
      target: reportedUsername,
      actor: user.username,
      relatedId: reportEntry.id,
      route: 'reports'
    });

    const adminSockets = [...io.sockets.sockets.values()].filter((targetSocket) => {
      const targetUser = users.get(targetSocket.id);
      return Boolean(targetUser && targetUser.username && (isAdminName(targetUser.username) || isModeratorName(targetUser.username)));
    });

    const reportMessage = `⚠ Nahlásenie: ${user.username} nahlásil správu od ${reportedUsername} v miestnosti ${roomName}: "${safeText}"`;
    adminSockets.forEach((targetSocket) => targetSocket.emit('system-message', reportMessage));
    broadcastModerationState();
    socket.emit('system-message', 'Správa bola nahlásená moderátorom.');
  });

  socket.on('moderation:discard-report', (data) => {
    const user = users.get(socket.id);
    if (!user || !['owner', 'moderator'].includes(user.role)) {
      socket.emit('system-message', 'Iba správca a moderátori môžu zahadzovať reporty.');
      return;
    }

    const rawIds = Array.isArray(data && data.ids) ? data.ids : (data && data.id ? [data.id] : []);
    const nextIds = rawIds.map((item) => String(item || '').trim()).filter(Boolean);
    if (!nextIds.length) {
      socket.emit('system-message', 'Nezvolil si žiadny report na zmazanie.');
      return;
    }

    const removed = [];
    for (let index = moderationReports.length - 1; index >= 0; index -= 1) {
      const report = moderationReports[index];
      if (nextIds.includes(String(report.id))) {
        removed.push(report);
        moderationReports.splice(index, 1);
      }
    }

    if (!removed.length) {
      socket.emit('system-message', 'Vybraný report neexistuje.');
      return;
    }

    recordModerationEvent({
      type: 'report-discarded',
      actor: user.username,
      target: removed.map((item) => item.reportedUser || 'Používateľ').join(', '),
      reason: 'Report bol zahodený moderátorom.',
      room: removed[0].room || 'Spoločná',
      durationHours: 0,
      isTest: false,
      status: 'discarded',
      timestamp: new Date().toISOString()
    });

    addModerationNotification({
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'report-discarded',
      title: 'Report bol zmazaný',
      message: `${user.username} zahodil report(y) pre ${removed.map((item) => item.reportedUser || 'Používateľ').join(', ')}.`,
      actor: user.username,
      route: 'reports'
    });

    broadcastModerationState();
    socket.emit('system-message', `${removed.length} report${removed.length > 1 ? 'y' : ''} bol${removed.length > 1 ? 'i' : ''} zmazan${removed.length > 1 ? 'é' : 'ý'}.`);
  });

  socket.on('moderation-center:request', () => {
    const user = users.get(socket.id);
    const role = user && user.role ? user.role : null;
    if (!role || !['owner', 'moderator'].includes(role)) {
      return;
    }
    socket.emit('moderation-center-state', getModeratorStateForRole(role));
    socket.emit('moderation-unread-count', moderationNotifications.filter((notification) => !notification.readBy.includes(user.username)).length);
  });

  socket.on('moderation:assign-role', (data) => {
    const actor = users.get(socket.id);
    if (!actor || !['owner', 'moderator'].includes(actor.role)) {
      socket.emit('system-message', 'Iba správca a moderátori môžu meniť role používateľov.');
      return;
    }

    const targetName = String(data && data.target ? data.target : '').trim();
    const nextRole = String(data && data.role ? data.role : '').trim().toLowerCase();
    if (!targetName || !['moderator', 'user'].includes(nextRole)) {
      socket.emit('system-message', 'Neplatná úloha pre priradenie role.');
      return;
    }

    const normalizedKey = normalizeUsername(targetName).toLowerCase();
    const targetUser = Array.from(users.values()).find((entry) => entry.username.toLowerCase() === normalizedKey);
    const account = accounts.get(normalizedKey);

    if (!targetUser && !account) {
      socket.emit('system-message', `Používateľ ${targetName} nie je zaregistrovaný alebo momentálne pripojený.`);
      return;
    }

    if (targetUser && targetUser.role === 'owner') {
      socket.emit('system-message', 'Správcu nie je možné zmeniť.');
      return;
    }

    const resolvedRole = nextRole === 'moderator' ? 'moderator' : null;

    if (account) {
      account.role = resolvedRole;
    }

    if (targetUser) {
      targetUser.role = resolvedRole;
    }

    broadcastUserList();
    broadcastModerationState();
    socket.emit('system-message', nextRole === 'moderator' ? `${targetName} dostal rolu Moderátor.` : `${targetName} stratil rolu Moderátor.`);
  });

  socket.on('moderation:execute', (data) => {
    const user = users.get(socket.id);
    if (!user || !['owner', 'moderator'].includes(user.role)) {
      socket.emit('system-message', 'Iba správca a moderátori môžu vykonávať zásahy.');
      return;
    }

    const type = String(data && data.type ? data.type : 'ban').toLowerCase();
    if (!['ban', 'kick'].includes(type)) {
      socket.emit('system-message', 'Neplatný typ moderátorského zásahu.');
      return;
    }

    const targetName = String(data && data.target ? data.target : '').trim();
    if (!targetName) {
      socket.emit('system-message', 'Vyber používateľa pre moderátorský zásah.');
      return;
    }

    const targetEntry = Array.from(users.values()).find((entry) => entry.username.toLowerCase() === targetName.toLowerCase());
    if (targetEntry && !canModerateAction(user.role, targetEntry.role)) {
      socket.emit('system-message', 'Na tento zásah nemáš oprávnenie.');
      return;
    }

    const reason = String(data && data.reason ? data.reason : 'Porušenie pravidiel').trim() || 'Porušenie pravidiel';
    const room = normalizeRoomName(data && data.room ? data.room : socket.data.room || 'Spoločná');
    const durationHours = Number(data && data.durationHours ? data.durationHours : (type === 'ban' ? 24 : 0));
    const note = String(data && data.note ? data.note : '').trim();
    const mode = String(data && data.mode ? data.mode : 'test').toLowerCase() === 'real' ? 'real' : 'test';

    if (type === 'kick') {
      const kickPayload = buildKickScreenData({
        username: targetName,
        room,
        reason,
        initiatedAt: Date.now(),
        initiator: user.username
      });
      kickPayload.isTest = mode === 'test';
      kickPayload.testMode = mode === 'test';
      kickPayload.note = note;
      kickPayload.durationHours = 0;

      if (mode === 'test') {
        const targetSocket = targetEntry ? io.sockets.sockets.get(targetEntry.id) : null;
        if (targetSocket) {
          targetSocket.emit('kick-screen', kickPayload);
        }
        recordModerationEvent({
          type: 'kick-test',
          actor: user.username,
          target: targetName,
          reason,
          durationHours: 0,
          room,
          note,
          isTest: true,
          status: 'test',
          timestamp: new Date().toISOString()
        });
        socket.emit('system-message', 'Testovací režim kicku bol vytvorený iba ako ukážka. Skutočný kick nebol vykonaný.');
        broadcastModerationState();
        return;
      }

      if (!targetEntry) {
        socket.emit('system-message', `Používateľ ${targetName} nie je aktuálne pripojený.`);
        return;
      }

      const targetSocket = io.sockets.sockets.get(targetEntry.id);
      if (targetSocket) {
        targetSocket.emit('kick-screen', { ...kickPayload, isTest: false, testMode: false });
        setTimeout(() => {
          targetSocket.disconnect(true);
          users.delete(targetEntry.id);
        }, 200);
      }
      recordModerationEvent({
        type: 'kick',
        actor: user.username,
        target: targetName,
        reason,
        durationHours: 0,
        room,
        note,
        isTest: false,
        status: 'active',
        timestamp: new Date().toISOString()
      });
      broadcastUserList();
      io.emit('system-message', `${user.username} kickol ${targetName} z miestnosti ${room}.`);
      broadcastModerationState();
      return;
    }

    const safeBanHours = Number.isFinite(durationHours) && durationHours > 0 ? Math.min(Math.floor(durationHours), 240) : 24;
    const banPayload = buildBanScreenData({
      username: targetName,
      reason,
      hours: safeBanHours,
      startedAt: Date.now(),
      initiator: user.username
    });
    banPayload.isTest = mode === 'test';
    banPayload.testMode = mode === 'test';
    banPayload.note = note;
    banPayload.room = room;

    if (mode === 'test') {
      const targetSocket = targetEntry ? io.sockets.sockets.get(targetEntry.id) : null;
      if (targetSocket) {
        targetSocket.emit('ban-screen', banPayload);
      }
      recordModerationEvent({
        type: 'ban-test',
        actor: user.username,
        target: targetName,
        reason,
        durationHours: safeBanHours,
        room,
        note,
        isTest: true,
        status: 'test',
        timestamp: new Date().toISOString()
      });
      socket.emit('system-message', 'Testovací režim banu bol aktivovaný iba ako ukážka. Skutočný ban nebol uložený.');
      broadcastModerationState();
      return;
    }

    applyBanForUser(targetName, safeBanHours, reason, user.username);
    recordModerationEvent({
      type: 'ban',
      actor: user.username,
      target: targetName,
      reason,
      durationHours: safeBanHours,
      room,
      note,
      isTest: false,
      status: 'active',
      timestamp: new Date().toISOString()
    });
    socket.emit('system-message', `Používateľ ${targetName} bol banovaný na ${safeBanHours} hodín.`);
    broadcastModerationState();
  });

  socket.on('notifications:mark-read', (notificationIds = []) => {
    const user = users.get(socket.id);
    if (!user) return;
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    moderationNotifications.forEach((notification) => {
      if (ids.includes(notification.id) && !notification.readBy.includes(user.username)) {
        notification.readBy.push(user.username);
      }
    });
    socket.emit('moderation-unread-count', moderationNotifications.filter((notification) => !notification.readBy.includes(user.username)).length);
    broadcastModerationState();
  });

  socket.on('submit-appeal', (data) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('system-message', 'Najprv sa prihlás do chatu.');
      return;
    }

    const type = String(data && data.type ? data.type : 'BAN').toUpperCase();
    const reason = String(data && data.reason ? data.reason : 'Neznámy dôvod').trim();
    const text = String(data && data.text ? data.text : '').trim();
    if (!text) {
      socket.emit('system-message', 'Odvolanie musí obsahovať popis prečo si myslíš, že ide o omyl.');
      return;
    }

    const appeal = {
      id: createModerationId('APPEAL'),
      username: user.username,
      type,
      reason,
      text,
      status: 'pending',
      createdAt: new Date().toISOString(),
      room: normalizeRoomName(data && data.room ? data.room : 'Spoločná')
    };
    appeals.push(appeal);
    recordModerationEvent({
      type: 'appeal',
      actor: user.username,
      target: user.username,
      reason: `${type}: ${reason}`,
      timestamp: new Date().toISOString()
    });
    const notification = addModerationNotification({
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'appeal',
      title: 'Nové odvolanie',
      message: `${user.username} odoslal odvolanie (${type}).`,
      target: user.username,
      actor: user.username,
      relatedId: appeal.id,
      route: 'appeals'
    });
    socket.emit('appeal-submitted', { appeal, notification });
    socket.emit('system-message', `Odvolanie bolo odoslané. Vaše ID: ${appeal.id}`);
    broadcastModerationState();
  });

  socket.on('appeal:decide', (data) => {
    const user = users.get(socket.id);
    if (!user || !['owner', 'moderator'].includes(user.role)) {
      return;
    }

    const appealId = String(data && data.id ? data.id : '').trim();
    const decision = String(data && data.decision ? data.decision : 'rejected').toLowerCase();
    const appealIndex = appeals.findIndex((item) => item.id === appealId);
    if (appealIndex === -1) {
      return;
    }

    const appeal = appeals[appealIndex];
    appeal.status = decision === 'approved' ? 'approved' : (decision === 'review' ? 'review' : 'rejected');
    appeal.reviewedBy = user.username;
    appeal.reviewedAt = new Date().toISOString();

    if (decision === 'approved' && appeal.type === 'BAN') {
      banList.delete(appeal.username.toLowerCase());
    }

    recordModerationEvent({
      type: 'appeal-decision',
      actor: user.username,
      target: appeal.username,
      reason: `${decision} odvolanie ${appeal.id}`,
      timestamp: new Date().toISOString()
    });

    addModerationNotification({
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'appeal-decision',
      title: 'Výsledok odvolania',
      message: `Odvolanie ${appeal.id} bolo ${appeal.status}.`,
      target: appeal.username,
      actor: user.username,
      relatedId: appeal.id,
      route: 'appeals'
    });

    io.emit('system-message', `${user.username} ${appeal.status === 'approved' ? 'schválil' : 'zamietol'} odvolanie ${appeal.id} používateľa ${appeal.username}.`);
    broadcastModerationState();
  });

  socket.on('send-message', async (data) => {
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

    const targetUsername = String(toId) === 'robot' ? ROBOT_NAME : (users.get(toId) ? users.get(toId).username : '');
    if (String(toId) === 'robot' || targetUsername === ROBOT_NAME) {
      const robotActivated = data && data.robotActivated === true;
      if (!robotActivated) {
        socket.emit('system-message', 'Najprv klikni na tlačidlo Osloviť pri Roboto a potom môžeš začať rozhovor.');
        return;
      }
      const robotReply = generateRobotReply(text);
      const robotMessage = {
        id: Date.now(),
        from: ROBOT_NAME,
        to: user.username,
        text: robotReply,
        timestamp: new Date().toISOString(),
        self: false
      };
      socket.emit('receive-private-message', {
        ...robotMessage,
        self: true,
        toUsername: user.username
      });
      socket.emit('receive-private-message', robotMessage);
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
    broadcastUserList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`New chat running on http://localhost:${PORT}`));
