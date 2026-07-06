-- SQL Schema for Landing Page & Admin Panel (With Leads Management)
-- Copy and paste this into the Supabase SQL Editor to create or update tables.

-- 1. Create or Update Configs Table (Global settings & Commission rules)
CREATE TABLE IF NOT EXISTS configs (
  id INT PRIMARY KEY DEFAULT 1,
  whatsapp_url TEXT NOT NULL,
  admin_password TEXT NOT NULL,
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
  
  CONSTRAINT single_row CHECK (id = 1) -- Ensures only one config row exists
);

-- Migration: Add new columns if the table already existed without them
ALTER TABLE configs ADD COLUMN IF NOT EXISTS min_houses_for_bonus INT NOT NULL DEFAULT 8;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS op_value_per_cpa NUMERIC NOT NULL DEFAULT 3.12;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS op_bonus NUMERIC NOT NULL DEFAULT 25.00;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS lead_value_per_cpa NUMERIC NOT NULL DEFAULT 6.00;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS lead_bonus NUMERIC NOT NULL DEFAULT 100.00;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS operators TEXT NOT NULL DEFAULT 'Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca';
ALTER TABLE configs ADD COLUMN IF NOT EXISTS statuses TEXT NOT NULL DEFAULT '⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu';

-- Insert Default Config
INSERT INTO configs (
  id, whatsapp_url, admin_password, headline_value,
  min_houses_for_bonus, op_value_per_cpa, op_bonus, lead_value_per_cpa, lead_bonus,
  operators, statuses
)
VALUES (
  1, 
  'https://chat.whatsapp.com/ExemploGrupoBancasGratis', 
  'admin', 
  300,
  8, 3.12, 25.00, 6.00, 100.00,
  'Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca',
  '⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu'
)
ON CONFLICT (id) DO UPDATE SET
  min_houses_for_bonus = EXCLUDED.min_houses_for_bonus,
  op_value_per_cpa = EXCLUDED.op_value_per_cpa,
  op_bonus = EXCLUDED.op_bonus,
  lead_value_per_cpa = EXCLUDED.lead_value_per_cpa,
  lead_bonus = EXCLUDED.lead_bonus,
  operators = EXCLUDED.operators,
  statuses = EXCLUDED.statuses;

-- 2. Create Houses Table (Betting sites)
CREATE TABLE IF NOT EXISTS houses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔘',
  color TEXT NOT NULL DEFAULT '#00ff66',
  value NUMERIC NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Houses
INSERT INTO houses (id, name, emoji, color, value, active)
VALUES 
  ('1', 'SUPERBET', '🔘', '#f15a24', 50, TRUE),
  ('2', 'SPORTINGBET', '🔴', '#0055a5', 50, TRUE),
  ('3', 'Betboom', '💥', '#ffdd00', 60, TRUE),
  ('4', 'Donald Bet', '🦆', '#ff9900', 50, TRUE),
  ('5', 'BETBET', '🟣', '#8a2be2', 70, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT,
  whatsapp TEXT,
  operator TEXT,
  status TEXT,
  completed_houses JSONB DEFAULT '[]'::jsonb, -- Array of house names or IDs that this lead completed
  losses NUMERIC DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  indication TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
