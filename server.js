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

const nodemailer = require('nodemailer');
const db = require('./db');
app.use(express.json());

const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

function emailEnabled() {
  return process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM;
}

async function sendNotificationEmail(toEmail, subject, text) {
  if (!emailEnabled()) {
    console.warn('Email not sent: SMTP not configured');
    return;
  }
  try {
    await mailTransport.sendMail({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject,
      text
    });
    console.log(`Email notification sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send email notification', err);
  }
}

const profanityList = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'hell',
  'kurva', 'jebat', 'hovno', 'sračka', 'srac', 'kokot', 'piča', 'pica',
  'kkt', 'hajzel', 'cipa', 'srát', 'srať', 'sraj', 'zkurvysyn'
];

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return profanityList.reduce((current, badWord) => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    return current.replace(regex, (match) => '#'.repeat(match.length));
  }, text);
}

// Registration endpoint (username, email, password)
app.post(['/register', '/api/register'], async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email and password are required' });
    const normalized = username.toString().trim().toUpperCase();
    const normalizedEmail = email.toString().trim().toLowerCase();
    const trimmedPassword = password.toString();
    if (!normalized) return res.status(400).json({ error: 'Empty username' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Invalid email address' });
    if (trimmedPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingUser = await db.findUserByUsername(normalized);
    if (existingUser) return res.status(409).json({ error: 'Username already registered' });
    const existingEmail = await db.findUserByEmail(normalizedEmail);
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const user = await db.createUser({ username: normalized, email: normalizedEmail, password: trimmedPassword });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Registration error', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store users and messages
const users = new Map();
const messages = [];
// Simple AI bot user (not a socket)
const aiUser = { id: 'ai', username: 'Oddych-AI', role: 'bot' };

function generateAIReply(text) {
  // Basic canned reply. If you set OPENAI_API_KEY env, this could be upgraded.
  if (!text || !text.trim()) return 'Ahoj! Ako ti môžem pomôcť?';
  // friendly echo with small transformation
  const cleaned = text.trim();
  return `Reagujem ako AI: "${cleaned}" — povedz mi viac alebo sa spýtaj na niečo konkrétne.`;
}

// Socket.io events
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Listen for user joining
  socket.on('user-join', async (username) => {
    // Resolve role from registered users in DB if present
    let role = 'user';
    try {
      const reg = await db.findUserByUsername((username || '').toString().toUpperCase());
      if (reg && reg.role) role = reg.role;
    } catch (err) {
      console.error('DB lookup error', err);
    }
    users.set(socket.id, {
      id: socket.id,
      username: username,
      role: role,
      joinedAt: new Date()
    });

    // Send all previous messages to the new user
    socket.emit('load-messages', messages);

    // Notify all users that someone joined
      // Notify all users that someone joined (include AI bot in user list)
      const usersArray = Array.from(users.values());
      usersArray.push(aiUser);
      io.emit('user-joined', {
        username: username,
        role: role,
        userCount: users.size,
        users: usersArray
      });

    console.log(`${username} joined. Total users: ${users.size}`);
  });

  // Listen for chat messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const sanitizedText = sanitizeText(data.text);
      const message = {
        id: Date.now(),
        username: user.username,
        text: sanitizedText,
        timestamp: new Date(),
        userId: socket.id
      };

      messages.push(message);

      // Broadcast message to all users
      io.emit('receive-message', message);
      console.log(`Message from ${user.username}: ${sanitizedText}`);
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
        const usersArray = Array.from(users.values());
        usersArray.push(aiUser);
        io.emit('user-left', {
          username: user.username,
          userCount: users.size,
          users: usersArray
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

  // Listen for private messages
  socket.on('private-message', async (data) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;
      const toId = data && data.to;
      const text = sanitizeText((data && data.text) || '');
      const payload = {
        from: user.username,
        fromId: socket.id,
        text: text,
        timestamp: new Date()
      };

      // send to recipient if connected
        // If recipient is the AI bot id (ai), handle locally
        if (toId === 'ai' || toId === 'AI' || toId === aiUser.id || (typeof toId === 'string' && toId.toLowerCase && toId.toLowerCase() === 'ai')) {
          // send bot reply back to sender via private-message event
          const reply = generateAIReply(text);
          const botPayload = { from: aiUser.username, fromId: aiUser.id, text: reply, timestamp: new Date() };
          socket.emit('private-message', botPayload);
          return;
        }

        if (toId && io.sockets.sockets.get(toId)) {
          io.to(toId).emit('private-message', payload);
        }

      // also send to sender for local display
      socket.emit('private-message', payload);

      // send email notification if recipient is registered
      if (toId && io.sockets.sockets.get(toId)) {
        const recipientSocket = users.get(toId);
        if (recipientSocket && recipientSocket.username) {
          const recipientUser = await db.findUserByUsername(recipientSocket.username.toUpperCase());
          if (recipientUser && recipientUser.email) {
            sendNotificationEmail(
              recipientUser.email,
              `Nová správa v odkazovači od ${user.username}`,
              `Ahoj ${recipientUser.username},\n\n${user.username} ti poslal(a) správu v odkazovači:\n\n${text}\n\nPrihlás sa do Oddych chatu, aby si ju prečítal(a).`
            );
          }
        }
      }
    } catch (err) {
      console.error('Private message error', err);
    }
  });

  // Simple AI call flow (simulated, using socket text + speech on client)
  socket.on('start-ai-call', (data) => {
    // acknowledge start
    socket.emit('ai-call-started', { bot: aiUser.username });
  });

  socket.on('ai-call-send', (data) => {
    try {
      const text = (data && data.text) || '';
      const reply = generateAIReply(text);
      // send reply back
      socket.emit('ai-call-reply', { from: aiUser.username, text: reply, timestamp: new Date() });
    } catch (err) {
      console.error('ai-call-send error', err);
    }
  });

  // WebRTC signaling forwarding
  socket.on('webrtc-offer', (data) => {
    try {
      const from = users.get(socket.id);
      const toId = data && data.to;
      const sdp = data && data.sdp;
      const payload = { from: from ? from.username : 'unknown', fromId: socket.id, sdp };
      if (toId && io.sockets.sockets.get(toId)) {
        io.to(toId).emit('webrtc-offer', payload);
      }
    } catch (err) {
      console.error('webrtc-offer forward error', err);
    }
  });

  socket.on('webrtc-answer', (data) => {
    try {
      const toId = data && data.to;
      const sdp = data && data.sdp;
      const payload = { sdp };
      if (toId && io.sockets.sockets.get(toId)) {
        io.to(toId).emit('webrtc-answer', payload);
      }
    } catch (err) {
      console.error('webrtc-answer forward error', err);
    }
  });

  socket.on('webrtc-candidate', (data) => {
    try {
      const toId = data && data.to;
      const candidate = data && data.candidate;
      const payload = { candidate };
      if (toId && io.sockets.sockets.get(toId)) {
        io.to(toId).emit('webrtc-candidate', payload);
      }
    } catch (err) {
      console.error('webrtc-candidate forward error', err);
    }
  });

  socket.on('webrtc-end', (data) => {
    try {
      const toId = data && data.to;
      if (toId && io.sockets.sockets.get(toId)) {
        io.to(toId).emit('webrtc-end', { fromId: socket.id });
      }
    } catch (err) {
      console.error('webrtc-end forward error', err);
    }
  });
});

const PORT = process.env.PORT || 3000;

// Start server immediately so platforms (Cloud Run) get a quick HTTP response.
server.listen(PORT, () => {
  console.log(`🎮 Oddych Chat Server running on http://localhost:${PORT}`);
});

// Initialize DB and ensure admin asynchronously; log errors but keep server running.
(async () => {
  try {
    await db.init();
    await db.ensureAdmin('MAREKC');
    console.log('✅ Database initialized and admin ensured');
  } catch (err) {
    console.error('DB initialization failed (continuing):', err);
  }
})();
