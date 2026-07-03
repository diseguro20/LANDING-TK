-- SQL Schema for Landing Page & Admin Panel
-- Copy and paste this into the Supabase SQL Editor to create tables.

-- 1. Create Configs Table (Global settings)
CREATE TABLE IF NOT EXISTS configs (
  id INT PRIMARY KEY DEFAULT 1,
  whatsapp_url TEXT NOT NULL,
  admin_password TEXT NOT NULL,
  headline_value NUMERIC NOT NULL DEFAULT 300,
  CONSTRAINT single_row CHECK (id = 1) -- Ensures only one config row exists
);

-- Insert Default Config
INSERT INTO configs (id, whatsapp_url, admin_password, headline_value)
VALUES (1, 'https://chat.whatsapp.com/ExemploGrupoBancasGratis', 'admin', 300)
ON CONFLICT (id) DO NOTHING;

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
