-- SQL Schema for Landing Page & Admin Panel (With Multi-Tenant Support)
-- Copy and paste this into the Supabase SQL Editor to create tables.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Configs Table (One configuration row per user)
CREATE TABLE IF NOT EXISTS configs (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/ExemploGrupoBancasGratis',
  headline_value NUMERIC NOT NULL DEFAULT 300,
  
  -- Commission & Bonus rules
  min_houses_for_bonus INT NOT NULL DEFAULT 8,
  op_value_per_cpa NUMERIC NOT NULL DEFAULT 3.12,
  op_bonus NUMERIC NOT NULL DEFAULT 25.00,
  lead_value_per_cpa NUMERIC NOT NULL DEFAULT 6.00,
  lead_bonus NUMERIC NOT NULL DEFAULT 100.00,
  
  -- Dynamic Dropdown Options
  operators TEXT NOT NULL DEFAULT 'Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca',
  statuses TEXT NOT NULL DEFAULT '⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Houses Table (Betting sites per user)
CREATE TABLE IF NOT EXISTS houses (
  id TEXT NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔘',
  color TEXT NOT NULL DEFAULT '#00ff66',
  value NUMERIC NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 4. Create Leads Table (Leads per user)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT,
  whatsapp TEXT,
  operator TEXT,
  status TEXT,
  completed_houses JSONB DEFAULT '[]'::jsonb, -- Array of house names that this lead completed
  losses NUMERIC DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  indication TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
