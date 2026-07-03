const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (.env file)
dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// DATABASE INITIALIZATION (Hybrid: Supabase / Local JSON)
// -------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

if (isSupabaseConfigured) {
  console.log("Database: Connected to Supabase (Production Mode).");
} else {
  console.log("Database: Using local JSON file db/data.json (Development Mode).");
}

const LOCAL_DATA_FILE = path.join(__dirname, 'db', 'data.json');

// Local file JSON database helpers
function readLocalDataFile() {
  try {
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
      const defaultData = {
        whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        adminPassword: "admin",
        headlineValue: 300,
        houses: [
          { "id": "1", "name": "SUPERBET", "emoji": "🔘", "color": "#f15a24", "value": 50, "active": true },
          { "id": "2", "name": "SPORTINGBET", "emoji": "🔴", "color": "#0055a5", "value": 50, "active": true },
          { "id": "3", "name": "Betboom", "emoji": "💥", "color": "#ffdd00", "value": 60, "active": true },
          { "id": "4", "name": "Donald Bet", "emoji": "🦆", "color": "#ff9900", "value": 50, "active": true },
          { "id": "5", "name": "BETBET", "emoji": "🟣", "color": "#8a2be2", "value": 70, "active": true }
        ]
      };
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading data.json:", error);
    return {
      whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
      adminPassword: "admin",
      headlineValue: 300,
      houses: []
    };
  }
}

function writeLocalDataFile(data) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing data.json:", error);
    return false;
  }
}

// -------------------------------------------------------------
// ASYNC DATABASE LAYER
// -------------------------------------------------------------

async function getDbConfig() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error("Supabase config read error:", error);
      return {
        whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        adminPassword: "admin",
        headlineValue: 300
      };
    }
    return {
      whatsappUrl: data.whatsapp_url,
      adminPassword: data.admin_password,
      headlineValue: Number(data.headline_value)
    };
  } else {
    const localData = readLocalDataFile();
    return {
      whatsappUrl: localData.whatsappUrl,
      adminPassword: localData.adminPassword,
      headlineValue: localData.headlineValue || 300
    };
  }
}

async function getDbHouses() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Supabase houses read error:", error);
      return [];
    }
    return data.map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      value: Number(h.value),
      active: h.active
    }));
  } else {
    const localData = readLocalDataFile();
    return localData.houses || [];
  }
}

async function saveDbConfig(whatsappUrl, adminPassword, headlineValue) {
  if (isSupabaseConfigured) {
    const updates = {};
    if (whatsappUrl !== undefined) updates.whatsapp_url = whatsappUrl;
    if (adminPassword !== undefined) updates.admin_password = adminPassword;
    if (headlineValue !== undefined) updates.headline_value = Number(headlineValue);

    const { error } = await supabase
      .from('configs')
      .update(updates)
      .eq('id', 1);
    
    if (error) {
      console.error("Supabase config update error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    if (whatsappUrl !== undefined) localData.whatsappUrl = whatsappUrl;
    if (adminPassword !== undefined) localData.adminPassword = adminPassword;
    if (headlineValue !== undefined) localData.headlineValue = Number(headlineValue);
    return writeLocalDataFile(localData);
  }
}

async function addDbHouse(house) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('houses')
      .insert({
        id: house.id,
        name: house.name,
        emoji: house.emoji,
        color: house.color,
        value: house.value,
        active: house.active
      });
    
    if (error) {
      console.error("Supabase insert house error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    localData.houses.push(house);
    return writeLocalDataFile(localData);
  }
}

async function updateDbHouse(id, updates) {
  if (isSupabaseConfigured) {
    const mappedUpdates = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.emoji !== undefined) mappedUpdates.emoji = updates.emoji;
    if (updates.color !== undefined) mappedUpdates.color = updates.color;
    if (updates.value !== undefined) mappedUpdates.value = Number(updates.value);
    if (updates.active !== undefined) mappedUpdates.active = updates.active;

    const { error } = await supabase
      .from('houses')
      .update(mappedUpdates)
      .eq('id', id);
    
    if (error) {
      console.error("Supabase update house error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    const idx = localData.houses.findIndex(h => h.id === id);
    if (idx === -1) return false;
    
    if (updates.name !== undefined) localData.houses[idx].name = updates.name;
    if (updates.emoji !== undefined) localData.houses[idx].emoji = updates.emoji;
    if (updates.color !== undefined) localData.houses[idx].color = updates.color;
    if (updates.value !== undefined) localData.houses[idx].value = Number(updates.value);
    if (updates.active !== undefined) localData.houses[idx].active = updates.active;
    
    return writeLocalDataFile(localData);
  }
}

async function deleteDbHouse(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('houses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Supabase delete house error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    const filtered = localData.houses.filter(h => h.id !== id);
    if (localData.houses.length === filtered.length) return false;
    
    localData.houses = filtered;
    return writeLocalDataFile(localData);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// -------------------------------------------------------------
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const config = await getDbConfig();
    if (token !== config.adminPassword) {
      return res.status(403).json({ error: 'Senha inválida ou sessão expirada.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao validar autenticação.' });
  }
}

// -------------------------------------------------------------
// EXPRESS ROUTES
// -------------------------------------------------------------

// PUBLIC: Get public config and active houses
app.get('/api/data', async (req, res) => {
  try {
    const config = await getDbConfig();
    const houses = await getDbHouses();
    const activeHouses = houses.filter(h => h.active !== false);
    
    res.json({
      whatsappUrl: config.whatsappUrl,
      headlineValue: config.headlineValue,
      houses: activeHouses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados da página.' });
  }
});

// PUBLIC: Admin login check
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Senha é obrigatória.' });
  }
  
  try {
    const config = await getDbConfig();
    if (password === config.adminPassword) {
      res.json({ success: true, token: config.adminPassword });
    } else {
      res.status(401).json({ error: 'Senha incorreta.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar login.' });
  }
});

// ADMIN: Get full dashboard data
app.get('/api/admin/data', authMiddleware, async (req, res) => {
  try {
    const config = await getDbConfig();
    const houses = await getDbHouses();
    
    res.json({
      whatsappUrl: config.whatsappUrl,
      adminPassword: config.adminPassword,
      headlineValue: config.headlineValue,
      houses: houses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do admin.' });
  }
});

// ADMIN: Save global configurations
app.post('/api/admin/config', authMiddleware, async (req, res) => {
  const { whatsappUrl, adminPassword, headlineValue } = req.body;
  
  if (!whatsappUrl) {
    return res.status(400).json({ error: 'O link do WhatsApp é obrigatório.' });
  }
  
  try {
    const success = await saveDbConfig(whatsappUrl, adminPassword, headlineValue);
    if (success) {
      const config = await getDbConfig();
      res.json({ success: true, message: 'Configurações salvas!', token: config.adminPassword });
    } else {
      res.status(500).json({ error: 'Erro ao salvar as configurações no banco.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao salvar configurações.' });
  }
});

// ADMIN: Add a new house
app.post('/api/admin/houses', authMiddleware, async (req, res) => {
  const { name, emoji, color, value, active } = req.body;
  
  if (!name || !value) {
    return res.status(400).json({ error: 'Nome e Valor da Banca são obrigatórios.' });
  }
  
  const newHouse = {
    id: Date.now().toString(),
    name: name.trim(),
    emoji: emoji ? emoji.trim() : '🔘',
    color: color ? color.trim() : '#00ff66',
    value: Number(value),
    active: active !== undefined ? active : true
  };
  
  try {
    const success = await addDbHouse(newHouse);
    if (success) {
      res.status(201).json(newHouse);
    } else {
      res.status(500).json({ error: 'Erro ao criar a casa no banco de dados.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao adicionar casa.' });
  }
});

// ADMIN: Update an existing house
app.put('/api/admin/houses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, emoji, color, value, active } = req.body;
  
  try {
    const success = await updateDbHouse(id, { name, emoji, color, value, active });
    if (success) {
      res.json({ success: true, message: 'Casa de aposta atualizada.' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar a casa no banco de dados.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao editar casa.' });
  }
});

// ADMIN: Delete a house
app.delete('/api/admin/houses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await deleteDbHouse(id);
    if (success) {
      res.json({ success: true, message: 'Casa de aposta removida.' });
    } else {
      res.status(500).json({ error: 'Erro ao excluir a casa no banco de dados.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao remover casa.' });
  }
});

// Catch-all route to serve index.html for unknown frontend routes
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local port execution
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Landing Page: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
  });
}

module.exports = app;
