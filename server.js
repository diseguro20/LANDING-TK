const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

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
        users: [
          { id: 1, username: "admin", password: "admin" }
        ],
        configs: [
          {
            user_id: 1,
            whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
            headlineValue: 300,
            minHousesForBonus: 8,
            opValuePerCpa: 3.12,
            opBonus: 25.00,
            leadValuePerCpa: 6.00,
            leadBonus: 100.00,
            operators: ["Takesh", "SK", "Deio", "TKAY", "Tito", "JEAN", "kaio", "thales", "marmelow", "maca"],
            statuses: ["⏳ Em Andamento", "⏸️ Aguardando Lead", "✅ Concluído", "❌ Desistiu / Sumiu", "🚫 Golpe / Erro", "💢 Saque Não Caiu"]
          }
        ],
        houses: [
          { "id": "1", "user_id": 1, "name": "SUPERBET", "emoji": "🔘", "color": "#f15a24", "value": 50, "active": true },
          { "id": "2", "user_id": 1, "name": "SPORTINGBET", "emoji": "🔴", "color": "#0055a5", "value": 50, "active": true },
          { "id": "3", "user_id": 1, "name": "Betboom", "emoji": "💥", "color": "#ffdd00", "value": 60, "active": true },
          { "id": "4", "user_id": 1, "name": "Donald Bet", "emoji": "🦆", "color": "#ff9900", "value": 50, "active": true },
          { "id": "5", "user_id": 1, "name": "BETBET", "emoji": "🟣", "color": "#8a2be2", "value": 70, "active": true }
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
    return { users: [], configs: [], houses: [], leads: [] };
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
// DATABASE MIGRATIONS (Auto-run on startup)
// -------------------------------------------------------------
async function runDbMigrations() {
  if (!isSupabaseConfigured) {
    console.log("Database: Skipping startup migrations (Development Mode).");
    return;
  }
  
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    console.log("Database: Warning! SUPABASE_DB_PASSWORD environment variable not set. Startup migrations skipped.");
    return;
  }
  
  let projectRef = '';
  try {
    const urlObj = new URL(supabaseUrl);
    projectRef = urlObj.hostname.split('.')[0];
  } catch(e) {
    console.error("Database: Could not parse project reference from SUPABASE_URL:", e);
    return;
  }
  
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log(`Database: Connecting directly to run startup migrations...`);
    await client.connect();
    
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.log("Database: Warning! schema.sql not found at project root. Skipping migrations.");
      await client.end();
      return;
    }
    
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    const statements = sqlScript.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Database: Running DDL script (${statements.length} statements)...`);
    let successCount = 0;
    
    for (const stmt of statements) {
      if (stmt.startsWith('--') && !stmt.includes('\n')) continue;
      try {
        await client.query(stmt);
        successCount++;
      } catch (err) {
        // Statements like ALTER TABLE or ADD COLUMN fail safely if already applied.
        // We catch them and keep running the next queries.
      }
    }
    
    console.log(`Database: Startup migrations finished. Applied ${successCount} statements successfully.`);
    await client.end();
  } catch (err) {
    console.log("Database Warning: Could not run startup migrations directly (usually due to local network/IPv6 block). If in production on Vercel, ensure SUPABASE_DB_PASSWORD is set in Vercel.");
    console.log(`Database Warning Details: ${err.message}`);
    try { await client.end(); } catch(e){}
  }
}

// -------------------------------------------------------------
// ASYNC DATABASE LAYER (Multi-Tenant Support)
// -------------------------------------------------------------

async function getUserByUsername(username) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    return data;
  } else {
    const localData = readLocalDataFile();
    return (localData.users || []).find(u => u.username === username.toLowerCase());
  }
}

async function getUserById(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  } else {
    const localData = readLocalDataFile();
    return (localData.users || []).find(u => u.id === id);
  }
}

async function getAllUsersList() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .order('id', { ascending: true });
    return data || [];
  } else {
    const localData = readLocalDataFile();
    return (localData.users || []).map(u => ({ id: u.id, username: u.username }));
  }
}

async function createDbUser(username, password) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .insert({ username: username.toLowerCase(), password })
      .select()
      .single();
    if (error) {
      console.error("Supabase user insert error:", error);
      return null;
    }
    return data;
  } else {
    const localData = readLocalDataFile();
    if (!localData.users) localData.users = [];
    const newUserId = localData.users.length > 0 ? Math.max(...localData.users.map(u => u.id)) + 1 : 1;
    const newUser = { id: newUserId, username: username.toLowerCase(), password };
    localData.users.push(newUser);
    writeLocalDataFile(localData);
    return newUser;
  }
}

async function deleteDbUser(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    return !error;
  } else {
    const localData = readLocalDataFile();
    localData.users = (localData.users || []).filter(u => u.id !== id);
    localData.configs = (localData.configs || []).filter(c => c.user_id !== id);
    localData.houses = (localData.houses || []).filter(h => h.user_id !== id);
    localData.leads = (localData.leads || []).filter(l => l.user_id !== id);
    return writeLocalDataFile(localData);
  }
}

async function getDbConfig(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) {
      return {
        whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
        minHousesForBonus: 8,
        opValuePerCpa: 3.12,
        opBonus: 25.00,
        leadValuePerCpa: 6.00,
        leadBonus: 100.00,
        operators: "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca",
        statuses: "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu",
        headlineValue: 300
      };
    }
    return {
      whatsappUrl: data.whatsapp_url,
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
    const config = (localData.configs || []).find(c => c.user_id === userId);
    if (!config) {
      return {
        whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
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
      whatsappUrl: config.whatsappUrl,
      headlineValue: config.headlineValue || 300,
      minHousesForBonus: config.minHousesForBonus || 8,
      opValuePerCpa: config.opValuePerCpa || 3.12,
      opBonus: config.opBonus || 25.00,
      leadValuePerCpa: config.leadValuePerCpa || 6.00,
      leadBonus: config.leadBonus || 100.00,
      operators: Array.isArray(config.operators) ? config.operators.join(", ") : (config.operators || "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca"),
      statuses: Array.isArray(config.statuses) ? config.statuses.join(", ") : (config.statuses || "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu")
    };
  }
}

async function getDbHouses(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) return [];
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
    return (localData.houses || []).filter(h => h.user_id === userId);
  }
}

async function saveDbConfig(userId, payload) {
  if (isSupabaseConfigured) {
    const updates = { user_id: userId };
    if (payload.whatsappUrl !== undefined) updates.whatsapp_url = payload.whatsappUrl;
    if (payload.headlineValue !== undefined) updates.headline_value = Number(payload.headlineValue);
    if (payload.minHousesForBonus !== undefined) updates.min_houses_for_bonus = Number(payload.minHousesForBonus);
    if (payload.opValuePerCpa !== undefined) updates.op_value_per_cpa = Number(payload.opValuePerCpa);
    if (payload.opBonus !== undefined) updates.op_bonus = Number(payload.opBonus);
    if (payload.leadValuePerCpa !== undefined) updates.lead_value_per_cpa = Number(payload.leadValuePerCpa);
    if (payload.leadBonus !== undefined) updates.lead_bonus = Number(payload.leadBonus);
    if (payload.operators !== undefined) updates.operators = payload.operators;
    if (payload.statuses !== undefined) updates.statuses = payload.statuses;

    const { data } = await supabase.from('configs').select('user_id').eq('user_id', userId).maybeSingle();
    
    let error;
    if (data) {
      const res = await supabase.from('configs').update(updates).eq('user_id', userId);
      error = res.error;
    } else {
      const res = await supabase.from('configs').insert(updates);
      error = res.error;
    }
    
    if (error) {
      console.error("Supabase config update error:", error);
      return false;
    }
    return true;
  } else {
    const localData = readLocalDataFile();
    if (!localData.configs) localData.configs = [];
    
    let idx = localData.configs.findIndex(c => c.user_id === userId);
    if (idx === -1) {
      localData.configs.push({ user_id: userId });
      idx = localData.configs.length - 1;
    }
    
    if (payload.whatsappUrl !== undefined) localData.configs[idx].whatsappUrl = payload.whatsappUrl;
    if (payload.headlineValue !== undefined) localData.configs[idx].headlineValue = Number(payload.headlineValue);
    if (payload.minHousesForBonus !== undefined) localData.configs[idx].minHousesForBonus = Number(payload.minHousesForBonus);
    if (payload.opValuePerCpa !== undefined) localData.configs[idx].opValuePerCpa = Number(payload.opValuePerCpa);
    if (payload.opBonus !== undefined) localData.configs[idx].opBonus = Number(payload.opBonus);
    if (payload.leadValuePerCpa !== undefined) localData.configs[idx].leadValuePerCpa = Number(payload.leadValuePerCpa);
    if (payload.leadBonus !== undefined) localData.configs[idx].leadBonus = Number(payload.leadBonus);
    
    if (payload.operators !== undefined) {
      localData.configs[idx].operators = payload.operators.split(",").map(s => s.trim());
    }
    if (payload.statuses !== undefined) {
      localData.configs[idx].statuses = payload.statuses.split(",").map(s => s.trim());
    }
    
    return writeLocalDataFile(localData);
  }
}

async function addDbHouse(userId, house) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('houses')
      .insert({
        id: house.id,
        user_id: userId,
        name: house.name,
        emoji: house.emoji,
        color: house.color,
        value: house.value,
        active: house.active
      });
    return !error;
  } else {
    const localData = readLocalDataFile();
    if (!localData.houses) localData.houses = [];
    localData.houses.push({
      id: house.id,
      user_id: userId,
      name: house.name,
      emoji: house.emoji,
      color: house.color,
      value: house.value,
      active: house.active
    });
    return writeLocalDataFile(localData);
  }
}

async function updateDbHouse(userId, id, updates) {
  if (isSupabaseConfigured) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.value !== undefined) dbUpdates.value = Number(updates.value);
    if (updates.active !== undefined) dbUpdates.active = updates.active;

    const { error } = await supabase
      .from('houses')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  } else {
    const localData = readLocalDataFile();
    const idx = localData.houses.findIndex(h => h.id === id && h.user_id === userId);
    if (idx === -1) return false;
    
    if (updates.name !== undefined) localData.houses[idx].name = updates.name;
    if (updates.emoji !== undefined) localData.houses[idx].emoji = updates.emoji;
    if (updates.color !== undefined) localData.houses[idx].color = updates.color;
    if (updates.value !== undefined) localData.houses[idx].value = Number(updates.value);
    if (updates.active !== undefined) localData.houses[idx].active = updates.active;
    
    return writeLocalDataFile(localData);
  }
}

async function deleteDbHouse(userId, id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('houses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  } else {
    const localData = readLocalDataFile();
    const filtered = (localData.houses || []).filter(h => !(h.id === id && h.user_id === userId));
    if (localData.houses.length === filtered.length) return false;
    localData.houses = filtered;
    return writeLocalDataFile(localData);
  }
}

// -------------------------------------------------------------
// LEADS DATABASE LAYER (With Pagination & Multi-Tenant)
// -------------------------------------------------------------
async function getDbLeads(userId, filters = {}, pagination = {}) {
  const { search, operator, status, isClosed } = filters;
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;
  
  if (isSupabaseConfigured) {
    let baseQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (operator) baseQuery = baseQuery.eq('operator', operator);
    if (status) baseQuery = baseQuery.eq('status', status);
    if (isClosed !== undefined && isClosed !== '') {
      baseQuery = baseQuery.eq('is_closed', isClosed === 'true');
    }
    if (search) {
      baseQuery = baseQuery.or(`name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }
    
    const countRes = await baseQuery;
    const totalCount = countRes.count || 0;

    let query = supabase.from('leads').select('*').eq('user_id', userId);
    if (operator) query = query.eq('operator', operator);
    if (status) query = query.eq('status', status);
    if (isClosed !== undefined && isClosed !== '') {
      query = query.eq('is_closed', isClosed === 'true');
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }
    
    query = query
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) {
      console.error("Supabase leads fetch error:", error);
      return { leads: [], totalCount: 0 };
    }
    
    const mapped = data.map(l => ({
      id: l.id,
      date: l.date,
      name: l.name,
      whatsapp: l.whatsapp,
      operator: l.operator,
      status: l.status,
      completedHouses: l.completed_houses || [],
      losses: Number(l.losses || 0),
      isClosed: l.is_closed,
      paymentStatus: l.payment_status || "Aguardando",
      indication: l.indication || ""
    }));

    return { leads: mapped, totalCount };
  } else {
    const localData = readLocalDataFile();
    let filtered = (localData.leads || []).filter(l => l.user_id === userId);
    
    if (operator) {
      filtered = filtered.filter(l => l.operator === operator);
    }
    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (isClosed !== undefined && isClosed !== '') {
      const boolClosed = isClosed === 'true';
      filtered = filtered.filter(l => (l.isClosed || l.is_closed) === boolClosed);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(l => 
        (l.name && l.name.toLowerCase().includes(term)) || 
        (l.whatsapp && l.whatsapp.includes(term))
      );
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    const mapped = paginated.map(l => ({
      id: l.id,
      date: l.date,
      name: l.name,
      whatsapp: l.whatsapp,
      operator: l.operator,
      status: l.status,
      completedHouses: l.completedHouses || l.completed_houses || [],
      losses: Number(l.losses || 0),
      isClosed: l.isClosed !== undefined ? l.isClosed : l.is_closed,
      paymentStatus: l.paymentStatus || l.payment_status || "Aguardando",
      indication: l.indication || ""
    }));

    return { leads: mapped, totalCount };
  }
}

async function getDbLeadsMetrics(userId, filters = {}) {
  const { search, operator, status, isClosed } = filters;
  
  if (isSupabaseConfigured) {
    let query = supabase.from('leads').select('completed_houses, losses').eq('user_id', userId);
    if (operator) query = query.eq('operator', operator);
    if (status) query = query.eq('status', status);
    if (isClosed !== undefined && isClosed !== '') {
      query = query.eq('is_closed', isClosed === 'true');
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) return { totalLeads: 0, totalCpas: 0, totalLosses: 0, cpaCounts: [] };
    
    const cpaCounts = data.map(l => (l.completed_houses || []).length);
    const totalLosses = data.reduce((acc, l) => acc + Number(l.losses || 0), 0);
    
    return {
      totalLeads: data.length,
      totalCpas: cpaCounts.reduce((a, b) => a + b, 0),
      totalLosses,
      cpaCounts
    };
  } else {
    const { leads } = await getDbLeads(userId, filters, { page: 1, limit: 1000000 });
    const cpaCounts = leads.map(l => l.completedHouses.length);
    const totalLosses = leads.reduce((acc, l) => acc + l.losses, 0);
    return {
      totalLeads: leads.length,
      totalCpas: cpaCounts.reduce((a, b) => a + b, 0),
      totalLosses,
      cpaCounts
    };
  }
}

async function addDbLead(userId, lead) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('leads')
      .insert({
        user_id: userId,
        date: lead.date,
        name: lead.name,
        whatsapp: lead.whatsapp,
        operator: lead.operator,
        status: lead.status,
        completed_houses: lead.completedHouses,
        losses: Number(lead.losses || 0),
        is_closed: lead.isClosed || false,
        payment_status: lead.paymentStatus || "Aguardando",
        indication: lead.indication || ""
      });
    return !error;
  } else {
    const localData = readLocalDataFile();
    if (!localData.leads) localData.leads = [];
    
    const newLead = {
      id: Date.now(),
      user_id: userId,
      date: lead.date,
      name: lead.name,
      whatsapp: lead.whatsapp,
      operator: lead.operator,
      status: lead.status,
      completedHouses: lead.completedHouses || [],
      losses: Number(lead.losses || 0),
      isClosed: lead.isClosed || false,
      paymentStatus: lead.paymentStatus || "Aguardando",
      indication: lead.indication || ""
    };
    
    localData.leads.push(newLead);
    return writeLocalDataFile(localData);
  }
}

async function updateDbLead(userId, id, updates) {
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
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.indication !== undefined) dbUpdates.indication = updates.indication;

    const { error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  } else {
    const localData = readLocalDataFile();
    const idx = localData.leads.findIndex(l => String(l.id) === String(id) && l.user_id === userId);
    if (idx === -1) return false;
    
    if (updates.date !== undefined) localData.leads[idx].date = updates.date;
    if (updates.name !== undefined) localData.leads[idx].name = updates.name;
    if (updates.whatsapp !== undefined) localData.leads[idx].whatsapp = updates.whatsapp;
    if (updates.operator !== undefined) localData.leads[idx].operator = updates.operator;
    if (updates.status !== undefined) localData.leads[idx].status = updates.status;
    if (updates.completedHouses !== undefined) localData.leads[idx].completedHouses = updates.completedHouses;
    if (updates.losses !== undefined) localData.leads[idx].losses = Number(updates.losses);
    if (updates.isClosed !== undefined) localData.leads[idx].isClosed = updates.isClosed;
    if (updates.paymentStatus !== undefined) localData.leads[idx].paymentStatus = updates.paymentStatus;
    if (updates.indication !== undefined) localData.leads[idx].indication = updates.indication;
    
    return writeLocalDataFile(localData);
  }
}

async function deleteDbLead(userId, id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  } else {
    const localData = readLocalDataFile();
    const filtered = (localData.leads || []).filter(l => !(String(l.id) === String(id) && l.user_id === userId));
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
  const parts = token.split(':');
  if (parts.length < 2) {
    return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
  }

  const userId = Number(parts[0]);
  const username = parts[1];

  try {
    const user = await getUserById(userId);
    if (!user || user.username !== username) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    
    req.userId = user.id;
    req.username = user.username;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao validar autenticação.' });
  }
}

// -------------------------------------------------------------
// EXPRESS ROUTES
// -------------------------------------------------------------

// PUBLIC: Get public config and active houses (Supports ?ref=username)
app.get('/api/data', async (req, res) => {
  const refUsername = req.query.ref;
  let targetUserId = 1; // Default to main admin (id 1)
  
  try {
    if (refUsername) {
      const tenant = await getUserByUsername(refUsername);
      if (tenant) {
        targetUserId = tenant.id;
      }
    }
    
    const config = await getDbConfig(targetUserId);
    const houses = await getDbHouses(targetUserId);
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

// PUBLIC: Multi-tenant login check
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  
  try {
    const user = await getUserByUsername(username);
    if (user && user.password === password) {
      res.json({ success: true, token: `${user.id}:${user.username}` });
    } else {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar login.' });
  }
});

// PUBLIC: Register a new account
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const normalizedUser = username.trim().toLowerCase();
  if (normalizedUser === 'admin') {
    return res.status(400).json({ error: 'O nome de usuário "admin" é reservado.' });
  }
  
  if (normalizedUser.length < 3) {
    return res.status(400).json({ error: 'O usuário deve ter pelo menos 3 caracteres.' });
  }

  try {
    const existing = await getUserByUsername(normalizedUser);
    if (existing) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const newUser = await createDbUser(normalizedUser, password.trim());
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar a conta.' });
    }

    await saveDbConfig(newUser.id, {
      whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
      headlineValue: 300,
      minHousesForBonus: 8,
      opValuePerCpa: 3.12,
      opBonus: 25.00,
      leadValuePerCpa: 6.00,
      leadBonus: 100.00,
      operators: "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca",
      statuses: "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu"
    });

    const defaultHouses = [
      { id: "1", name: "SUPERBET", emoji: "🔘", color: "#f15a24", value: 50, active: true },
      { id: "2", name: "SPORTINGBET", emoji: "🔴", color: "#0055a5", value: 50, active: true },
      { id: "3", name: "Betboom", emoji: "💥", color: "#ffdd00", value: 60, active: true },
      { id: "4", name: "Donald Bet", emoji: "🦆", color: "#ff9900", value: 50, active: true },
      { id: "5", name: "BETBET", emoji: "🟣", color: "#8a2be2", value: 70, active: true }
    ];

    for (const h of defaultHouses) {
      await addDbHouse(newUser.id, h);
    }

    res.status(201).json({ success: true, token: `${newUser.id}:${newUser.username}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao criar conta.' });
  }
});


// ADMIN: Get dashboard configurations for the logged-in user
app.get('/api/admin/data', authMiddleware, async (req, res) => {
  try {
    const config = await getDbConfig(req.userId);
    const houses = await getDbHouses(req.userId);
    
    res.json({
      whatsappUrl: config.whatsappUrl,
      headlineValue: config.headlineValue,
      minHousesForBonus: config.minHousesForBonus,
      opValuePerCpa: config.opValuePerCpa,
      opBonus: config.opBonus,
      leadValuePerCpa: config.leadValuePerCpa,
      leadBonus: config.leadBonus,
      operators: config.operators,
      statuses: config.statuses,
      houses: houses,
      username: req.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do admin.' });
  }
});

// ADMIN: Save global configurations
app.post('/api/admin/config', authMiddleware, async (req, res) => {
  const { 
    whatsappUrl, headlineValue,
    minHousesForBonus, opValuePerCpa, opBonus,
    leadValuePerCpa, leadBonus, operators, statuses,
    adminPassword
  } = req.body;
  
  if (!whatsappUrl) {
    return res.status(400).json({ error: 'O link do WhatsApp é obrigatório.' });
  }
  
  try {
    const success = await saveDbConfig(req.userId, {
      whatsappUrl, headlineValue,
      minHousesForBonus, opValuePerCpa, opBonus,
      leadValuePerCpa, leadBonus, operators, statuses
    });
    
    if (success) {
      if (adminPassword && adminPassword.trim() !== '') {
        if (isSupabaseConfigured) {
          await supabase.from('users').update({ password: adminPassword.trim() }).eq('id', req.userId);
        } else {
          const localData = readLocalDataFile();
          const uIdx = localData.users.findIndex(u => u.id === req.userId);
          if (uIdx !== -1) {
            localData.users[uIdx].password = adminPassword.trim();
            writeLocalDataFile(localData);
          }
        }
      }
      res.json({ success: true, message: 'Configurações salvas!' });
    } else {
      res.status(500).json({ error: 'Erro ao salvar as configurações.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao salvar configurações.' });
  }
});

// ADMIN: Houses endpoints (Multi-Tenant)
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
    const success = await addDbHouse(req.userId, newHouse);
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
    const success = await updateDbHouse(req.userId, id, { name, emoji, color, value, active });
    if (success) res.json({ success: true });
    else res.status(500).json({ error: 'Erro ao atualizar.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.delete('/api/admin/houses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await deleteDbHouse(req.userId, id);
    if (success) res.json({ success: true });
    else res.status(500).json({ error: 'Erro ao excluir.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// -------------------------------------------------------------
// LEADS API ENDPOINTS (With Pagination & Metrics)
// -------------------------------------------------------------

// ADMIN: GET all leads with filters & pagination
app.get('/api/admin/leads', authMiddleware, async (req, res) => {
  const { search, operator, status, isClosed } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  
  try {
    const { leads, totalCount } = await getDbLeads(
      req.userId, 
      { search, operator, status, isClosed },
      { page, limit }
    );
    
    const metrics = await getDbLeadsMetrics(req.userId, { search, operator, status, isClosed });
    
    res.json({
      leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      metrics
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter listagem de leads.' });
  }
});

// ADMIN: POST create new lead
app.post('/api/admin/leads', authMiddleware, async (req, res) => {
  const { date, name, whatsapp, operator, status, completedHouses, losses, isClosed, paymentStatus, indication } = req.body;
  
  if (!date || !name) {
    return res.status(400).json({ error: 'Data e Nome são obrigatórios.' });
  }
  
  try {
    const success = await addDbLead(req.userId, {
      date,
      name: name.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : "",
      operator: operator || "Desconhecido",
      status: status || "⏳ Em Andamento",
      completedHouses: completedHouses || [],
      losses: losses || 0,
      isClosed: isClosed || false,
      paymentStatus: paymentStatus || "Aguardando",
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
  const { date, name, whatsapp, operator, status, completedHouses, losses, isClosed, paymentStatus, indication } = req.body;
  
  try {
    const success = await updateDbLead(req.userId, id, {
      date,
      name,
      whatsapp,
      operator,
      status,
      completedHouses,
      losses,
      isClosed,
      paymentStatus,
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
    const success = await deleteDbLead(req.userId, id);
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

// -------------------------------------------------------------
// USER MANAGEMENT ENDPOINTS (Superadmin Only)
// -------------------------------------------------------------

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.username !== 'admin') {
    return res.status(403).json({ error: 'Apenas a conta superadmin pode gerenciar outras contas.' });
  }
  
  try {
    const users = await getAllUsersList();
    const filteredUsers = users.filter(u => u.username !== 'admin');
    res.json(filteredUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar usuários.' });
  }
});

app.post('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.username !== 'admin') {
    return res.status(403).json({ error: 'Apenas a conta superadmin pode gerenciar outras contas.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const newUser = await createDbUser(username, password);
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar o usuário.' });
    }

    await saveDbConfig(newUser.id, {
      whatsappUrl: "https://chat.whatsapp.com/ExemploGrupoBancasGratis",
      headlineValue: 300,
      minHousesForBonus: 8,
      opValuePerCpa: 3.12,
      opBonus: 25.00,
      leadValuePerCpa: 6.00,
      leadBonus: 100.00,
      operators: "Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca",
      statuses: "⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu"
    });

    const defaultHouses = [
      { id: "1", name: "SUPERBET", emoji: "🔘", color: "#f15a24", value: 50, active: true },
      { id: "2", name: "SPORTINGBET", emoji: "🔴", color: "#0055a5", value: 50, active: true },
      { id: "3", name: "Betboom", emoji: "💥", color: "#ffdd00", value: 60, active: true },
      { id: "4", name: "Donald Bet", emoji: "🦆", color: "#ff9900", value: 50, active: true },
      { id: "5", name: "BETBET", emoji: "🟣", color: "#8a2be2", value: 70, active: true }
    ];

    for (const h of defaultHouses) {
      await addDbHouse(newUser.id, h);
    }

    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao criar usuário.' });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  if (req.username !== 'admin') {
    return res.status(403).json({ error: 'Apenas a conta superadmin pode gerenciar outras contas.' });
  }

  const userId = Number(req.params.id);
  if (userId === 1 || userId === req.userId) {
    return res.status(400).json({ error: 'Não é possível excluir a conta superadmin.' });
  }

  try {
    const success = await deleteDbUser(userId);
    if (success) {
      res.json({ success: true, message: 'Usuário e todas as suas configurações/leads foram excluídos.' });
    } else {
      res.status(500).json({ error: 'Erro ao excluir o usuário.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao excluir usuário.' });
  }
});

// Catch-all route to serve index.html for unknown frontend routes
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local port execution & migration triggers
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Landing Page: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
    
    // Run migrations automatically on local server startup
    await runDbMigrations();
  });
} else {
  // On Vercel startup, execute database schema migrations automatically
  runDbMigrations().catch(err => console.error("Vercel startup migration failed:", err));
}

module.exports = app;
