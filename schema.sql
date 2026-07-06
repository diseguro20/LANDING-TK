-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert main superadmin user
INSERT INTO users (id, username, password)
VALUES (1, 'admin', 'Diego2001*')
ON CONFLICT (id) DO NOTHING;

-- 3. Migrate configs table to support multi-tenant
ALTER TABLE configs ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
UPDATE configs SET user_id = 1 WHERE user_id IS NULL;

-- Remove old primary key and constraints
ALTER TABLE configs DROP CONSTRAINT IF EXISTS configs_pkey;
ALTER TABLE configs DROP CONSTRAINT IF EXISTS single_row;
ALTER TABLE configs ADD PRIMARY KEY (user_id);
ALTER TABLE configs DROP COLUMN IF EXISTS id;

-- Create configs table if it didn't exist
CREATE TABLE IF NOT EXISTS configs (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/ExemploGrupoBancasGratis',
  headline_value NUMERIC NOT NULL DEFAULT 300,
  min_houses_for_bonus INT NOT NULL DEFAULT 8,
  op_value_per_cpa NUMERIC NOT NULL DEFAULT 3.12,
  op_bonus NUMERIC NOT NULL DEFAULT 25.00,
  lead_value_per_cpa NUMERIC NOT NULL DEFAULT 6.00,
  lead_bonus NUMERIC NOT NULL DEFAULT 100.00,
  operators TEXT NOT NULL DEFAULT 'Takesh, SK, Deio, TKAY, Tito, JEAN, kaio, thales, marmelow, maca',
  statuses TEXT NOT NULL DEFAULT '⏳ Em Andamento, ⏸️ Aguardando Lead, ✅ Concluído, ❌ Desistiu / Sumiu, 🚫 Golpe / Erro, 💢 Saque Não Caiu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Migrate houses table to support multi-tenant
ALTER TABLE houses ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
UPDATE houses SET user_id = 1 WHERE user_id IS NULL;
ALTER TABLE houses DROP CONSTRAINT IF EXISTS houses_pkey;
ALTER TABLE houses ADD PRIMARY KEY (id, user_id);

-- Create houses table if it didn't exist
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

-- 5. Migrate leads table to support multi-tenant
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
UPDATE leads SET user_id = 1 WHERE user_id IS NULL;

-- Create leads table if it didn't exist
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT,
  whatsapp TEXT,
  operator TEXT,
  status TEXT,
  completed_houses JSONB DEFAULT '[]'::jsonb,
  losses NUMERIC DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  indication TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
