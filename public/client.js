const socket = io();
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username-input');
const dmBtn = document.getElementById('dm-btn');
const dmPanel = document.getElementById('dm-panel');
const dmClose = document.getElementById('dm-close');
const dmUserSelect = document.getElementById('dm-user-select');
const dmMessageInput = document.getElementById('dm-message-input');
const dmSendBtn = document.getElementById('dm-send-btn');
const activeUsersCount = document.getElementById('active-users-count');
const usersList = document.getElementById('users-list');
const usersSidebar = document.getElementById('users-sidebar');
const toggleUsersBtn = document.getElementById('toggle-users-btn');
const currentUsernameDisplay = document.getElementById('current-username-display');

const savedUsername = localStorage.getItem('chatUsername');
if (savedUsername) {
  usernameInput.value = savedUsername;
}

let currentUsername = usernameInput.value.trim() || 'Anon';

function escapeHtml(s) { return (s||'').toString().replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function addMessage(m) {
  const d = document.createElement('div');
  d.className = 'msg' + (m.username === currentUsername ? ' me' : '');
  const avatar = `<div class="user-avatar">${escapeHtml((m.username||'')[0]||'?').toUpperCase()}</div>`;
  const bubble = `<div class="bubble"><div class="from"><strong>${escapeHtml(m.username)}</strong></div><div class="text">${escapeHtml(m.text)}</div><div class="meta">${new Date(m.timestamp || Date.now()).toLocaleString()}</div></div>`;
  if (m.username === currentUsername) {
    d.innerHTML = `${bubble}${avatar}`;
  } else {
    d.innerHTML = `${avatar}${bubble}`;
  }
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addPrivateMessage(m) {
  const d = document.createElement('div');
  d.className = 'msg private-msg';
  if (m.self) {
    d.innerHTML = `<strong>Ty</strong> → <em>${escapeHtml(m.toUsername || 'niekto')}</em>: ${escapeHtml(m.text)}`;
  } else {
    d.innerHTML = `<strong>Súkromne od ${escapeHtml(m.from)}</strong>: ${escapeHtml(m.text)}`;
  }
  messagesDiv.appendChild(d);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUserList(users) {
  dmUserSelect.innerHTML = '<option value="">Vyber používateľa</option>';
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user.username;
    li.dataset.id = user.id;
    if (user.username === currentUsername) li.classList.add('me');
    li.addEventListener('click', () => {
      // open DM panel and select user
      dmPanel.classList.remove('hidden');
      dmUserSelect.value = user.id;
      dmMessageInput.focus();
    });
    usersList.appendChild(li);

    if (user.username !== currentUsername) {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = user.username;
      dmUserSelect.appendChild(opt);
    }
  });
  activeUsersCount.textContent = users.length;
  currentUsernameDisplay.textContent = currentUsername;
}

function sendJoin() {
  currentUsername = usernameInput.value.trim() || 'Anon';
  localStorage.setItem('chatUsername', currentUsername);
  socket.emit('join', { username: currentUsername });
}

usernameInput.addEventListener('blur', () => {
  const name = usernameInput.value.trim();
  if (name) {
    localStorage.setItem('chatUsername', name);
  }
});

socket.on('connect', () => {
  sendJoin();
});

socket.on('load-messages', (msgs) => {
  messagesDiv.innerHTML = '';
  msgs.forEach(addMessage);
});

socket.on('receive-message', addMessage);

socket.on('receive-private-message', addPrivateMessage);

socket.on('user-list', updateUserList);

sendBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if (!text) return;
  sendJoin();
  socket.emit('send-message', { username: currentUsername, text, timestamp: new Date().toISOString() });
  messageInput.value = '';
});

// support Enter to send, Shift+Enter for newline
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

dmBtn.addEventListener('click', () => {
  dmPanel.classList.remove('hidden');
  dmMessageInput.focus();
});

toggleUsersBtn.addEventListener('click', () => {
  usersSidebar.classList.toggle('hidden');
});

dmClose.addEventListener('click', () => {
  dmPanel.classList.add('hidden');
});

dmSendBtn.addEventListener('click', () => {
  const to = dmUserSelect.value;
  const text = dmMessageInput.value.trim();
  if (!to || !text) return;
  socket.emit('send-private-message', { to, text });
  dmMessageInput.value = '';
  dmPanel.classList.add('hidden');
});

usernameInput.addEventListener('change', sendJoin);

messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });

dmMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); dmSendBtn.click(); } });
