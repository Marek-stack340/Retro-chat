const socket = io();

const messagesDiv = document.getElementById('msgr-messages');
const usersList = document.getElementById('msgr-users');
const input = document.getElementById('msgr-input');
const sendBtn = document.getElementById('msgr-send');
const currentUserEl = document.getElementById('msgr-current-user');
const privateStatus = document.getElementById('msgr-private-status');
const privateNameEl = document.getElementById('msgr-private-name');
const logoutBtn = document.getElementById('msgr-logout');

let currentUsername = (localStorage.getItem('chatUsername') || 'Správca').trim();
let activeUsers = [];
let privateTargetId = null;
let privateTargetName = null;

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>\"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function renderPrivateStatus() {
  if (privateTargetName) {
    privateNameEl.textContent = privateTargetName;
    privateStatus.style.display = 'block';
  } else {
    privateStatus.style.display = 'none';
  }
}

function addMessage(m) {
  const d = document.createElement('div');
  if (m.system) {
    d.className = 'system-msg';
    d.textContent = m.text;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  d.className = 'msg' + ((m.username === currentUsername) ? ' me' : '') + (m.private ? ' private' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (m.private ? ' private' : '');
  bubble.innerHTML = `
    <div class="from"><strong>${escapeHtml(m.username)}</strong></div>
    ${m.private ? `<div class="private-label">${m.self ? `Súkromné -> ${escapeHtml(m.toUsername || '')}` : 'Súkromné'}</div>` : ''}
    <div class="text">${escapeHtml(m.text)}</div>
    <div class="meta">${new Date(m.timestamp || Date.now()).toLocaleString()}</div>
  `;
  d.appendChild(bubble);
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUsers(users) {
  activeUsers = users || [];
  usersList.innerHTML = '';
  activeUsers.forEach((u) => {
    const li = document.createElement('li');
    li.textContent = u.username;
    if (u.username === currentUsername) {
      li.classList.add('me');
    } else {
      li.addEventListener('click', () => {
        privateTargetId = u.id;
        privateTargetName = u.username;
        renderPrivateStatus();
        input.focus();
      });
    }
    usersList.appendChild(li);
  });
}

function sendMessage() {
  const text = (input.value || '').trim();
  if (!text) return;

  if (privateTargetId) {
    socket.emit('send-private-message', { to: privateTargetId, text });
    input.value = '';
    privateTargetId = null;
    privateTargetName = null;
    renderPrivateStatus();
    return;
  }

  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString()
  });
  input.value = '';
}

socket.on('connect', () => {
  currentUsername = (localStorage.getItem('chatUsername') || 'Správca').trim() || 'Správca';
  currentUserEl.textContent = currentUsername;
  socket.emit('join', { username: currentUsername });
});

socket.on('load-messages', (msgs) => {
  messagesDiv.innerHTML = '';
  (msgs || []).forEach(addMessage);
});

socket.on('receive-message', addMessage);

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

socket.on('system-message', (msg) => {
  addMessage({ system: true, text: msg, timestamp: new Date().toISOString() });
});

socket.on('join-denied', (message) => {
  addMessage({ system: true, text: `⚠ ${message || 'Vstup bol zamietnutý.'}`, timestamp: new Date().toISOString() });
});

socket.on('user-list', updateUsers);

sendBtn?.addEventListener('click', sendMessage);
input?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

logoutBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('chatUsername');
  localStorage.removeItem('chatRegistered');
  window.location.href = '/';
});
