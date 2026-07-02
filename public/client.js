const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const activeUsersCount = document.getElementById('active-users-count');
const usersList = document.getElementById('users-list');
const currentUsernameDisplay = document.getElementById('current-username-display');
const navLogout = document.getElementById('nav-logout');
const navHelp = document.getElementById('nav-help');
const navProfile = document.getElementById('nav-profile');
const navFriends = document.getElementById('nav-friends');
const navIgnore = document.getElementById('nav-ignore');
const navQuicklink = document.getElementById('nav-quicklink');
const navMessenger = document.getElementById('nav-messenger');

const privateStatus = document.getElementById('private-status');
const privateTargetNameDisplay = document.getElementById('private-target-name');
const savedUsername = localStorage.getItem('chatUsername');
let currentUsername = savedUsername ? savedUsername.trim() : 'Anon';
let privateTargetId = null;
let privateTargetName = null;
let activeUsers = [];
const curseWords = ['hovno', 'kurva', 'kokot', 'sranie', 'sračky', 'debil', 'blbec', 'piča', 'chuj', 'zmetok', 'sprostost', 'nadavka', 'nadávka', 'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'fucker', 'motherfucker', 'slut', 'whore'];

function hashtagCurseWords(text) {
  if (!text) return text;
  return text.replace(/\b([a-zA-ZáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    if (curseWords.includes(lower)) {
      return `#${lower}`;
    }
    return match;
  });
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function addMessage(m) {
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
  d.appendChild(bubble);
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUserList(users) {
  if (activeUsersCount) {
    activeUsersCount.textContent = users.length;
  }
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  if (!usersList) return;
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user.username;
    if (user.username === currentUsername) {
      li.style.fontWeight = '700';
      li.style.opacity = '0.7';
      li.style.cursor = 'default';
    } else {
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
}

function setPrivateTarget(id, username) {
  privateTargetId = id;
  privateTargetName = username;
  if (privateStatus && privateTargetNameDisplay) {
    privateTargetNameDisplay.textContent = privateTargetName;
    privateStatus.style.display = 'block';
  }
  showToast(`Odkazovač aktivovaný: súkromná správa pre ${privateTargetName}`);
  messageInput.focus();
}

function clearPrivateTarget() {
  privateTargetId = null;
  privateTargetName = null;
  if (privateStatus) {
    privateStatus.style.display = 'none';
  }
}

function sendJoin() {
  currentUsername = localStorage.getItem('chatUsername')?.trim() || 'Anon';
  if (!currentUsername) currentUsername = 'Anon';
  if (currentUsernameDisplay) {
    currentUsernameDisplay.textContent = currentUsername;
  }
  socket.emit('join', { username: currentUsername });
}

socket.on('connect', () => {
  sendJoin();
});

socket.on('load-messages', (msgs) => {
  messagesDiv.innerHTML = '';
  msgs.forEach(addMessage);
});

socket.on('receive-message', addMessage);

socket.on('user-list', (users) => {
  activeUsers = users;
  updateUserList(users);
});

function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;
  text = hashtagCurseWords(text);
  if (privateTargetId) {
    socket.emit('send-private-message', {
      to: privateTargetId,
      text
    });
    messageInput.value = '';
    clearPrivateTarget();
    return;
  }

  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString()
  });
  messageInput.value = '';
}

socket.on('receive-private-message', (m) => {
  addMessage({
    username: m.self ? currentUsername : m.from,
    text: m.text,
    timestamp: m.timestamp,
    private: true,
    self: m.self,
    toUsername: m.toUsername
  });
});

function showToast(message) {
  alert(message);
}

navLogout?.addEventListener('click', (event) => {
  event.preventDefault();
  localStorage.removeItem('chatUsername');
  window.location.href = '/';
});
navHelp?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Návod: Enter odosiela správu, Shift+Enter nový riadok. Klik na meno v zozname pre adresovanie.');
});
navProfile?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast(`Prihlásený ako: ${currentUsername}`);
});
navFriends?.addEventListener('click', (event) => {
  event.preventDefault();
  usersList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
navIgnore?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Ignorovaní budú dostupní čoskoro.');
});
navQuicklink?.addEventListener('click', (event) => {
  event.preventDefault();
  const otherUser = activeUsers.find((user) => user.username !== currentUsername);
  if (otherUser) {
    setPrivateTarget(otherUser.id, otherUser.username);
    return;
  }
  showToast('Zatiaľ žiadny iný chater pre odkazovač.');
});
navMessenger?.addEventListener('click', (event) => {
  event.preventDefault();
  messageInput?.focus();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
