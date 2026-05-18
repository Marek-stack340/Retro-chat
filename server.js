const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const fs = require('fs');
const usersFile = path.join(__dirname, 'users.json');

app.use(express.json());

function loadRegisteredUsers() {
  try {
    if (!fs.existsSync(usersFile)) return [];
    const raw = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to load users.json', err);
    return [];
  }
}

function saveRegisteredUsers(list) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(list, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save users.json', err);
    return false;
  }
}

// Ensure admin user exists
let registeredUsers = loadRegisteredUsers();
if (!registeredUsers.find(u => u.username === 'MAREKC')) {
  registeredUsers.push({ id: 'admin-1', username: 'MAREKC', role: 'admin', createdAt: new Date().toISOString() });
  saveRegisteredUsers(registeredUsers);
}

// Registration endpoint
app.post('/register', (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'Invalid username' });
  const normalized = username.trim().toUpperCase();
  if (!normalized) return res.status(400).json({ error: 'Empty username' });

  registeredUsers = loadRegisteredUsers();
  if (registeredUsers.find(u => u.username === normalized)) {
    return res.status(409).json({ error: 'Username already registered' });
  }

  const newUser = { id: `u-${Date.now()}`, username: normalized, role: 'user', createdAt: new Date().toISOString() };
  registeredUsers.push(newUser);
  if (!saveRegisteredUsers(registeredUsers)) return res.status(500).json({ error: 'Failed to save' });
  return res.json({ ok: true, user: newUser });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store users and messages
const users = new Map();
const messages = [];

// Socket.io events
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Listen for user joining
  socket.on('user-join', (username) => {
    // Resolve role from registered users if present
    const reg = registeredUsers.find(u => u.username === (username || '').toString().toUpperCase());
    const role = reg ? reg.role : 'user';
    users.set(socket.id, {
      id: socket.id,
      username: username,
      role: role,
      joinedAt: new Date()
    });

    // Send all previous messages to the new user
    socket.emit('load-messages', messages);

    // Notify all users that someone joined
    io.emit('user-joined', {
      username: username,
      role: role,
      userCount: users.size,
      users: Array.from(users.values())
    });

    console.log(`${username} joined. Total users: ${users.size}`);
  });

  // Listen for chat messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const message = {
        id: Date.now(),
        username: user.username,
        text: data.text,
        timestamp: new Date(),
        userId: socket.id
      };

      messages.push(message);

      // Broadcast message to all users
      io.emit('receive-message', message);
      console.log(`Message from ${user.username}: ${data.text}`);
    }
  });

  // Listen for user leaving
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('user-left', {
        username: user.username,
        userCount: users.size,
        users: Array.from(users.values())
      });
      console.log(`${user.username} left. Total users: ${users.size}`);
    }
  });

  // Listen for typing indicator
  socket.on('user-typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username
      });
    }
  });

  // Listen for stop typing
  socket.on('user-stop-typing', () => {
    socket.broadcast.emit('user-stop-typing');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Retro Chat Server running on http://localhost:${PORT}`);
});
