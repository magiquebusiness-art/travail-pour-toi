-- NyXia MarketPlace — Formation System Schema
-- Run these SQL commands against the D1 database (b35e5c65-a760-4351-bb7f-63444872753e)
-- The `formations` table already exists. Only creating NEW tables below.

-- Formation landing page content (GrapesJS JSON)
CREATE TABLE IF NOT EXISTS formation_pages (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Page de vente',
  html_content TEXT DEFAULT '',
  css_content TEXT DEFAULT '',
  components_json TEXT DEFAULT '[]',
  style_json TEXT DEFAULT '{}',
  is_published INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Formation modules (sections)
CREATE TABLE IF NOT EXISTS formation_modules (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Formation lessons (within modules)
CREATE TABLE IF NOT EXISTS formation_lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES formation_modules(id) ON DELETE CASCADE,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'audio', 'pdf', 'quiz')),
  video_url TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  content_json TEXT DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Student enrollment
CREATE TABLE IF NOT EXISTS formation_enrollments (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'refunded')),
  progress_percent REAL DEFAULT 0,
  completed_lessons TEXT DEFAULT '[]',
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE(formation_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formation_pages_formation ON formation_pages(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_modules_formation ON formation_modules(formation_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_formation_lessons_module ON formation_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_formation_lessons_formation ON formation_lessons(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_user ON formation_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_formation ON formation_enrollments(formation_id);
