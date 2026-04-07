-- =============================================
-- AffiliationPro D1 Database Schema
-- Cloudflare D1 (SQLite) - 3-Level Affiliate System
-- =============================================

-- Users table (replaces auth.users + profiles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'affiliate' CHECK (role IN ('super_admin', 'admin', 'affiliate')),
  affiliate_code TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  paypal_email TEXT,
  subdomain TEXT UNIQUE,
  admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  webhook_secret TEXT,
  custom_slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  commission_l1 REAL NOT NULL DEFAULT 25.0,
  commission_l2 REAL NOT NULL DEFAULT 10.0,
  commission_l3 REAL NOT NULL DEFAULT 5.0,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_link TEXT NOT NULL UNIQUE,
  parent_affiliate_id TEXT REFERENCES affiliates(id) ON DELETE SET NULL,
  grandparent_affiliate_id TEXT REFERENCES affiliates(id) ON DELETE SET NULL,
  total_earnings REAL NOT NULL DEFAULT 0.0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'paused')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(program_id, user_id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  external_order_id TEXT,
  amount REAL NOT NULL,
  commission_l1 REAL NOT NULL DEFAULT 0.0,
  commission_l2 REAL NOT NULL DEFAULT 0.0,
  commission_l3 REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  customer_email TEXT,
  customer_name TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paypal_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

-- Clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  landing_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id);
CREATE INDEX IF NOT EXISTS idx_programs_owner ON programs(owner_id);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_program ON affiliates(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_parent ON affiliates(parent_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_admin ON payouts(admin_id);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate ON clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
