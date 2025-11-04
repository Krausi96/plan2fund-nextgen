-- User Authentication & Profile Tables
-- Run this in your Neon database to create user tables

-- Users table with password hashing
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- bcrypt hash, nullable for social login
  name VARCHAR(255),
  segment VARCHAR(50) DEFAULT 'B2C_FOUNDER',
  program_type VARCHAR(50) DEFAULT 'GRANT',
  industry VARCHAR(50) DEFAULT 'GENERAL',
  language VARCHAR(10) DEFAULT 'EN',
  payer_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
  experience VARCHAR(50) DEFAULT 'NEWBIE',
  gdpr_consent BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth providers (for social login)
CREATE TABLE IF NOT EXISTS oauth_providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);

-- User sessions (for secure session management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- User plans (migrate from localStorage)
CREATE TABLE IF NOT EXISTS user_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(255), -- For multi-user/consultant workspaces
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'in_progress', 'completed'
  program_type VARCHAR(100),
  progress INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  plan_data JSONB, -- Store full plan document
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recommendations (migrate from localStorage)
CREATE TABLE IF NOT EXISTS user_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(255), -- For multi-user/consultant workspaces
  session_id VARCHAR(255),
  answers JSONB, -- Store wizard answers
  recommendations JSONB, -- Store full recommendations array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON user_recommendations(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

