const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'db', 'data.json');

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const defaultData = {
        whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        adminPassword: "admin",
        houses: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading data.json:", error);
    return {
      whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
      adminPassword: "admin",
      houses: []
    };
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing data.json:", error);
    return false;
  }
}

// Admin Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
  }
  
  const token = authHeader.split(' ')[1];
  const data = readData();
  
  if (token !== data.adminPassword) {
    return res.status(403).json({ error: 'Senha inválida ou sessão expirada.' });
  }
  
  next();
}

// PUBLIC ENDPOINTS

// Get public landing page data (WhatsApp url + active houses)
app.get('/api/data', (req, res) => {
  const data = readData();
  // Filter only active houses and remove password from response
  const publicHouses = data.houses.filter(h => h.active !== false);
  res.json({
    whatsappUrl: data.whatsappUrl,
    houses: publicHouses
  });
});

// Admin Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Senha é obrigatória.' });
  }
  
  const data = readData();
  if (password === data.adminPassword) {
    res.json({ success: true, token: data.adminPassword });
  } else {
    res.status(401).json({ error: 'Senha incorreta.' });
  }
});


// ADMIN ENDPOINTS (Protected)

// Get full configurations (including password and inactive houses)
app.get('/api/admin/data', authMiddleware, (req, res) => {
  const data = readData();
  res.json(data);
});

// Update global config (WhatsApp Link and Admin Password)
app.post('/api/admin/config', authMiddleware, (req, res) => {
  const { whatsappUrl, adminPassword } = req.body;
  
  if (!whatsappUrl) {
    return res.status(400).json({ error: 'O link do WhatsApp é obrigatório.' });
  }
  
  const data = readData();
  data.whatsappUrl = whatsappUrl;
  
  if (adminPassword && adminPassword.trim() !== '') {
    data.adminPassword = adminPassword.trim();
  }
  
  if (writeData(data)) {
    res.json({ success: true, message: 'Configurações atualizadas!', token: data.adminPassword });
  } else {
    res.status(500).json({ error: 'Erro ao salvar os dados.' });
  }
});

// Add a new bookmaker house
app.post('/api/admin/houses', authMiddleware, (req, res) => {
  const { name, emoji, color, value, active } = req.body;
  
  if (!name || !value) {
    return res.status(400).json({ error: 'Nome e Valor da Banca são obrigatórios.' });
  }
  
  const data = readData();
  const newHouse = {
    id: Date.now().toString(),
    name: name.trim(),
    emoji: emoji ? emoji.trim() : '🔘',
    color: color ? color.trim() : '#00ff66',
    value: Number(value),
    active: active !== undefined ? active : true
  };
  
  data.houses.push(newHouse);
  
  if (writeData(data)) {
    res.status(201).json(newHouse);
  } else {
    res.status(500).json({ error: 'Erro ao criar casa de aposta.' });
  }
});

// Update an existing bookmaker house
app.put('/api/admin/houses/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, emoji, color, value, active } = req.body;
  
  const data = readData();
  const houseIndex = data.houses.findIndex(h => h.id === id);
  
  if (houseIndex === -1) {
    return res.status(404).json({ error: 'Casa de aposta não encontrada.' });
  }
  
  if (name) data.houses[houseIndex].name = name.trim();
  if (emoji !== undefined) data.houses[houseIndex].emoji = emoji.trim();
  if (color !== undefined) data.houses[houseIndex].color = color.trim();
  if (value !== undefined) data.houses[houseIndex].value = Number(value);
  if (active !== undefined) data.houses[houseIndex].active = active;
  
  if (writeData(data)) {
    res.json(data.houses[houseIndex]);
  } else {
    res.status(500).json({ error: 'Erro ao atualizar casa de aposta.' });
  }
});

// Delete a bookmaker house
app.delete('/api/admin/houses/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  const data = readData();
  const filteredHouses = data.houses.filter(h => h.id !== id);
  
  if (data.houses.length === filteredHouses.length) {
    return res.status(404).json({ error: 'Casa de aposta não encontrada.' });
  }
  
  data.houses = filteredHouses;
  
  if (writeData(data)) {
    res.json({ success: true, message: 'Casa de aposta removida.' });
  } else {
    res.status(500).json({ error: 'Erro ao remover casa de aposta.' });
  }
});

// Catch-all route to serve index.html for unknown frontend routes
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local running
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Landing Page: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
  });
}

module.exports = app;
