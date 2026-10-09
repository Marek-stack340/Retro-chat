const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const activeUsersCount = document.getElementById('active-users-count');
const usersList = document.getElementById('users-list');
const currentUsernameDisplay = document.getElementById('current-username-display');
const myPointsDisplay = document.getElementById('my-points-display');
const navLogout = document.getElementById('nav-logout');
const navHelp = document.getElementById('nav-help');
const navProfile = document.getElementById('nav-profile');
const navFriends = document.getElementById('nav-friends');
const navIgnore = document.getElementById('nav-ignore');
const navSettings = document.getElementById('nav-settings');
const navQuicklink = document.getElementById('nav-quicklink');
const navMessenger = document.getElementById('nav-messenger');
const chatApp = document.querySelector('.chat-app');
const newsHistoryToggle = document.getElementById('news-history-toggle');
const newsHistoryPanel = document.getElementById('news-history-panel');
const newsHistoryClose = document.getElementById('news-history-close');
const newsHistoryBackdrop = document.getElementById('news-history-backdrop');
const newsHistoryList = document.getElementById('news-history-list');
const quicklinkOverlay = document.getElementById('quicklink-overlay');
const quicklinkClose = document.getElementById('quicklink-close');
const quicklinkTargetInput = document.getElementById('quicklink-target-input');
const quicklinkContinue = document.getElementById('quicklink-continue');
const privateThreadHeader = document.getElementById('private-thread-header');
const privateThreadName = document.getElementById('private-thread-name');
const privateThreadAvatar = document.getElementById('private-thread-avatar');

const privateStatus = document.getElementById('private-status');
const privateTargetNameDisplay = document.getElementById('private-target-name');

// Nastavenia odosielania
const sendSettingsModal = document.getElementById('send-settings-modal');
const sendSettingsPrivateToggle = document.getElementById('send-settings-private-toggle');
const sendSettingsTarget = document.getElementById('send-settings-target');
const sendSettingsSave = document.getElementById('send-settings-save');
const sendSettingsCancel = document.getElementById('send-settings-cancel');

const countdownOverlay = document.getElementById('countdown-overlay');
const countdownValueEl = document.getElementById('countdown-value');
const countdownLabelEl = document.getElementById('countdown-label');
const profileModal = document.getElementById('profile-modal');
const profileCloseBtn = document.getElementById('profile-close');
const profileCancelBtn = document.getElementById('profile-cancel');
const profileSaveBtn = document.getElementById('profile-save');
const profileAvatarInput = document.getElementById('profile-avatar-input');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const profileAvatarEmpty = document.getElementById('profile-avatar-empty');
const profileBioInput = document.getElementById('profile-bio');
const profileAgeInput = document.getElementById('profile-age');
const profileBirthdateInput = document.getElementById('profile-birthdate');
const profileCityInput = document.getElementById('profile-city');
const profileStatusInput = document.getElementById('profile-status');
const profileHobbiesInput = document.getElementById('profile-hobbies');
const snakeGameButton = document.getElementById('snake-game-button');
const snakeGameModal = document.getElementById('snake-game-modal');
const snakeGameBoard = document.getElementById('snake-game-board');
const snakeGameScore = document.getElementById('snake-game-score');
const snakeGameOverlay = document.getElementById('snake-game-overlay');
const snakeGameClose = document.getElementById('snake-game-close');
const snakeGameRetry = document.getElementById('snake-game-retry');
const snakeGameBack = document.getElementById('snake-game-back');
const topicNameInput = document.getElementById('topic-name-input');
const createTopicBtn = document.getElementById('create-topic-btn');
const securityBadge = document.getElementById('security-badge');
const securityMessage = document.getElementById('security-message');
const securityCheckBtn = document.getElementById('security-check-btn');

let publicMessageHistory = [];
let currentRoom = normalizeRoomName(localStorage.getItem('chatCurrentRoom') || 'Spoločná');
const newsHistoryStorageKey = 'chatNewsHistoryV1';
function loadNewsHistoryEntries() {
  try {
    const stored = localStorage.getItem(newsHistoryStorageKey);
    if (!stored) {
      return [
        {
          title: 'Oddych body',
          body: 'Pridané Oddych body za aktivitu v chate, reakcie a súkromné správy.',
          createdAt: '2026-07-26T00:00:00.000Z'
        },
        {
          title: '.countdown odmena',
          body: 'Pri príkaze .countdown číslo dostanú všetci pripojení používatelia rovnaký počet bodov a na displeji sa zobrazí hláška o odmene.',
          createdAt: '2026-07-26T00:00:00.000Z'
        },
        {
          title: 'Globálny .countdown',
          body: 'Pridaný globálny príkaz .countdown číslo, ktorý admin zobrazí všetkým na celej obrazovke aj s hlasným odpočtom.',
          createdAt: '2026-07-26T00:00:00.000Z'
        },
        {
          title: 'Filter nadávok',
          body: 'Filter nadávok bol upravený. Namiesto dvojitých hashtagov sa nadávky maskujú na znaky #.',
          createdAt: '2026-07-19T00:00:00.000Z'
        }
      ];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}
function loadProfileData() {
  try {
    const raw = localStorage.getItem('chatProfileV1');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}
function saveProfileData(data) {
  localStorage.setItem('chatProfileV1', JSON.stringify(data));
}
function renderProfileForm() {
  const data = loadProfileData();
  if (profileBioInput) profileBioInput.value = data.bio || '';
  if (profileAgeInput) profileAgeInput.value = data.age || '';
  if (profileBirthdateInput) profileBirthdateInput.value = data.birthdate || '';
  if (profileCityInput) profileCityInput.value = data.city || '';
  if (profileStatusInput) profileStatusInput.value = data.status || '';
  if (profileHobbiesInput) profileHobbiesInput.value = data.hobbies || '';

  if (profileAvatarPreview && profileAvatarEmpty) {
    if (data.avatarDataUrl) {
      profileAvatarPreview.src = data.avatarDataUrl;
      profileAvatarPreview.style.display = 'block';
      profileAvatarEmpty.style.display = 'none';
    } else {
      profileAvatarPreview.removeAttribute('src');
      profileAvatarPreview.style.display = 'none';
      profileAvatarEmpty.style.display = 'flex';
    }
  }
}
function openProfileModal() {
  renderProfileForm();
  if (profileModal) profileModal.style.display = 'flex';
}
function closeProfileModal() {
  if (profileModal) profileModal.style.display = 'none';
}
let newsHistoryEntries = loadNewsHistoryEntries();
let lastClearTime = Number(localStorage.getItem('chatClearAt') || 0) || 0;
let countdownState = null;

const createRoomInput = document.getElementById('create-room');
const createRoomBtn = document.getElementById('create-room-btn');
const roomsList = document.querySelector('.rooms-list');
const emojiLine = document.getElementById('emoji-line');
const emojiSet = ['🙂', '😃', '😍', '😎', '😏', '😡', '😂', '🙃', '😮'];
const reactionSet = ['👍', '❤️', '😂', '😮', '😡'];
const diceRiddles = [
  { value: 1, text: 'Hádanka: Čo je to, čo máš v rukách, ale nikdy nevidíš?' },
  { value: 2, text: 'Hádanka: Čo má dvere, ale neotvára ich nikto?' },
  { value: 3, text: 'Hádanka: Čo môže bežať, aj keď nemá nohy?' },
  { value: 4, text: 'Hádanka: Čo má steny, ale nie je dom?' },
  { value: 5, text: 'Hádanka: Čo môžeš držať v prstoch, ale nikdy nedržíš?' },
  { value: 6, text: 'Hádanka: Čo máš vždy pred sebou, ale nikdy nevidíš?' }
];
const savedUsername = localStorage.getItem('chatUsername');
let currentUsername = savedUsername ? savedUsername.trim() : 'Správca';
let autoPrivateEnabled = localStorage.getItem('autoPrivateEnabled') === 'true';
let autoPrivateTargetName = localStorage.getItem('autoPrivateTargetName') || '';
let privateTargetId = null;
let privateTargetName = null;
let activeUsers = [];
let oddychPoints = {};
const ignoreList = new Set(JSON.parse(localStorage.getItem('chatIgnoreList') || '[]'));
const friendList = new Set(JSON.parse(localStorage.getItem('chatFriendList') || '[]'));
const onlineFriends = new Set();
let messengerMode = localStorage.getItem('chatMessengerMode') === 'true';
let lastSpokenAt = Date.now();
let joinHistoryPromptState = 'pending';

const CHAT_INACTIVITY_MS = 60 * 60 * 1000;
const MESSENGER_INACTIVITY_MS = 60 * 60 * 1000;

function loadChatStats() {
  try {
    const raw = localStorage.getItem('chatStatsV1');
    if (!raw) return { users: {}, popularity: {}, edges: {} };
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      popularity: parsed.popularity || {},
      edges: parsed.edges || {}
    };
  } catch (_) {
    return { users: {}, popularity: {}, edges: {} };
  }
}

function saveChatStats(stats) {
  localStorage.setItem('chatStatsV1', JSON.stringify(stats));
}

function updateActivityStats(username, delta) {
  const key = normalizeName(username);
  if (!key) return;
  const stats = loadChatStats();
  if (!stats.users[key]) {
    stats.users[key] = { displayName: username, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  const user = stats.users[key];
  user.displayName = username;
  user.messages += Number(delta.messages || 0);
  user.voiceNotes += Number(delta.voiceNotes || 0);
  user.lastActive = Date.now();
  saveChatStats(stats);
}

function updatePopularity(targetUsername, isAdded) {
  const actor = normalizeName(currentUsername);
  const target = normalizeName(targetUsername);
  if (!actor || !target || actor === target) return;

  const stats = loadChatStats();
  const edgeKey = `${actor}->${target}`;
  const edgeExists = !!stats.edges[edgeKey];

  if (isAdded && !edgeExists) {
    stats.edges[edgeKey] = 1;
    stats.popularity[target] = Number(stats.popularity[target] || 0) + 1;
  }

  if (!isAdded && edgeExists) {
    delete stats.edges[edgeKey];
    stats.popularity[target] = Math.max(0, Number(stats.popularity[target] || 0) - 1);
  }

  if (!stats.users[target]) {
    stats.users[target] = { displayName: targetUsername, messages: 0, voiceNotes: 0, lastActive: 0 };
  }
  stats.users[target].displayName = targetUsername;
  saveChatStats(stats);
}

function markSpokenActivity() {
  lastSpokenAt = Date.now();
}

function currentInactivityLimit() {
  return messengerMode ? MESSENGER_INACTIVITY_MS : CHAT_INACTIVITY_MS;
}

function performAutoLogout(reason) {
  alert(reason);
  localStorage.removeItem('chatUsername');
  localStorage.removeItem('chatRegistered');
  window.location.href = '/';
}

function checkInactivityLogout() {
  if (!localStorage.getItem('chatUsername')) return;
  const inactiveMs = Date.now() - lastSpokenAt;
  if (inactiveMs >= currentInactivityLimit()) {
    performAutoLogout(messengerMode
      ? 'Bol si 60 min neaktívny v Messengeri. Bol si automaticky odhlásený.'
      : 'Bol si 60 min neaktívny v chate. Bol si automaticky odhlásený.');
  }
}

function applyMessengerMode() {
  if (!chatApp || !navMessenger) return;
  chatApp.classList.toggle('messenger-mode', messengerMode);
  navMessenger.textContent = messengerMode ? 'Messenger ON' : 'Messenger';
  navMessenger.style.background = messengerMode ? '#2563eb' : '';
}

function isAwayFromChat() {
  const hidden = document.visibilityState !== 'visible';
  const notFocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  return hidden || notFocused;
}

function containsSuspiciousClientText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  return /(?:https?:\/\/|www\.|mailto:|javascript:|data:|<script|on\w+\s*=)/i.test(trimmed) || trimmed.length > 280;
}

function updateSecurityPanel(payload) {
  const safeMessage = payload && payload.message ? String(payload.message).replace(/\n/g, ' • ') : 'Chat je chránený pred podvodmi, škodlivým obsahom a útokmi.';
  if (securityBadge) {
    securityBadge.textContent = payload && payload.active === false ? '⚠ Ochrana neaktívna' : '🛡 Ochrana aktívna';
  }
  if (securityMessage) {
    securityMessage.textContent = safeMessage;
  }
}

function openNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.add('open');
  newsHistoryBackdrop.classList.add('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'false');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'false');
}

function closeNewsHistory() {
  if (!newsHistoryPanel || !newsHistoryBackdrop) return;
  newsHistoryPanel.classList.remove('open');
  newsHistoryBackdrop.classList.remove('open');
  newsHistoryPanel.setAttribute('aria-hidden', 'true');
  newsHistoryBackdrop.setAttribute('aria-hidden', 'true');
}

async function enterCountdownFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (_) {
    // Fullscreen can fail in some browsers; keep the overlay visible anyway.
  }
}

async function exitCountdownFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (_) {
    // Ignore fullscreen exit errors.
  }
}

function speakCountdownMessage(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sk-SK';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // Ignore speech errors and keep the countdown working.
  }
}

function renderCountdownOverlay(value, total, headlineText) {
  if (!countdownOverlay || !countdownValueEl || !countdownLabelEl) return;
  countdownValueEl.textContent = String(value);
  countdownLabelEl.textContent = headlineText || (total ? `Odpočítavam od ${total}` : 'Odpočítavanie');
  countdownOverlay.classList.add('visible');
  countdownOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('countdown-active');
}

function hideCountdownOverlay() {
  if (countdownOverlay) {
    countdownOverlay.classList.remove('visible');
    countdownOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('countdown-active');
}

function stopCountdown() {
  if (!countdownState) {
    hideCountdownOverlay();
    return;
  }
  if (countdownState.timer) {
    clearInterval(countdownState.timer);
  }
  if (countdownState.finishTimeout) {
    clearTimeout(countdownState.finishTimeout);
  }
  countdownState = null;
  hideCountdownOverlay();
  exitCountdownFullscreen();
}

function startCountdown(rawValue, options = {}) {
  const total = Math.floor(Number(rawValue));
  if (!Number.isFinite(total) || total < 1) {
    showToast('Použi .countdown číslo väčšie ako 0, napríklad .countdown 10');
    return;
  }
  if (total > 9999) {
    showToast('Skús číslo od 1 do 9999.');
    return;
  }

  stopCountdown();
  countdownState = {
    total,
    current: total,
    timer: null,
    finishTimeout: null,
    headline: options.headline || `Odpočítavam od ${total}`,
    finishText: options.finishText || 'Štart!'
  };

  renderCountdownOverlay(total, total, countdownState.headline);
  enterCountdownFullscreen();
  speakCountdownMessage(`${countdownState.headline}. Odpočítavanie začína na ${total}.`);

  countdownState.timer = setInterval(() => {
    if (!countdownState) return;
    countdownState.current -= 1;

    if (countdownState.current <= 0) {
      if (countdownState.timer) {
        clearInterval(countdownState.timer);
        countdownState.timer = null;
      }
      if (countdownValueEl) countdownValueEl.textContent = countdownState.finishText;
      if (countdownLabelEl) countdownLabelEl.textContent = countdownState.headline;
      speakCountdownMessage(countdownState.finishText || 'Hotovo.');
      countdownState.finishTimeout = setTimeout(() => {
        stopCountdown();
      }, 1000);
      return;
    }

    renderCountdownOverlay(countdownState.current, countdownState.total, countdownState.headline);
    speakCountdownMessage(String(countdownState.current));
  }, 1000);
}

function notifyIncomingMessage(fromName, previewText) {
  if (!('Notification' in window)) return;
  const title = 'Oddych chat';
  const body = fromName ? `${fromName}: ${previewText || 'nova sprava'}` : (previewText || 'Nova sprava');

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }).catch(() => {});
  }
}

function playPrivateMessageSound() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    const context = window.__oddychPrivateMessageAudioContext || new AudioCtor();
    window.__oddychPrivateMessageAudioContext = context;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.14);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.28);
  } catch (error) {
    console.warn('Private message sound unavailable:', error);
  }
}

function playBanAlarm() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    const context = window.__oddychBanAlarmAudioContext || new AudioCtor();
    window.__oddychBanAlarmAudioContext = context;

    const base = [880, 660, 540, 420];
    const now = context.currentTime;

    base.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const start = now + index * 0.18;

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequency * 0.7, 180), start + 0.16);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
  } catch (error) {
    console.warn('Ban alarm unavailable:', error);
  }
}

// Global error handlers to surface runtime errors (helps debug why buttons stop working)
window.addEventListener('error', (e) => {
  try {
    alert(`Script error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
  } catch (err) {
    console.error('Error handler failed', err);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    alert(`Unhandled promise rejection: ${e.reason}`);
  } catch (err) {
    console.error('Rejection handler failed', err);
  }
});

function saveIgnoreList() {
  localStorage.setItem('chatIgnoreList', JSON.stringify(Array.from(ignoreList)));
}

function saveFriendList() {
  localStorage.setItem('chatFriendList', JSON.stringify(Array.from(friendList)));
}

function normalizeName(value) {
  return (value || '').toString().trim().toLowerCase();
}

function getOddychPoints(username) {
  const key = normalizeName(username);
  return Number(oddychPoints[key] || 0);
}

function refreshMyPoints() {
  if (!myPointsDisplay) return;
  myPointsDisplay.textContent = String(getOddychPoints(currentUsername));
}

function refreshIgnoreStatus() {
  const pill = document.getElementById('ignore-status-pill');
  if (!pill) return;
  const count = ignoreList.size;
  pill.textContent = `Ignorovaní: ${count}`;
  pill.classList.toggle('muted', count === 0);
}

function isFriend(username) {
  return friendList.has(normalizeName(username));
}

function toggleFriend(username) {
  const key = normalizeName(username);
  if (!key) return false;
  if (friendList.has(key)) {
    friendList.delete(key);
    updatePopularity(username, false);
    saveFriendList();
    return false;
  }
  friendList.add(key);
  updatePopularity(username, true);
  saveFriendList();
  return true;
}

function toggleIgnoreUser(username) {
  if (!username) return;
  const lower = normalizeName(username);
  if (!lower) return;
  if (ignoreList.has(lower)) {
    ignoreList.delete(lower);
    saveIgnoreList();
    refreshIgnoreStatus();
    showToast(`Už neignoruješ ${username}.`);
    return;
  }
  ignoreList.add(lower);
  saveIgnoreList();
  refreshIgnoreStatus();
  showToast(`Ignoruješ ${username}.`);
}

function removeIgnoredUser(username) {
  if (!username) return false;
  const lower = normalizeName(username);
  if (!ignoreList.has(lower)) {
    return false;
  }
  ignoreList.delete(lower);
  saveIgnoreList();
  refreshIgnoreStatus();
  return true;
}

function isIgnored(username) {
  return ignoreList.has(normalizeName(username));
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function normalizeRoomName(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ').slice(0, 40) || 'Spoločná';
}

function saveRoomList() {
  if (!roomsList) return;
  const roomNames = Array.from(roomsList.querySelectorAll('.room-item'))
    .map((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')))
    .filter((name) => name && name !== 'Spoločná');
  localStorage.setItem('chatRoomNamesV1', JSON.stringify(Array.from(new Set(roomNames))));
}

function updateRoomHighlight() {
  if (!roomsList) return;
  roomsList.querySelectorAll('.room-item').forEach((roomEl) => {
    const roomName = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.classList.toggle('active', roomName === currentRoom);
  });
}

function formatNewsDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function saveNewsHistoryEntries() {
  localStorage.setItem(newsHistoryStorageKey, JSON.stringify(newsHistoryEntries));
}

function renderNewsHistory() {
  if (!newsHistoryList) return;
  const sortedEntries = [...newsHistoryEntries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  newsHistoryList.innerHTML = '';
  if (!sortedEntries.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Zatiaľ žiadne novinky.';
    newsHistoryList.appendChild(emptyItem);
    return;
  }
  sortedEntries.forEach((entry) => {
    const item = document.createElement('li');
    const title = entry.title ? `<strong>${escapeHtml(entry.title)}</strong>` : '';
    const dateText = entry.createdAt ? `<strong>${escapeHtml(formatNewsDate(entry.createdAt))}</strong>` : '';
    item.innerHTML = `${dateText ? `${dateText} – ` : ''}${title ? `${title}: ` : ''}${escapeHtml(entry.body || '')}`;
    newsHistoryList.appendChild(item);
  });
}

function addNewsHistoryEntry(title, body, createdAt = new Date().toISOString()) {
  newsHistoryEntries.push({ title, body, createdAt });
  saveNewsHistoryEntries();
  renderNewsHistory();
}

function renderVisibleMessages() {
  messagesDiv.innerHTML = '';
  publicMessageHistory.forEach((message) => {
    addMessage(message);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function storePublicMessage(message) {
  if (!message || message.system || message.private) return;
  const incomingId = message.id != null ? String(message.id) : null;
  if (!incomingId) {
    publicMessageHistory.push(message);
    return;
  }
  const existingIndex = publicMessageHistory.findIndex((item) => String(item.id) === incomingId);
  if (existingIndex >= 0) {
    publicMessageHistory[existingIndex] = message;
    return;
  }
  publicMessageHistory.push(message);
}

function setActiveRoom(roomName, options = {}) {
  const nextRoom = normalizeRoomName(roomName);
  currentRoom = nextRoom;
  localStorage.setItem('chatCurrentRoom', currentRoom);
  updateRoomHighlight();
  renderVisibleMessages();
  if (!options.silent) {
    showToast(`Vstúpil si do miestnosti ${currentRoom}.`);
  }
}

function reportMessageToAdmin(message) {
  if (!message || message.private || !message.username || !socket) {
    return;
  }

  socket.emit('report-message', {
    username: message.username,
    text: message.text,
    room: message.room || currentRoom || 'Spoločná',
    reporter: currentUsername || 'Anon',
    messageId: message.id || null,
    timestamp: message.timestamp || new Date().toISOString()
  });
}

function addMessage(m) {
  if (!m.system) {
    try {
      const msgTime = new Date(m.timestamp || Date.now()).getTime();
      if (lastClearTime && msgTime <= lastClearTime) {
        return;
      }
    } catch (e) {
      // if timestamp parsing fails, don't block the message
    }
  }
  if (m.system) {
    const d = document.createElement('div');
    d.className = 'system-msg';
    d.textContent = m.text;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  if (m.username && isIgnored(m.username) && !m.private) {
    return;
  }

  if (!m.private) {
    const messageRoom = normalizeRoomName(m.room || 'Spoločná');
    if (messageRoom !== currentRoom) {
      return;
    }
  }

  const d = document.createElement('div');
  d.className = 'msg' + (m.username === currentUsername ? ' me' : '') + (m.private ? ' private' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (m.private ? ' private' : '');
  const privateLabel = m.private
    ? `<div class="private-label">${m.self ? `Súkromné → ${escapeHtml(m.toUsername || '')}` : 'Súkromné'}</div>`
    : '';
  bubble.innerHTML = `
    <div class="from"><strong>${escapeHtml(m.username)}</strong></div>
    ${privateLabel}
    <div class="text">${escapeHtml(m.text)}</div>
    <div class="meta">${new Date(m.timestamp || Date.now()).toLocaleString()}</div>
  `;

  if (!m.private) {
    const actions = document.createElement('div');
    actions.className = 'bubble-actions';

    const reportBtn = document.createElement('button');
    reportBtn.type = 'button';
    reportBtn.className = 'report-btn';
    reportBtn.textContent = 'Nahlásiť správcovi';
    reportBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      reportMessageToAdmin(m);
    });

    actions.appendChild(reportBtn);
    bubble.appendChild(actions);

    const reactionRow = buildReactionRow(m.id, m.reactions || {});
    bubble.appendChild(reactionRow);
  }

  d.appendChild(bubble);
  if (m.id) {
    d.dataset.messageId = String(m.id);
  }
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function buildReactionRow(messageId, reactions) {
  const row = document.createElement('div');
  row.className = 'reaction-row';
  row.dataset.messageId = String(messageId);

  reactionSet.forEach((emoji) => {
    const usersForEmoji = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
    const count = usersForEmoji.length;
    const active = usersForEmoji.includes(currentUsername);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `reaction-btn${active ? ' active' : ''}`;
    button.dataset.emoji = emoji;
    button.dataset.messageId = String(messageId);
    button.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    row.appendChild(button);
  });

  return row;
}

function updateReactionRow(messageId, reactions) {
  const container = messagesDiv.querySelector(`.msg[data-message-id="${messageId}"] .reaction-row`);
  if (!container) return;

  const newRow = buildReactionRow(messageId, reactions || {});
  container.replaceWith(newRow);
}

function isCurrentUserAdmin() {
  const name = (currentUsername || '').trim().toLowerCase();
  return ['admin', 'administrator', 'spravca', 'správca', 'marek', 'marekc'].includes(name);
}

function updateAdminPanel(users) {
  const panel = document.getElementById('admin-portal');
  const list = document.getElementById('admin-portal-list');
  const count = document.getElementById('admin-portal-count');
  const title = document.getElementById('admin-portal-title');
  if (!panel || !list || !count || !title) return;

  const currentIsAdmin = isCurrentUserAdmin();
  panel.style.display = currentIsAdmin ? 'block' : 'none';
  if (!currentIsAdmin) return;

  title.textContent = 'Owner panel';
  count.textContent = String(Array.isArray(users) ? users.length : 0);
  list.innerHTML = '';

  users.forEach((user) => {
    const row = document.createElement('div');
    row.className = 'admin-portal-user';

    const name = document.createElement('span');
    name.className = 'admin-portal-user-name';
    name.textContent = user.username;

    const badge = document.createElement('span');
    badge.className = 'admin-user-badge';
    badge.textContent = user.role === 'admin' ? 'owner' : 'user';

    const actions = document.createElement('div');
    actions.className = 'admin-portal-actions';

    const kickBtn = document.createElement('button');
    kickBtn.type = 'button';
    kickBtn.className = 'admin-action-btn kick';
    kickBtn.textContent = 'Kick';
    kickBtn.disabled = user.username === currentUsername || user.role === 'admin';
    kickBtn.addEventListener('click', () => {
      socket.emit('command', { type: 'kick', target: user.username, from: currentUsername });
    });

    const banBtn = document.createElement('button');
    banBtn.type = 'button';
    banBtn.className = 'admin-action-btn ban';
    banBtn.textContent = 'Ban 24h';
    banBtn.disabled = user.username === currentUsername || user.role === 'admin';
    banBtn.addEventListener('click', () => {
      socket.emit('command', { type: 'ban', target: user.username, hours: 24, from: currentUsername });
    });

    actions.appendChild(kickBtn);
    actions.appendChild(banBtn);
    row.appendChild(name);
    row.appendChild(badge);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function updateUserList(users) {
  if (activeUsersCount) {
    activeUsersCount.textContent = users.length;
  }
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  refreshMyPoints();
  refreshIgnoreStatus();
  updateAdminPanel(users);
  if (!usersList) return;
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    const name = user.username;
    const points = getOddychPoints(name);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = user.role === 'admin'
      ? `${name} [admin] · ${points} OB`
      : (user.role === 'tester' ? `${name} [tester] · ${points} OB` : `${name} · ${points} OB`);
    li.appendChild(nameSpan);

    if (user.username === currentUsername) {
      li.style.fontWeight = '700';
      li.style.opacity = '0.7';
      li.style.cursor = 'default';
    } else {
      const friendBtn = document.createElement('button');
      friendBtn.type = 'button';
      friendBtn.className = `friend-envelope${isFriend(name) ? ' active' : ''}`;
      friendBtn.title = isFriend(name) ? 'Odobrať z priateľov' : 'Pridať do priateľov';
      friendBtn.textContent = '✉';
      friendBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const added = toggleFriend(name);
        friendBtn.classList.toggle('active', added);
        friendBtn.title = added ? 'Odobrať z priateľov' : 'Pridať do priateľov';
        addMessage({
          system: true,
          text: added
            ? `✉ Pridal si ${name} medzi priateľov.`
            : `✉ Odobral si ${name} z priateľov.`,
          timestamp: new Date().toISOString()
        });
      });

      li.appendChild(friendBtn);

      const callBtn = document.createElement('button');
      callBtn.type = 'button';
      callBtn.className = 'call-btn';
      callBtn.textContent = '📞';
      callBtn.title = `Zavolať ${name}`;
      callBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        initiateCall(user.id, user.username);
      });
      li.appendChild(callBtn);

      li.dataset.id = user.id;
      li.dataset.name = user.username;
      li.addEventListener('click', () => {
        messageInput.value = `@${user.username} `;
        messageInput.focus();
        showToast(`Adresuješ: ${user.username}`);
      });
      li.addEventListener('dblclick', () => {
        setPrivateTarget(user.id, user.username);
      });
    }
    usersList.appendChild(li);
  });

  // Aktualizuj call zoznam
  const callUsersList = document.getElementById('call-users-list');
  const callHint = document.getElementById('call-hint');
  if (callUsersList) {
    const others = users.filter(u => u.username !== currentUsername);
    callUsersList.innerHTML = '';
    if (others.length === 0) {
      if (callHint) callHint.style.display = '';
    } else {
      if (callHint) callHint.style.display = 'none';
      others.forEach(u => {
        const li = document.createElement('li');
        li.className = 'call-user-item';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = u.username;
        const btn = document.createElement('button');
        btn.className = 'call-user-call-btn';
        btn.textContent = '📞 Zavolať';
        btn.addEventListener('click', () => initiateCall(u.id, u.username));
        li.appendChild(nameSpan);
        li.appendChild(btn);
        callUsersList.appendChild(li);
      });
    }
  }
}

function notifyFriendOnlineStatus(users) {
  const currentlyOnlineFriends = new Set();

  users.forEach((user) => {
    if (user.username === currentUsername) return;
    if (isFriend(user.username)) {
      const key = normalizeName(user.username);
      currentlyOnlineFriends.add(key);
      if (!onlineFriends.has(key)) {
        const now = new Date();
        addMessage({
          system: true,
          text: `✉ Tvoj priateľ ${user.username} je na chate. ${now.toLocaleString()} | Tvoj oddych chat`,
          timestamp: now.toISOString()
        });
      }
    }
  });

  onlineFriends.clear();
  currentlyOnlineFriends.forEach((key) => onlineFriends.add(key));
}

function setPrivateTarget(id, username) {
  privateTargetId = id;
  privateTargetName = username;
  if (privateStatus && privateTargetNameDisplay) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
  }
  if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
    privateThreadName.textContent = privateTargetName;
    privateThreadAvatar.textContent = (privateTargetName || 'U').charAt(0).toUpperCase();
    privateThreadHeader.style.display = 'flex';
  }
  showToast(`Odkazovač aktivovaný: súkromná správa pre ${privateTargetName}`);
  messageInput.focus();
}

function clearPrivateTarget() {
  privateTargetId = null;
  privateTargetName = null;
  refreshPrivateStatus();
}

function refreshPrivateStatus() {
  if (!privateStatus || !privateTargetNameDisplay) return;
  if (privateTargetName) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
    if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
      privateThreadName.textContent = privateTargetName;
      privateThreadAvatar.textContent = privateTargetName.charAt(0).toUpperCase();
      privateThreadHeader.style.display = 'flex';
    }
    return;
  }
  if (autoPrivateEnabled && autoPrivateTargetName) {
    privateTargetNameDisplay.textContent = `${autoPrivateTargetName} (AUTO)`;
    privateStatus.style.display = 'block';
    if (privateThreadHeader && privateThreadName && privateThreadAvatar) {
      privateThreadName.textContent = autoPrivateTargetName;
      privateThreadAvatar.textContent = autoPrivateTargetName.charAt(0).toUpperCase();
      privateThreadHeader.style.display = 'flex';
    }
    return;
  }
  privateStatus.style.display = 'none';
  if (privateThreadHeader) {
    privateThreadHeader.style.display = 'none';
  }
}

function openSendSettings() {
  if (!sendSettingsModal || !sendSettingsTarget || !sendSettingsPrivateToggle) return;
  sendSettingsTarget.innerHTML = '';
  const others = activeUsers.filter((u) => u.username !== currentUsername);
  if (!others.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nikto iný nie je online';
    sendSettingsTarget.appendChild(opt);
    sendSettingsTarget.disabled = true;
  } else {
    sendSettingsTarget.disabled = false;
    others.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = u.username;
      sendSettingsTarget.appendChild(opt);
    });
    const exists = others.some((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    sendSettingsTarget.value = exists ? autoPrivateTargetName : others[0].username;
  }
  sendSettingsPrivateToggle.checked = autoPrivateEnabled;
  sendSettingsModal.style.display = 'flex';
}

function saveSendSettings() {
  if (!sendSettingsPrivateToggle || !sendSettingsTarget) return;
  autoPrivateEnabled = !!sendSettingsPrivateToggle.checked;
  autoPrivateTargetName = sendSettingsTarget.value || '';
  localStorage.setItem('autoPrivateEnabled', autoPrivateEnabled ? 'true' : 'false');
  localStorage.setItem('autoPrivateTargetName', autoPrivateTargetName);
  refreshPrivateStatus();
  showToast(autoPrivateEnabled && autoPrivateTargetName
    ? `Súkromné odosielanie je zapnuté pre ${autoPrivateTargetName}.`
    : 'Súkromné odosielanie je vypnuté.');
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
}

function canCreateRoom() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const registered = localStorage.getItem('chatRegistered') === 'true';
  const isAdmin = ['admin', 'administrator', 'spravca', 'správca'].includes((storedUser || '').toLowerCase());
  return !!storedUser || registered || isAdmin;
}

function canManageRooms() {
  const storedUser = localStorage.getItem('chatUsername')?.trim();
  const normalized = (storedUser || currentUsername || '').toLowerCase();
  return ['admin', 'administrator', 'spravca', 'správca'].includes(normalized);
}

function updateCreateRoomControl() {
  const allowed = canCreateRoom();
  if (createRoomInput) {
    createRoomInput.disabled = !allowed;
    createRoomInput.placeholder = allowed
      ? 'Napíš názov novej miestnosti...' 
      : 'Iba registrovaný a admin môže vytvoriť';
  }
  if (createRoomBtn) {
    createRoomBtn.disabled = !allowed;
  }
}

function addRoomToList(name, options = {}) {
  if (!roomsList || !name) return;
  const roomName = normalizeRoomName(name);
  const existing = Array.from(roomsList.querySelectorAll('.room-item')).find(
    (roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === roomName
  );
  if (existing) {
    existing.dataset.roomName = roomName;
    return existing;
  }
  const roomItem = document.createElement('div');
  roomItem.className = 'room-item';
  roomItem.dataset.roomName = roomName;
  roomItem.textContent = `${roomName} (0)`;
  const del = document.createElement('button');
  del.className = 'room-delete';
  del.setAttribute('title', 'Zmazať miestnosť');
  del.textContent = '✕';
  roomItem.appendChild(del);
  roomsList.appendChild(roomItem);
  if (options.activate) {
    setActiveRoom(roomName, { silent: true });
  } else {
    updateRoomHighlight();
  }
  if (options.persist !== false) {
    saveRoomList();
  }
  return roomItem;
}

// Handle delete clicks (delegation)
roomsList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.room-delete');
  const roomEl = e.target.closest('.room-item');
  if (!roomEl) return;
  if (btn) {
    const isPermanent = roomEl.getAttribute('data-permanent') === 'true';
    if (isPermanent) {
      showToast('Neblbni, stálu miestnosť neni možné zrušiť');
      return;
    }
    const removedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
    roomEl.remove();
    saveRoomList();
    if (removedRoom === currentRoom) {
      setActiveRoom('Spoločná', { silent: true });
    }
    showToast('Miestnosť zmazaná.');
    return;
  }

  const selectedRoom = normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', ''));
  if (selectedRoom) {
    setActiveRoom(selectedRoom);
  }
});

function insertEmoji(emoji) {
  if (!messageInput) return;
  const start = messageInput.selectionStart ?? messageInput.value.length;
  const end = messageInput.selectionEnd ?? messageInput.value.length;
  const value = messageInput.value;
  messageInput.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const pos = start + emoji.length;
  messageInput.focus();
  messageInput.setSelectionRange(pos, pos);
}

function initEmojiLine() {
  if (!emojiLine) return;
  emojiLine.innerHTML = '';
  emojiSet.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', () => insertEmoji(emoji));
    emojiLine.appendChild(btn);
  });
}


function sendJoin() {
  currentUsername = localStorage.getItem('chatUsername')?.trim() || 'Správca';
  if (!currentUsername) currentUsername = 'Správca';
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  updateCreateRoomControl();
  socket.emit('join', { username: currentUsername, room: currentRoom });
}

function showRandomConversationTopic() {
  const topics = [
    '💬 Téma na rozhovor: Aký film by si si dnes pozrel znova?',
    '💬 Téma na rozhovor: Čo by si vymenil za lepšie v tejto komunite?',
    '💬 Téma na rozhovor: Aký je tvoj najlepší tip na relax po dni?',
    '💬 Téma na rozhovor: Čo ťa v poslednom čase najviac zaujalo?',
    '💬 Téma na rozhovor: Ktorý zvyk máš a nikto iný nepochopí?',
    '💬 Téma na rozhovor: Aký je tvoj najlepší spôsob, ako si oddýchnuť?',
    '💬 Téma na rozhovor: Ktoré miesto by si chcel navštíviť raz v živote?',
    '💬 Téma na rozhovor: Čo by si dal na večeru s kamarátmi?' 
  ];
  const pick = topics[Math.floor(Math.random() * topics.length)];
  addMessage({ system: true, text: pick, timestamp: new Date().toISOString() });
}

socket.on('connect', () => {
  initEmojiLine();
  const savedRooms = JSON.parse(localStorage.getItem('chatRoomNamesV1') || '[]');
  savedRooms.forEach((roomName) => addRoomToList(roomName, { persist: false }));
  if (currentRoom !== 'Spoločná' && !Array.from(roomsList?.querySelectorAll('.room-item') || []).some((roomEl) => normalizeRoomName(roomEl.dataset.roomName || roomEl.textContent.replace('✕', '')) === currentRoom)) {
    addRoomToList(currentRoom, { persist: false });
  }
  updateRoomHighlight();
  const joinPrompt = 'Ak chceš vedieť, kto tu kedy prišiel, napíš do okna ANO. Ak nechceš, napíš NIE.';
  addMessage({ system: true, text: joinPrompt, timestamp: new Date().toISOString() });
  showRandomConversationTopic();
  joinHistoryPromptState = 'pending';
  sendJoin();
  applyMessengerMode();
  lastSpokenAt = Date.now();
});

setInterval(checkInactivityLogout, 60 * 1000);

socket.on('load-messages', (msgs) => {
  publicMessageHistory = Array.isArray(msgs) ? msgs.filter((msg) => !msg.private && !msg.system) : [];
  renderVisibleMessages();
});

socket.on('receive-message', (m) => {
  storePublicMessage(m);
  const visibleRoom = normalizeRoomName(m && m.room ? m.room : 'Spoločná');
  const isVisible = !m || m.private || m.system || visibleRoom === currentRoom;
  if (isVisible) {
    addMessage(m);
  }
});

socket.on('clear-chat', (payload) => {
  lastClearTime = Date.now();
  localStorage.setItem('chatClearAt', String(lastClearTime));
  publicMessageHistory = [];
  messagesDiv.innerHTML = '';
  if (payload && payload.byUsername) {
    showToast(`Chat bol vymazaný pre všetkých používateľov ${payload.byUsername}.`);
  } else {
    showToast('Chat bol vymazaný pre všetkých.');
  }
});

socket.on('system-message', (msg) => {
  const rawText = String(msg || '').trim();
  const nowLabel = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const cleanedText = rawText
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\d{1,2}:\d{2}\s*$/, '')
    .trim();
  const displayText = cleanedText ? `${cleanedText} ${nowLabel}`.trim() : `Systém ${nowLabel}`;
  const isBanWarning = /zabanovan|banovan|bol si zabanovan|si zabanovan|vyhodený na 24 hodín|vyhodil/i.test(rawText);
  if (isBanWarning) {
    playBanAlarm();
    showToast(cleanedText || 'Bol si zabanovaný.');
  }
  addMessage({ system: true, text: displayText, timestamp: new Date().toISOString() });
});


socket.on('join-denied', (message) => {
  addMessage({ system: true, text: `⚠ ${message || 'Toto meno je už obsadené. Zvoľ si iné.'}`, timestamp: new Date().toISOString() });
});

socket.on('user-list', (users) => {
  activeUsers = users;
  updateUserList(users);
  updateAdminPanel(users);
  notifyFriendOnlineStatus(users);
  refreshPrivateStatus();
});

socket.on('user-points', (pointsSnapshot) => {
  oddychPoints = pointsSnapshot && typeof pointsSnapshot === 'object' ? pointsSnapshot : {};
  refreshMyPoints();
  if (Array.isArray(activeUsers) && activeUsers.length) {
    updateUserList(activeUsers);
  }
});

socket.on('security-banner', updateSecurityPanel);
socket.on('antivirus-status', (payload) => updateSecurityPanel(payload));

socket.on('message-reaction-updated', ({ messageId, reactions }) => {
  updateReactionRow(messageId, reactions);
});

socket.on('countdown:start', ({ value, byUsername, rewardText }) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return;
  const who = (byUsername || 'Správca').toString();
  const bonusText = rewardText || `Dostávaš ${n} bodov!`;
  startCountdown(n, {
    headline: `${who} spustil odpočítanie`,
    finishText: bonusText
  });
});

function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;

  if (joinHistoryPromptState === 'pending' && /^(ano|nie)$/i.test(text)) {
    const choice = text.toLowerCase();
    joinHistoryPromptState = choice === 'ano' ? 'accepted' : 'declined';
    localStorage.setItem('joinHistoryConsent', choice === 'ano' ? 'accept' : 'decline');
    addMessage({
      system: true,
      text: choice === 'ano'
        ? 'Emailové upozornenie o návštevách je zapnuté. Ak chceš zmeniť rozhodnutie, napíš NIE.'
        : 'Emailové upozornenie o návštevách je vypnuté. Ak chceš zmeniť rozhodnutie, napíš ANO.',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';
    return;
  }

  if (containsSuspiciousClientText(text)) {
    showToast('Správa obsahuje podozrivý obsah a nebola odoslaná.');
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.zmaz')) {
    socket.emit('clear-chat');
    messageInput.value = '';
    return;
  }

  const adminMessageMatch = text.match(/^:m(?:\s+(.+))?$/i);
  if (adminMessageMatch) {
    const valueText = (adminMessageMatch[1] || '').trim();
    if (!valueText) {
      showToast('Použi :m správu, napríklad :m Vítam vás všetkých.');
      messageInput.value = '';
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz :m môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    socket.emit('admin-broadcast', { text: valueText });
    messageInput.value = '';
    return;
  }

  const countdownMatch = text.match(/^\.countdown(?:\s+(.+))?$/i);
  if (countdownMatch) {
    const valueText = (countdownMatch[1] || '').trim();
    if (!valueText) {
      showToast('Použi .countdown číslo, napríklad .countdown 10');
      messageInput.value = '';
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz .countdown môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    socket.emit('countdown:start', { value: valueText });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.ignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .ignoruj meno');
      return;
    }
    const lowerTarget = normalizeName(target);
    const wasAdded = !ignoreList.has(lowerTarget);
    toggleIgnoreUser(target);
    if (wasAdded) {
      socket.emit('notify-ignored', { targetName: target, byName: currentUsername });
    }
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.neignoruj')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .neignoruj meno');
      return;
    }
    const removed = removeIgnoredUser(target);
    if (removed) {
      showToast(`Už neignoruješ ${target}.`);
    } else {
      showToast(`Používateľ ${target} nie je v ignorovaných.`);
    }
    messageInput.value = '';
    return;
  }

  if (text.toLowerCase().startsWith('.afk')) {
    const afkMsg = `${currentUsername} je AFK – na chvílu preč.`;
    socket.emit('send-message', { text: afkMsg, username: currentUsername, timestamp: new Date().toISOString() });
    showToast('AFK správa odoslaná. Budeš upozornený keď sa niekto ozve.');
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.ban')) {
    const parts = text.split(/\s+/);
    const target = parts[1] ? parts[1].trim() : '';
    const hoursText = parts[2] ? parts[2].trim() : '29';
    if (!target) {
      showToast('Použi .ban meno 29');
      return;
    }
    if (!canManageRooms()) {
      showToast('Príkaz .ban môže spustiť iba Správca/admin.');
      messageInput.value = '';
      return;
    }
    const hours = Number(hoursText);
    if (!Number.isFinite(hours) || hours <= 0) {
      showToast('Počet hodín musí byť kladné číslo.');
      messageInput.value = '';
      return;
    }
    socket.emit('command', { type: 'ban', target, hours, from: currentUsername });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.vyhodip')) {
    const parts = text.split(' ');
    const target = parts.slice(1).join(' ').trim();
    if (!target) {
      showToast('Použi .vyhodip meno');
      return;
    }
    if (target.toLowerCase() === currentUsername.toLowerCase()) {
      showToast('Seba nevyhodíš.');
      return;
    }
    socket.emit('command', { type: 'kick', target, from: currentUsername });
    messageInput.value = '';
    return;
  }

  if (text.startsWith('.zrusitmiestnost')) {
    if (!canManageRooms()) {
      addMessage({
        system: true,
        text: 'Neblbni, stálu miestnosť neni možné zrušiť',
        timestamp: new Date().toISOString()
      });
      messageInput.value = '';
      return;
    }

    addMessage({
      system: true,
      text: 'Príkaz pre správcu je prijatý, zrušenie miestnosti ešte nie je implementované.',
      timestamp: new Date().toISOString()
    });
    messageInput.value = '';
    return;
  }

  if (privateTargetId) {
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: privateTargetId,
      text
    });
    messageInput.value = '';
    clearPrivateTarget();
    return;
  }

  if (autoPrivateEnabled && autoPrivateTargetName) {
    const targetUser = activeUsers.find((u) => u.username.toLowerCase() === autoPrivateTargetName.toLowerCase());
    if (!targetUser) {
      showToast(`Používateľ ${autoPrivateTargetName} nie je online. Správa nebola odoslaná.`);
      return;
    }
    markSpokenActivity();
    updateActivityStats(currentUsername, { messages: 1 });
    socket.emit('send-private-message', {
      to: targetUser.id,
      text
    });
    messageInput.value = '';
    return;
  }

  markSpokenActivity();
  updateActivityStats(currentUsername, { messages: 1 });
  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString(),
    room: currentRoom
  });
  messageInput.value = '';
}

socket.on('receive-private-message', (m) => {
  if (!m.self) {
    playPrivateMessageSound();
    notifyIncomingMessage(m.from, m.text);
  }

  addMessage({
    username: m.self ? currentUsername : m.from,
    text: m.text,
    timestamp: m.timestamp,
    private: true,
    self: m.self,
    toUsername: m.toUsername
  });
});

function createTopicMessage(topicName) {
  const label = (topicName || '').toString().trim();
  if (!label) {
    showToast('Napíš názov témy.');
    return;
  }
  addMessage({
    system: true,
    text: `📝 Téma: ${label}`,
    timestamp: new Date().toISOString()
  });
  addNewsHistoryEntry('Vytvorená téma', `Bola vytvorená téma „${label}“.`);
  if (topicNameInput) {
    topicNameInput.value = '';
  }
}

function showToast(message) {
  addMessage({
    system: true,
    text: message,
    timestamp: new Date().toISOString()
  });
}

function openQuicklinkModal() {
  if (!quicklinkOverlay) return;
  if (quicklinkTargetInput) {
    const otherUser = activeUsers.find((user) => user.username !== currentUsername);
    quicklinkTargetInput.value = otherUser ? otherUser.username : '';
    quicklinkTargetInput.focus();
  }
  quicklinkOverlay.style.display = 'flex';
}

function closeQuicklinkModal() {
  if (quicklinkOverlay) {
    quicklinkOverlay.style.display = 'none';
  }
}

renderNewsHistory();

navLogout?.addEventListener('click', (event) => {
  event.preventDefault();
  localStorage.removeItem('chatUsername');
  window.location.href = '/';
});
navHelp?.addEventListener('click', (event) => {
  event.preventDefault();
  const overlay = document.getElementById('help-overlay');
  if (!overlay) return;
  const isOpen = overlay.style.display !== 'none';
  overlay.style.display = isOpen ? 'none' : 'flex';
});
document.getElementById('help-close')?.addEventListener('click', () => {
  const overlay = document.getElementById('help-overlay');
  if (overlay) overlay.style.display = 'none';
});
document.getElementById('help-suggestions-btn')?.addEventListener('click', () => {
  const panel = document.getElementById('help-suggestions');
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});
document.getElementById('suggestion-submit')?.addEventListener('click', () => {
  const input = document.getElementById('suggestion-input');
  const text = input?.value.trim();
  if (!text) {
    showToast('Napíš najprv svoj návrh.');
    return;
  }
  socket.emit('send-message', {
    text: `💡 Návrh od ${currentUsername}: ${text}`,
    username: currentUsername,
    timestamp: new Date().toISOString()
  });
  if (input) input.value = '';
  showToast('Návrh odoslaný do chatu.');
});
document.getElementById('help-overlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});
quicklinkOverlay?.addEventListener('click', (event) => {
  if (event.target === quicklinkOverlay) closeQuicklinkModal();
});
quicklinkClose?.addEventListener('click', closeQuicklinkModal);
quicklinkContinue?.addEventListener('click', () => {
  const targetName = (quicklinkTargetInput?.value || '').trim();
  if (!targetName) {
    showToast('Napíš nick príjemcu.');
    return;
  }
  const matchedUser = activeUsers.find((user) => user.username.toLowerCase() === targetName.toLowerCase());
  if (!matchedUser) {
    showToast('Tento používateľ nie je online.');
    return;
  }
  closeQuicklinkModal();
  setPrivateTarget(matchedUser.id, matchedUser.username);
});
profileModal?.addEventListener('click', (event) => {
  if (event.target === profileModal) closeProfileModal();
});
profileCloseBtn?.addEventListener('click', closeProfileModal);
profileCancelBtn?.addEventListener('click', closeProfileModal);
profileAvatarInput?.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Nahraj obrázok vo formáte JPG, PNG alebo WEBP.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    if (profileAvatarPreview) {
      profileAvatarPreview.src = dataUrl;
      profileAvatarPreview.style.display = 'block';
    }
    if (profileAvatarEmpty) {
      profileAvatarEmpty.style.display = 'none';
    }
  };
  reader.readAsDataURL(file);
});
profileSaveBtn?.addEventListener('click', () => {
  const avatarUrl = profileAvatarPreview && profileAvatarPreview.getAttribute('src') ? profileAvatarPreview.getAttribute('src') : '';
  const profileData = {
    bio: profileBioInput?.value || '',
    age: profileAgeInput?.value || '',
    birthdate: profileBirthdateInput?.value || '',
    city: profileCityInput?.value || '',
    status: profileStatusInput?.value || '',
    hobbies: profileHobbiesInput?.value || '',
    avatarDataUrl: avatarUrl
  };
  saveProfileData(profileData);
  closeProfileModal();
  showToast('Profil bol uložený.');
});
navProfile?.addEventListener('click', (event) => {
  event.preventDefault();
  openProfileModal();
});

const snakeGameState = {
  boardSize: 10,
  snake: [],
  apple: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  score: 0,
  timer: null,
  over: false
};
const snakeGameCells = [];

function initializeSnakeBoard() {
  if (!snakeGameBoard) return;
  if (snakeGameCells.length) return;

  for (let y = 0; y < snakeGameState.boardSize; y += 1) {
    for (let x = 0; x < snakeGameState.boardSize; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'snake-game-cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      snakeGameBoard.appendChild(cell);
      snakeGameCells.push(cell);
    }
  }
}

function resetSnakeGame() {
  initializeSnakeBoard();
  snakeGameState.snake = [
    { x: 2, y: 5 },
    { x: 1, y: 5 },
    { x: 0, y: 5 }
  ];
  snakeGameState.direction = { x: 1, y: 0 };
  snakeGameState.nextDirection = { x: 1, y: 0 };
  snakeGameState.score = 0;
  snakeGameState.over = false;
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
  placeAppleInSnakeGame();
  renderSnakeGame();
}

function placeAppleInSnakeGame() {
  const cells = [];
  for (let y = 0; y < snakeGameState.boardSize; y += 1) {
    for (let x = 0; x < snakeGameState.boardSize; x += 1) {
      const occupied = snakeGameState.snake.some((part) => part.x === x && part.y === y);
      if (!occupied) {
        cells.push({ x, y });
      }
    }
  }
  if (!cells.length) {
    snakeGameState.apple = { x: -1, y: -1 };
    return;
  }
  const pick = cells[Math.floor(Math.random() * cells.length)];
  snakeGameState.apple = pick;
}

function renderSnakeGame() {
  if (!snakeGameBoard || !snakeGameCells.length) {
    initializeSnakeBoard();
  }

  for (const cell of snakeGameCells) {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const isApple = snakeGameState.apple.x === x && snakeGameState.apple.y === y;
    const snakeHead = snakeGameState.snake[0];
    const isSnake = snakeGameState.snake.some((part) => part.x === x && part.y === y);

    cell.className = 'snake-game-cell';
    if (isSnake) {
      cell.classList.add('snake');
    }
    if (snakeHead && snakeHead.x === x && snakeHead.y === y) {
      cell.classList.add('snake-head');
      if (snakeGameState.over) {
        cell.classList.add('crashed');
      }
    }
    if (isApple) {
      cell.classList.add('apple');
    }
  }

  if (snakeGameScore) {
    snakeGameScore.textContent = String(snakeGameState.score);
  }
}

function setSnakeDirection(next) {
  if (!snakeGameState || snakeGameState.over) return;
  const current = snakeGameState.direction;
  if (current.x + next.x === 0 && current.y + next.y === 0) {
    return;
  }
  snakeGameState.nextDirection = next;
}

function finishSnakeGame() {
  snakeGameState.over = true;
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'flex';
  }
}

function stepSnakeGame() {
  if (!snakeGameState || snakeGameState.over) return;
  snakeGameState.direction = { ...snakeGameState.nextDirection };
  const head = snakeGameState.snake[0];
  const nextHead = {
    x: head.x + snakeGameState.direction.x,
    y: head.y + snakeGameState.direction.y
  };

  const hitsWall = nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= snakeGameState.boardSize || nextHead.y >= snakeGameState.boardSize;
  if (hitsWall) {
    finishSnakeGame();
    return;
  }

  const hitsSelf = snakeGameState.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y);
  if (hitsSelf) {
    finishSnakeGame();
    return;
  }

  const nextSnake = [nextHead, ...snakeGameState.snake];
  const ateApple = nextHead.x === snakeGameState.apple.x && nextHead.y === snakeGameState.apple.y;

  if (ateApple) {
    snakeGameState.score += 1;
    placeAppleInSnakeGame();
  } else {
    nextSnake.pop();
  }

  snakeGameState.snake = nextSnake;
  renderSnakeGame();
}

function openSnakeGame() {
  if (!snakeGameModal) return;
  resetSnakeGame();
  snakeGameModal.style.display = 'flex';
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
  }
  snakeGameState.timer = setInterval(stepSnakeGame, 320);
}

function closeSnakeGame() {
  if (snakeGameModal) {
    snakeGameModal.style.display = 'none';
  }
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  if (snakeGameState.timer) {
    clearInterval(snakeGameState.timer);
    snakeGameState.timer = null;
  }
}

snakeGameButton?.addEventListener('click', () => {
  openSnakeGame();
});
snakeGameClose?.addEventListener('click', closeSnakeGame);
snakeGameBack?.addEventListener('click', closeSnakeGame);
snakeGameRetry?.addEventListener('click', () => {
  if (snakeGameOverlay) {
    snakeGameOverlay.style.display = 'none';
  }
  openSnakeGame();
});
snakeGameModal?.addEventListener('click', (event) => {
  if (event.target === snakeGameModal) closeSnakeGame();
});
window.addEventListener('keydown', (event) => {
  if (snakeGameModal && snakeGameModal.style.display === 'flex') {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isArrowKey) {
      return;
    }
    event.preventDefault();
    if (event.key === 'ArrowUp') setSnakeDirection({ x: 0, y: -1 });
    if (event.key === 'ArrowDown') setSnakeDirection({ x: 0, y: 1 });
    if (event.key === 'ArrowLeft') setSnakeDirection({ x: -1, y: 0 });
    if (event.key === 'ArrowRight') setSnakeDirection({ x: 1, y: 0 });
  }
});
navFriends?.addEventListener('click', (event) => {
  event.preventDefault();
  usersList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
navIgnore?.addEventListener('click', (event) => {
  event.preventDefault();
  const names = Array.from(ignoreList).join(', ') || 'žiadni';
  showToast(`Ignorovaní: ${names}`);
});
navSettings?.addEventListener('click', (event) => {
  event.preventDefault();
  openSendSettings();
});
navQuicklink?.addEventListener('click', (event) => {
  event.preventDefault();
  openQuicklinkModal();
});
document.querySelectorAll('.topic-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const topicName = chip.dataset.topic || chip.textContent.trim();
    if (topicNameInput) {
      topicNameInput.value = topicName;
    }
    createTopicMessage(topicName);
  });
});

createTopicBtn?.addEventListener('click', () => {
  createTopicMessage(topicNameInput?.value || '');
});

newsHistoryToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  openNewsHistory();
});
newsHistoryClose?.addEventListener('click', () => {
  closeNewsHistory();
});
newsHistoryBackdrop?.addEventListener('click', () => {
  closeNewsHistory();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNewsHistory();
  }
});
navMessenger?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/messenger.html';
});

document.getElementById('nav-call-open')?.addEventListener('click', (event) => {
  event.preventDefault();
  const modal = document.getElementById('call-modal');
  const list = document.getElementById('call-modal-list');
  if (!modal || !list) return;
  const others = activeUsers.filter(u => u.username !== currentUsername);
  list.innerHTML = '';
  if (others.length === 0) {
    list.innerHTML = '<li style="color:#888;text-align:center;padding:10px;">Nikto iný nie je online.</li>';
  } else {
    others.forEach(u => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f9f9f9;border-radius:12px;border:1px solid #eee;';
      const name = document.createElement('span');
      name.style.cssText = 'font-weight:700;color:#3e2513;font-size:0.95rem;';
      name.textContent = u.username;
      const btn = document.createElement('button');
      btn.style.cssText = 'background:#3a7f2a;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:0.9rem;';
      btn.textContent = '📞 Zavolať';
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
        initiateCall(u.id, u.username);
      });
      li.appendChild(name);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
  modal.style.display = 'flex';
});

document.getElementById('call-modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('call-modal');
  if (modal) modal.style.display = 'none';
});

sendSettingsSave?.addEventListener('click', saveSendSettings);
sendSettingsCancel?.addEventListener('click', () => {
  if (sendSettingsModal) sendSettingsModal.style.display = 'none';
});
createRoomBtn?.addEventListener('click', () => {
  if (!canCreateRoom()) {
    showToast('Na vytvorenie miestnosti musíš byť registrovaný alebo admin.');
    return;
  }
  const roomName = createRoomInput?.value.trim() || `Miestnosť ${Date.now()}`;
  if (!roomName || roomName === 'Miestnosť') {
    showToast('Zadaj názov miestnosti.');
    return;
  }
  const roomItem = addRoomToList(roomName, { activate: true });
  if (roomItem) {
    setActiveRoom(roomName, { silent: true });
  }
  if (createRoomInput) {
    createRoomInput.value = '';
  }
  showToast('Miestnosť vytvorená a otvorená.');
});

sendBtn?.addEventListener('click', sendMessage);
messageInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messagesDiv?.addEventListener('click', (event) => {
  const button = event.target.closest('.reaction-btn');
  if (!button) return;

  const messageId = Number(button.dataset.messageId);
  const emoji = button.dataset.emoji;
  if (!messageId || !emoji) return;

  socket.emit('toggle-reaction', { messageId, emoji });
});
