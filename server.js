const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'node_store_super_secret_key_123';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Node.js In-Memory Databases
const users = []; // Stores registered accounts
const appsData = [
  { id: "app-1", name: "CyberRunner 2077", category: "Action Games", type: "games", developer: "Neon Dynamics", rating: 4.8, reviewsCount: "128K", downloads: "10M+", size: "1.2 GB", description: "High-speed futuristic parkour action across neon skyscrapers.", icon: "🚀", banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80" },
  { id: "app-2", name: "FocusFlow AI", category: "Productivity", type: "apps", developer: "MindLabs Inc.", rating: 4.9, reviewsCount: "84K", downloads: "500K+", size: "45 MB", description: "Smart pomodoro timer and AI-driven daily planner.", icon: "⚡", banner: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80" },
  { id: "app-3", name: "PixelCraft Studio", category: "Art & Design", type: "apps", developer: "Retro Creative Labs", rating: 4.6, reviewsCount: "45K", downloads: "2M+", size: "82 MB", description: "Powerful retro pixel art creator with layer support.", icon: "🎨", banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80" },
  { id: "app-4", name: "SoundWave Stream", category: "Music & Audio", type: "apps", developer: "AudioSphere Ltd.", rating: 4.7, reviewsCount: "310K", downloads: "50M+", size: "68 MB", description: "Stream high-fidelity lossless audio and indie music.", icon: "🎵", banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80" },
  { id: "app-5", name: "Galaxy Raiders", category: "Arcade Games", type: "games", developer: "StarByte", rating: 4.5, reviewsCount: "92K", downloads: "5M+", size: "340 MB", description: "Classic space shooter reimagined with stunning graphics.", icon: "👾", banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80" },
  { id: "app-6", name: "SpeedMaster Nitro", category: "Racing Games", type: "games", developer: "Velocity Games", rating: 4.7, reviewsCount: "210K", downloads: "25M+", size: "1.8 GB", description: "Intense street racing with hyper-realistic cars.", icon: "🏎️", banner: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&q=80" },
  { id: "app-7", name: "Chef's Kitchen Pro", category: "Simulation", type: "games", developer: "Culinary Arts", rating: 4.4, reviewsCount: "33K", downloads: "1M+", size: "520 MB", description: "Manage a high-pressure restaurant kitchen.", icon: "🍳", banner: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80" },
  { id: "app-8", name: "Apex Tactics", category: "Strategy", type: "games", developer: "WarForge", rating: 4.8, reviewsCount: "150K", downloads: "8M+", size: "950 MB", description: "Build your base and conquer enemy territories.", icon: "🛡️", banner: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&q=80" },
  { id: "app-9", name: "FitPulse Tracker", category: "Health & Fitness", type: "apps", developer: "Vitality Co.", rating: 4.8, reviewsCount: "67K", downloads: "5M+", size: "35 MB", description: "Track your workouts, calories, and daily steps.", icon: "❤️", banner: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80" },
  { id: "app-10", name: "CryptoWallet Secure", category: "Finance", type: "apps", developer: "BlockChain Security", rating: 4.3, reviewsCount: "29K", downloads: "3M+", size: "60 MB", description: "Manage your digital assets with top-tier security.", icon: "💰", banner: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&q=80" },
  { id: "app-11", name: "SkyLens Weather", category: "Weather", type: "apps", developer: "Atmosphere Labs", rating: 4.9, reviewsCount: "115K", downloads: "10M+", size: "28 MB", description: "Hyper-local weather radar and forecasts.", icon: "⛅", banner: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=80" },
  { id: "app-12", name: "NoteMatrix", category: "Productivity", type: "apps", developer: "Notepad Corp", rating: 4.6, reviewsCount: "54K", downloads: "4M+", size: "40 MB", description: "Markdown notes and knowledge graphs.", icon: "📝", banner: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80" },
  { id: "app-13", name: "PhotoEnhancer AI", category: "Photography", type: "apps", developer: "Visionary", rating: 4.5, reviewsCount: "78K", downloads: "12M+", size: "110 MB", description: "Upscale and restore old photos instantly using AI.", icon: "📸", banner: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80" },
  { id: "app-14", name: "PolyQuest RPG", category: "Role Playing", type: "games", developer: "Mythic Entertainment", rating: 4.9, reviewsCount: "340K", downloads: "20M+", size: "2.1 GB", description: "Embark on an epic fantasy adventure with friends.", icon: "⚔️", banner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80" },
  { id: "app-15", name: "BrainTrain Puzzles", category: "Puzzle", type: "games", developer: "Cognitive Play", rating: 4.7, reviewsCount: "95K", downloads: "15M+", size: "55 MB", description: "Daily brain teasers and logic puzzles.", icon: "🧩", banner: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&q=80" },
  { id: "app-16", name: "CineFlix Player", category: "Entertainment", type: "apps", developer: "MediaStream Inc.", rating: 4.8, reviewsCount: "510K", downloads: "100M+", size: "75 MB", description: "Stream movies, series, and documentaries seamlessly.", icon: "🍿", banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80" }
];

// Node.js Route: Create Account
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), username, password: hashedPassword };
  users.push(newUser);

  const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token, username: newUser.username });
});

// Node.js Route: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token, username: user.username });
});

// Node.js Route: Get App List
app.get('/api/apps', (req, res) => {
  const { type, search } = req.query;
  let result = appsData;

  if (type && type !== 'all') {
    result = result.filter(item => item.type === type);
  }

  if (search) {
    const query = search.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

app.get('/api/apps/:id', (req, res) => {
  const appItem = appsData.find(item => item.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: "App not found" });
  res.json(appItem);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});