-- ════════════════════════════════════════════════════════════════════════════════
-- NYXIA MARKETPLACE — Stripe Connect Schema
-- Tables pour le système de paiement SaaS (modèle Systeme.io / Kajabi)
-- ════════════════════════════════════════════════════════════════════════════════

-- Comptes Stripe Connect de chaque client (admin) de la plateforme
-- Chaque client a un compte Express Stripe lié pour encaisser ses ventes
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'express',
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  payouts_enabled INTEGER NOT NULL DEFAULT 0,
  charges_enabled INTEGER NOT NULL DEFAULT 0,
  details_submitted INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  country TEXT DEFAULT 'CA',
  business_name TEXT,
  business_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Historique des paiements
-- Chaque achat de formation par un étudiant crée une ligne ici
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_name TEXT,
  student_user_id TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  platform_fee_amount INTEGER NOT NULL DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  refunded_at TEXT
);

-- Inscriptions d'étudiants (activation de la table existante)
-- Liée aux paiements Stripe : un paiement réussi = une inscription créée
CREATE TABLE IF NOT EXISTS formation_enrollments (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL,
  user_id TEXT,
  student_email TEXT NOT NULL,
  student_name TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  completed_lessons TEXT NOT NULL DEFAULT '[]',
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  last_accessed_at TEXT,
  certificate_issued INTEGER NOT NULL DEFAULT 0
);

-- Configuration de la plateforme (frais, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  stripe_platform_id TEXT NOT NULL,
  platform_fee_percent REAL NOT NULL DEFAULT 5.0,
  platform_fee_fixed INTEGER NOT NULL DEFAULT 50,
  currency TEXT NOT NULL DEFAULT 'cad',
  support_email TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insérer la config par défaut si elle n'existe pas
INSERT OR IGNORE INTO platform_settings (id, stripe_platform_id, platform_fee_percent, platform_fee_fixed, currency, support_email)
VALUES (1, 'acct_PLATFORM_ID', 5.0, 50, 'cad', 'support@travail-pour-toi.com');
