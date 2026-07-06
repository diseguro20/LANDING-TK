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
        minHousesForBonus: 8,
        opValuePerCpa: 3.12,
        opBonus: 25.00,
        leadValuePerCpa: 6.00,
        leadBonus: 100.00,
        operators: ["Takesh", "SK", "Deio", "TKAY", "Tito", "JEAN", "kaio", "thales", "marmelow", "maca"],
        statuses: ["⏳ Em Andamento", "⏸️ Aguardando Lead", "✅ Concluído", "❌ Desistiu / Sumiu", "🚫 Golpe / Erro", "💢 Saque Não Caiu"],
        houses: [
          { "id": "1", "name": "SUPERBET", "emoji": "🔘", "color": "#f15a24", "value": 50, "active": true },
          { "id": "2", "name": "SPORTINGBET", "emoji": "🔴", "color": "#0055a5", "value": 50, "active": true },
          { "id": "3", "name": "Betboom", "emoji": "💥", "color": "#ffdd00", "value": 60, "active": true },
          { "id": "4", "name": "Donald Bet", "emoji": "🦆", "color": "#ff9900", "value": 50, "active": true },
          { "id": "5", "name": "BETBET", "emoji": "🟣", "color": "#8a2be2", "value": 70, "active": true }
        ],
        leads: []
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
      minHousesForBonus: 8,
      opValuePerCpa: 3.12,
      opBonus: 25.00,
      leadValuePerCpa: 6.00,
      leadBonus: 100.00,
      operators: [],
      statuses: [],
      houses: [],
      leads: []
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
        headlineValue: 300,
        minHousesForBonus: 8,
        opValuePerCpa: 3.12,
        opBonus: 25.00,
        leadValuePerCpa: 6.00,
        leadBonus: 100.00,
        operators: "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca",
        statuses: "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu"
      };
    }
    return {
      whatsappUrl: data.whatsapp_url,
      adminPassword: data.admin_password,
      headlineValue: Number(data.headline_value),
      minHousesForBonus: Number(data.min_houses_for_bonus || 8),
      opValuePerCpa: Number(data.op_value_per_cpa || 3.12),
      opBonus: Number(data.op_bonus || 25.00),
      leadValuePerCpa: Number(data.lead_value_per_cpa || 6.00),
      leadBonus: Number(data.lead_bonus || 100.00),
      operators: data.operators || "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca",
      statuses: data.statuses || "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu"
    };
  } else {
    const localData = readLocalDataFile();
    return {
      whatsappUrl: localData.whatsappUrl,
      adminPassword: localData.adminPassword,
      headlineValue: localData.headlineValue || 300,
      minHousesForBonus: localData.minHousesForBonus || 8,
      opValuePerCpa: localData.opValuePerCpa || 3.12,
      opBonus: localData.opBonus || 25.00,
      leadValuePerCpa: localData.leadValuePerCpa || 6.00,
      leadBonus: localData.leadBonus || 100.00,
      operators: Array.isArray(localData.operators) ? localData.operators.join(", ") : (localData.operators || "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca"),
      statuses: Array.isArray(localData.statuses) ? localData.statuses.join(", ") : (localData.statuses || "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu")
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

async function saveDbConfig(payload) {
  if (isSupabaseConfigured) {
    const updates = {};
    if (payload.whatsappUrl !== undefined) updates.whatsapp_url = payload.whatsappUrl;
    if (payload.adminPassword !== undefined) updates.admin_password = payload.adminPassword;
    if (payload.headlineValue !== undefined) updates.headline_value = Number(payload.headlineValue);
    if (payload.minHousesForBonus !== undefined) updates.min_houses_for_bonus = Number(payload.minHousesForBonus);
    if (payload.opValuePerCpa !== undefined) updates.op_value_per_cpa = Number(payload.opValuePerCpa);
    if (payload.opBonus !== undefined) updates.op_bonus = Number(payload.opBonus);
    if (payload.leadValuePerCpa !== undefined) updates.lead_value_per_cpa = Number(payload.leadValuePerCpa);
    if (payload.leadBonus !== undefined) updates.lead_bonus = Number(payload.leadBonus);
    if (payload.operators !== undefined) updates.operators = payload.operators;
    if (payload.statuses !== undefined) updates.statuses = payload.statuses;

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
    if (payload.whatsappUrl !== undefined) localData.whatsappUrl = payload.whatsappUrl;
    if (payload.adminPassword !== undefined) localData.adminPassword = payload.adminPassword;
    if (payload.headlineValue !== undefined) localData.headlineValue = Number(payload.headlineValue);
    if (payload.minHousesForBonus !== undefined) localData.minHousesForBonus = Number(payload.minHousesForBonus);
    if (payload.opValuePerCpa !== undefined) localData.opValuePerCpa = Number(payload.opValuePerCpa);
    if (payload.opBonus !== undefined) localData.opBonus = Number(payload.opBonus);
    if (payload.leadValuePerCpa !== undefined) localData.leadValuePerCpa = Number(payload.leadValuePerCpa);
    if (payload.leadBonus !== undefined) localData.leadBonus = Number(payload.leadBonus);
    
    if (payload.operators !== undefined) {
      localData.operators = payload.operators.split(",").map(s => s.strip());
    }
    if (payload.statuses !== undefined) {
      localData.statuses = payload.statuses.split(",").map(s => s.strip());
    }
    
    return writeLocalDataFile(localData);
  }
}

// -------------------------------------------------------------
// LEADS DATABASE LAYER
// -------------------------------------------------------------
async function getDbLeads(filters = {}) {
  const { search, operator, status, isClosed } = filters;
  
  if (isSupabaseConfigured) {
    let query = supabase.from('leads').select('*');
    
    if (operator) query = query.eq('operator', operator);
    if (status) query = query.eq('status', status);
    if (isClosed !== undefined && isClosed !== '') {
      query = query.eq('is_closed', isClosed === 'true');
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }
    
    // Sort by date desc, then by id desc
    query = query.order('date', { ascending: false }).order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) {
      console.error("Supabase leads fetch error:", error);
      return [];
    }
    
    return data.map(l => ({
      id: l.id,
      date: l.date,
      name: l.name,
      whatsapp: l.whatsapp,
      operator: l.operator,
      status: l.status,
      completedHouses: l.completed_houses || [],
      losses: Number(l.losses || 0),
      isClosed: l.is_closed,
      indication: l.indication || ""
    }));
  } else {
    const localData = readLocalDataFile();
    let filtered = localData.leads || [];
    
    if (operator) {
      filtered = filtered.filter(l => l.operator === operator);
    }
    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (isClosed !== undefined && isClosed !== '') {
      const boolClosed = isClosed === 'true';
      filtered = filtered.filter(l => l.isClosed === boolClosed || l.is_closed === boolClosed);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(l => 
        (l.name && l.name.toLowerCase().includes(term)) || 
        (l.whatsapp && l.whatsapp.includes(term))
      );
    }
    
    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return filtered.map(l => ({
      id: l.id,
      date: l.date,
      name: l.name,
      whatsapp: l.whatsapp,
      operator: l.operator,
      status: l.status,
      completedHouses: l.completedHouses || l.completed_houses || [],
      losses: Number(l.losses || 0),
      isClosed: l.isClosed !== undefined ? l.isClosed : l.is_closed,
      indication: l.indication || ""
    }));
  }
}

async function addDbLead(lead) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('leads')
      .insert({
        date: lead.date,
        name: lead.name,
        whatsapp: lead.whatsapp,
        operator: lead.operator,
        status: lead.status,
        completed_houses: lead.completedHouses,
        losses: Number(lead.losses || 0),
        is_closed: lead.isClosed || false,
        indication: lead.indication || ""
      });
    
    if (error) {
      console.error("Supabase lead insert error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    if (!localData.leads) localData.leads = [];
    
    const newLead = {
      id: Date.now(),
      date: lead.date,
      name: lead.name,
      whatsapp: lead.whatsapp,
      operator: lead.operator,
      status: lead.status,
      completedHouses: lead.completedHouses || [],
      losses: Number(lead.losses || 0),
      isClosed: lead.isClosed || false,
      indication: lead.indication || ""
    };
    
    localData.leads.push(newLead);
    return writeLocalDataFile(localData);
  }
}

async function updateDbLead(id, updates) {
  if (isSupabaseConfigured) {
    const dbUpdates = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
    if (updates.operator !== undefined) dbUpdates.operator = updates.operator;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.completedHouses !== undefined) dbUpdates.completed_houses = updates.completedHouses;
    if (updates.losses !== undefined) dbUpdates.losses = Number(updates.losses);
    if (updates.isClosed !== undefined) dbUpdates.is_closed = updates.isClosed;
    if (updates.indication !== undefined) dbUpdates.indication = updates.indication;

    const { error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('id', id);
    
    if (error) {
      console.error("Supabase lead update error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    const idx = localData.leads.findIndex(l => String(l.id) === String(id));
    if (idx === -1) return false;
    
    if (updates.date !== undefined) localData.leads[idx].date = updates.date;
    if (updates.name !== undefined) localData.leads[idx].name = updates.name;
    if (updates.whatsapp !== undefined) localData.leads[idx].whatsapp = updates.whatsapp;
    if (updates.operator !== undefined) localData.leads[idx].operator = updates.operator;
    if (updates.status !== undefined) localData.leads[idx].status = updates.status;
    if (updates.completedHouses !== undefined) localData.leads[idx].completedHouses = updates.completedHouses;
    if (updates.losses !== undefined) localData.leads[idx].losses = Number(updates.losses);
    if (updates.isClosed !== undefined) localData.leads[idx].isClosed = updates.isClosed;
    if (updates.indication !== undefined) localData.leads[idx].indication = updates.indication;
    
    return writeLocalDataFile(localData);
  }
}

async function deleteDbLead(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Supabase lead delete error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    const filtered = (localData.leads || []).filter(l => String(l.id) !== String(id));
    if (localData.leads.length === filtered.length) return false;
    
    localData.leads = filtered;
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

// ADMIN: Get full dashboard configurations
app.get('/api/admin/data', authMiddleware, async (req, res) => {
  try {
    const config = await getDbConfig();
    const houses = await getDbHouses();
    
    res.json({
      whatsappUrl: config.whatsappUrl,
      adminPassword: config.adminPassword,
      headlineValue: config.headlineValue,
      
      // New configurations fields
      minHousesForBonus: config.minHousesForBonus,
      opValuePerCpa: config.opValuePerCpa,
      opBonus: config.opBonus,
      leadValuePerCpa: config.leadValuePerCpa,
      leadBonus: config.leadBonus,
      operators: config.operators,
      statuses: config.statuses,
      
      houses: houses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do admin.' });
  }
});

// ADMIN: Save global configurations
app.post('/api/admin/config', authMiddleware, async (req, res) => {
  const { 
    whatsappUrl, adminPassword, headlineValue,
    minHousesForBonus, opValuePerCpa, opBonus,
    leadValuePerCpa, leadBonus, operators, statuses
  } = req.body;
  
  if (!whatsappUrl) {
    return res.status(400).json({ error: 'O link do WhatsApp é obrigatório.' });
  }
  
  try {
    const success = await saveDbConfig({
      whatsappUrl, adminPassword, headlineValue,
      minHousesForBonus, opValuePerCpa, opBonus,
      leadValuePerCpa, leadBonus, operators, statuses
    });
    
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

// ADMIN: Houses endpoints (already verified)
app.post('/api/admin/houses', authMiddleware, async (req, res) => {
  const { name, emoji, color, value, active } = req.body;
  if (!name || !value) return res.status(400).json({ error: 'Nome e Valor são obrigatórios.' });
  
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
    if (success) res.status(201).json(newHouse);
    else res.status(500).json({ error: 'Erro ao criar a casa no banco.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.put('/api/admin/houses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, emoji, color, value, active } = req.body;
  try {
    const success = await updateDbHouse(id, { name, emoji, color, value, active });
    if (success) res.json({ success: true });
    else res.status(500).json({ error: 'Erro ao atualizar.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.delete('/api/admin/houses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await deleteDbHouse(id);
    if (success) res.json({ success: true });
    else res.status(500).json({ error: 'Erro ao excluir.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// -------------------------------------------------------------
// LEADS API ENDPOINTS
// -------------------------------------------------------------

// ADMIN: GET all leads with filters
app.get('/api/admin/leads', authMiddleware, async (req, res) => {
  const { search, operator, status, isClosed } = req.query;
  try {
    const leads = await getDbLeads({ search, operator, status, isClosed });
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter listagem de leads.' });
  }
});

// ADMIN: POST create new lead
app.post('/api/admin/leads', authMiddleware, async (req, res) => {
  const { date, name, whatsapp, operator, status, completedHouses, losses, isClosed, indication } = req.body;
  
  if (!date || !name) {
    return res.status(400).json({ error: 'Data e Nome são obrigatórios.' });
  }
  
  try {
    const success = await addDbLead({
      date,
      name: name.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : "",
      operator: operator || "Desconhecido",
      status: status || "⏳ Em Andamento",
      completedHouses: completedHouses || [],
      losses: losses || 0,
      isClosed: isClosed || false,
      indication: indication || ""
    });
    
    if (success) {
      res.status(201).json({ success: true, message: 'Lead criado com sucesso!' });
    } else {
      res.status(500).json({ error: 'Erro ao salvar lead no banco de dados.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao salvar lead.' });
  }
});

// ADMIN: PUT update lead
app.put('/api/admin/leads/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { date, name, whatsapp, operator, status, completedHouses, losses, isClosed, indication } = req.body;
  
  try {
    const success = await updateDbLead(id, {
      date,
      name,
      whatsapp,
      operator,
      status,
      completedHouses,
      losses,
      isClosed,
      indication
    });
    
    if (success) {
      res.json({ success: true, message: 'Lead atualizado!' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar lead no banco.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao editar lead.' });
  }
});

// ADMIN: DELETE lead
app.delete('/api/admin/leads/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await deleteDbLead(id);
    if (success) {
      res.json({ success: true, message: 'Lead excluído.' });
    } else {
      res.status(500).json({ error: 'Erro ao remover lead no banco.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao remover lead.' });
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
