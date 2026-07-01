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

const savedUsername = localStorage.getItem('chatUsername');
let currentUsername = savedUsername ? savedUsername.trim() : 'Anon';

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
  d.className = 'msg' + (m.username === currentUsername ? ' me' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `
    <div class="from"><strong>${escapeHtml(m.username)}</strong></div>
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
    }
    usersList.appendChild(li);
  });
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

socket.on('user-list', updateUserList);

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('send-message', {
    username: currentUsername,
    text,
    timestamp: new Date().toISOString()
  });
  messageInput.value = '';
}

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
  messageInput?.focus();
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
