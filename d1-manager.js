// ============================================================
//  D1 MANAGER — NyXia Phase 7
//  Cloudflare D1 (SQLite serverless)
//
//  Capacités :
//  • Créer / modifier des tables (migrations)
//  • Requêtes SELECT / INSERT / UPDATE / DELETE
//  • Migrations versionnées avec journal
//  • Schémas prêts pour AffiliationPro & PublicationCashflow
// ============================================================

// ══════════════════════════════════════════════════════════
//  EXÉCUTION DE REQUÊTES
// ══════════════════════════════════════════════════════════

/**
 * Exécute une requête SQL sur une base D1
 * db = env.MON_DB (binding configuré dans wrangler.toml)
 */
export async function d1Query(db, sql, params = []) {
  if (!db) throw new Error("Base D1 non configurée — ajoute le binding dans wrangler.toml");

  try {
    const stmt   = db.prepare(sql);
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return {
      success:  true,
      results:  result.results || [],
      meta:     result.meta    || {},
      count:    result.results?.length || 0,
    };
  } catch(err) {
    return { success: false, error: err.message, sql };
  }
}

/**
 * Exécute plusieurs requêtes en batch (transaction)
 */
export async function d1Batch(db, statements) {
  if (!db) throw new Error("Base D1 non configurée");

  try {
    const stmts  = statements.map(({ sql, params = [] }) =>
      params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql)
    );
    const results = await db.batch(stmts);
    return { success: true, results: results.map(r => ({ count: r.results?.length || 0, meta: r.meta })) };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════
//  MIGRATIONS VERSIONNÉES
// ══════════════════════════════════════════════════════════

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _nyxia_migrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    version     TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    sql         TEXT    NOT NULL,
    applied_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );`;

export async function initMigrationsTable(db) {
  return d1Query(db, MIGRATIONS_TABLE);
}

export async function getAppliedMigrations(db) {
  await initMigrationsTable(db);
  return d1Query(db, "SELECT version, name, applied_at FROM _nyxia_migrations ORDER BY version");
}

export async function applyMigration(db, version, name, sql) {
  await initMigrationsTable(db);

  // Vérifie si déjà appliquée
  const existing = await d1Query(db, "SELECT id FROM _nyxia_migrations WHERE version = ?", [version]);
  if (existing.results?.length > 0) {
    return { success: true, skipped: true, message: `Migration ${version} déjà appliquée` };
  }

  // Applique la migration
  const result = await d1Query(db, sql);
  if (!result.success) return result;

  // Journalise
  await d1Query(db,
    "INSERT INTO _nyxia_migrations (version, name, sql) VALUES (?, ?, ?)",
    [version, name, sql]
  );

  return { success: true, applied: true, message: `Migration ${version} — ${name} appliquée` };
}

// ══════════════════════════════════════════════════════════
//  INTROSPECTION — Lit la structure de la base
// ══════════════════════════════════════════════════════════

export async function listTables(db) {
  const result = await d1Query(db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_nyxia_%' ORDER BY name"
  );
  return result;
}

export async function describeTable(db, tableName) {
  const [cols, count] = await Promise.all([
    d1Query(db, `PRAGMA table_info(${tableName})`),
    d1Query(db, `SELECT COUNT(*) as total FROM ${tableName}`),
  ]);
  return {
    success:  true,
    table:    tableName,
    columns:  cols.results,
    rowCount: count.results?.[0]?.total || 0,
  };
}

// ══════════════════════════════════════════════════════════
//  SCHÉMAS PRÊTS — AffiliationPro & PublicationCashflow
// ══════════════════════════════════════════════════════════

export const SCHEMAS = {

  affiliationpro: {
    description: "Schéma complet AffiliationPro — affiliés, ventes, commissions",
    migrations: [
      {
        version: "001",
        name:    "create_affiliates",
        sql: `CREATE TABLE IF NOT EXISTS affiliates (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          email         TEXT NOT NULL UNIQUE,
          name          TEXT NOT NULL,
          referrer_id   TEXT REFERENCES affiliates(id),
          level         INTEGER NOT NULL DEFAULT 1,
          status        TEXT NOT NULL DEFAULT 'active',
          custom_link   TEXT UNIQUE,
          created_at    TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_affiliates_referrer ON affiliates(referrer_id);
        CREATE INDEX IF NOT EXISTS idx_affiliates_email    ON affiliates(email);`,
      },
      {
        version: "002",
        name:    "create_sales",
        sql: `CREATE TABLE IF NOT EXISTS sales (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          order_id      TEXT NOT NULL UNIQUE,
          affiliate_id  TEXT REFERENCES affiliates(id),
          amount        REAL NOT NULL,
          currency      TEXT NOT NULL DEFAULT 'USD',
          product_name  TEXT,
          customer_email TEXT,
          status        TEXT NOT NULL DEFAULT 'completed',
          source        TEXT DEFAULT 'systemeio',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON sales(affiliate_id);
        CREATE INDEX IF NOT EXISTS idx_sales_order    ON sales(order_id);`,
      },
      {
        version: "003",
        name:    "create_commissions",
        sql: `CREATE TABLE IF NOT EXISTS commissions (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          sale_id       TEXT NOT NULL REFERENCES sales(id),
          affiliate_id  TEXT NOT NULL REFERENCES affiliates(id),
          level         INTEGER NOT NULL CHECK(level IN (1,2,3)),
          rate          REAL NOT NULL,
          amount        REAL NOT NULL,
          status        TEXT NOT NULL DEFAULT 'pending',
          paid_at       TEXT,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
        CREATE INDEX IF NOT EXISTS idx_commissions_sale      ON commissions(sale_id);`,
      },
      {
        version: "004",
        name:    "create_payouts",
        sql: `CREATE TABLE IF NOT EXISTS payouts (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          affiliate_id  TEXT NOT NULL REFERENCES affiliates(id),
          amount        REAL NOT NULL,
          method        TEXT DEFAULT 'paypal',
          reference     TEXT,
          status        TEXT NOT NULL DEFAULT 'pending',
          requested_at  TEXT NOT NULL DEFAULT (datetime('now')),
          paid_at       TEXT
        );`,
      },
    ],
  },

  publicationcashflow: {
    description: "Schéma PublicationCashflow — sites, pages FB, publications, community manager",
    migrations: [
      {
        version: "001",
        name:    "create_users",
        sql: `CREATE TABLE IF NOT EXISTS users (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          email         TEXT NOT NULL UNIQUE,
          name          TEXT,
          plan          TEXT NOT NULL DEFAULT 'free',
          status        TEXT NOT NULL DEFAULT 'active',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );`,
      },
      {
        version: "002",
        name:    "create_sites",
        sql: `CREATE TABLE IF NOT EXISTS sites (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          name          TEXT NOT NULL,
          subdomain     TEXT UNIQUE,
          affiliate_url TEXT,
          template      TEXT DEFAULT 'default',
          status        TEXT NOT NULL DEFAULT 'active',
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);`,
      },
      {
        version: "003",
        name:    "create_facebook_pages",
        sql: `CREATE TABLE IF NOT EXISTS facebook_pages (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          page_id       TEXT NOT NULL,
          page_name     TEXT NOT NULL,
          access_token  TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'active',
          connected_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );`,
      },
      {
        version: "004",
        name:    "create_community_manager",
        sql: `CREATE TABLE IF NOT EXISTS scheduled_posts (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
          user_id       TEXT NOT NULL REFERENCES users(id),
          site_id       TEXT REFERENCES sites(id),
          fb_page_id    TEXT REFERENCES facebook_pages(id),
          content       TEXT NOT NULL,
          image_url     TEXT,
          scheduled_at  TEXT NOT NULL,
          published_at  TEXT,
          status        TEXT NOT NULL DEFAULT 'scheduled',
          day_number    INTEGER,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON scheduled_posts(scheduled_at, status);
        CREATE INDEX IF NOT EXISTS idx_posts_user      ON scheduled_posts(user_id);`,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════
//  GÉNÉRATION DE CODE — Worker avec D1
// ══════════════════════════════════════════════════════════

export function generateD1WorkerCode(options = {}) {
  const { dbBinding = "DB", projectName = "mon-projet" } = options;

  return `// Worker avec accès D1 — ${projectName}
// Généré par NyXia

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Exemple : GET /api/affiliates
    if (url.pathname === "/api/affiliates" && request.method === "GET") {
      const { results } = await env.${dbBinding}
        .prepare("SELECT id, email, name, level, status, created_at FROM affiliates ORDER BY created_at DESC LIMIT 50")
        .all();
      return Response.json({ affiliates: results });
    }

    // Exemple : POST /api/affiliates
    if (url.pathname === "/api/affiliates" && request.method === "POST") {
      const body = await request.json();
      const { email, name, referrer_id } = body;

      const result = await env.${dbBinding}
        .prepare("INSERT INTO affiliates (email, name, referrer_id) VALUES (?, ?, ?) RETURNING *")
        .bind(email, name, referrer_id || null)
        .first();

      return Response.json({ affiliate: result }, { status: 201 });
    }

    return new Response("Not found", { status: 404 });
  },
};`;
}

export function generateWranglerD1Config(dbName, dbId) {
  return `# Ajoute ceci dans ton wrangler.toml

[[d1_databases]]
binding  = "DB"
database_name = "${dbName}"
database_id   = "${dbId || "REMPLACE_PAR_L_ID_D1"}"`;
}
