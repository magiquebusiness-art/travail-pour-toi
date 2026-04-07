# PublicationCashFlow / Affiliate Builder - Full Recovery Report

**Generated**: April 6, 2026  
**Purpose**: Complete infrastructure audit and recovery documentation for the "affiliate-builder" project

---

## CRITICAL FINDING: Token Mismatch

The provided API token (`cfat_2OT60I03PwaOjJUeRFGfNDSBP2uFiwgqIFH46Tcr6eb807f1`) **does NOT have access** to the target account `07468e90032185025d9a0f30d032314a`. All API calls to that account return "Authentication error" (code 10000).

However, the token IS valid for a different account where a closely related project exists:

| Property | Target Account (INACCESSIBLE) | Token's Account (ACCESSIBLE) |
|---|---|---|
| **Account ID** | `07468e90032185025d9a0f30d032314a` | `1b1ae6c18d122d337caab72a45ca1465` |
| **Account Name** | Unknown | `Magiquebusiness@gmail.com's Account` |
| **Account Type** | Unknown | `standard` |
| **Created** | Unknown | `2026-04-04T18:31:06Z` |

**Action Required**: You need an API token that has access to account `07468e90032185025d9a0f30d032314a`. The current token only works on the Magiquebusiness account. Log into Cloudflare dashboard at `https://dash.cloudflare.com/07468e90032185025d9a0f30d032314a` and create a new API token with the appropriate permissions.

---

## What We Found on the Token's Account (1b1ae6c18d122d337caab72a45ca1465)

### 1. Domain / Zone

| Property | Value |
|---|---|
| **Domain** | `travail-pour-toi.com` |
| **Zone ID** | `d545b4ca9730294849690d25b4997233` |
| **Status** | Active |
| **Plan** | Free Website |
| **Original Registrar** | Namecheap, Inc. |
| **Previous DNS** | SiteGround (ns1.siteground.net, ns2.siteground.net) |
| **Current DNS** | Cloudflare (albert.ns.cloudflare.com, nia.ns.cloudflare.com) |
| **Zone Created** | 2026-04-06T18:13:40Z |
| **Zone Activated** | 2026-04-06T18:14:53Z |

---

### 2. Workers (Cloudflare Workers)

#### Worker 1: `ai-affiliate-builder` (PRIMARY APPLICATION)

| Property | Value |
|---|---|
| **Script ID** | `ai-affiliate-builder` |
| **Tag (Version)** | `f2f8a8b84a1e4ce49605b7b1c65de2e6` |
| **Created** | 2026-04-06T18:54:09Z |
| **Last Modified** | 2026-04-06T18:54:17Z |
| **Deployed Via** | `wrangler` |
| **Compatibility Date** | 2024-01-01 |
| **Compatibility Flags** | `nodejs_compat` |
| **Usage Model** | standard |
| **Handlers** | fetch |
| **Has Assets** | Yes |
| **Has Modules** | Yes |

**Routes:**
| Pattern | Script |
|---|---|
| `travail-pour-toi.com/*` | ai-affiliate-builder |
| `www.travail-pour-toi.com/*` | ai-affiliate-builder |

**Bindings:**
| Name | Type | Description |
|---|---|---|
| `ASSETS` | assets | Static assets for the Next.js app |
| `JWT_SECRET` | secret_text | JWT authentication secret |

**No scheduled triggers (crons).**

#### Worker 2: `travail-pour-toi` (STATIC ASSET SERVING)

| Property | Value |
|---|---|
| **Script ID** | `travail-pour-toi` |
| **Tag** | `5c8c581f4b554bed873a837754142dba` |
| **Created** | 2026-04-06T19:11:26Z |
| **Last Modified** | 2026-04-06T19:11:35Z |
| **Deployed Via** | `wrangler` |
| **Compatibility Date** | 2024-01-01 |
| **Usage Model** | standard |
| **Routes** | None (not actively routed) |
| **Bindings** | `JWT_SECRET` (secret_text) |

**Worker Script Content** (complete):
```javascript
var worker_default = {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
```

---

### 3. Application Architecture (from Worker Bundle Analysis)

The `ai-affiliate-builder` worker is a **Next.js application** deployed to Cloudflare using `@cloudflare/next-on-pages`.

**Technology Stack:**
- **Framework**: Next.js (App Router)
- **Deployment**: Originally built via Vercel output format (`.vercel/output/static/_worker.js/index.js`)
- **Runtime**: Cloudflare Workers with `nodejs_compat`
- **Build ID**: `O8nwcvK-ltQUqo7KeF71y`
- **Worker Bundle Size**: ~40KB (server-side rendering runtime only)
- **Environment**: `NODE_ENV=production`

**Application Pages / Routes:**

| Route | Type | Description |
|---|---|---|
| `/` | Page | Main landing page |
| `/admin` | Page | Admin dashboard |
| `/site/[slug]` | Dynamic Page | Individual affiliate site pages |
| `/api` | API Route | Main API endpoint |
| `/api/generate` | API Route | AI site generation |
| `/api/image` | API Route | Image processing/generation |
| `/api/sites` | API Route | Sites CRUD management |

**Static Assets Detected:**
- 2 CSS files: `920ca8457a27250a.css`, `de70bee13400563f.css`
- 6 Font files (woff2): Inter/Geist font family
- JavaScript chunks for all pages
- `logo.svg`, `robots.txt`

---

### 4. D1 Database: `travail-pour-toi-db`

| Property | Value |
|---|---|
| **Database Name** | `travail-pour-toi-db` |
| **UUID** | `b35e5c65-a760-4351-bb7f-63444872753e` |
| **Created** | 2026-04-06T19:32:25Z |
| **Version** | production |
| **File Size** | 180,224 bytes (~176 KB) |
| **Region** | Served from HKG (Hong Kong) |
| **Tables** | 9 (8 business tables + 1 internal) |

#### Complete Database Schema

**Table: `users`**
```sql
CREATE TABLE users (
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
-- Indexes: email, role, affiliate_code, parent_id, admin_id
```

**Table: `programs`**
```sql
CREATE TABLE programs (
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
-- Indexes: owner_id, is_active
```

**Table: `affiliates`**
```sql
CREATE TABLE affiliates (
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
-- Indexes: user_id, program_id, parent_affiliate_id
```

**Table: `clicks`**
```sql
CREATE TABLE clicks (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  landing_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Indexes: affiliate_id
```

**Table: `sales`**
```sql
CREATE TABLE sales (
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
-- Indexes: affiliate_id
```

**Table: `commissions`**
```sql
CREATE TABLE commissions (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Indexes: affiliate_id, status
```

**Table: `payouts`**
```sql
CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paypal_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
-- Indexes: affiliate_id, admin_id
```

**Table: `messages`**
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Indexes: sender_id, recipient_id
```

**Table: `_cf_KV`** (Internal - Next-on-Pages suspense cache)
```sql
CREATE TABLE _cf_KV (key TEXT PRIMARY KEY, value BLOB) WITHOUT ROWID;
```

#### Data Status

**All 8 business tables are EMPTY** (0 rows). The database contains only:
- Schema definitions with full indexes
- Internal `_cf_KV` cache data (~176 KB, not directly queryable)

---

### 5. Storage Services

| Service | Status | Count |
|---|---|---|
| **KV Namespaces** | None | 0 |
| **R2 Buckets** | Not enabled | 0 |
| **Durable Objects** | None | 0 |
| **D1 Databases** | 1 (`travail-pour-toi-db`) | 1 |
| **Pages Projects** | Auth error (cannot access) | Unknown |

---

### 6. Token Permissions

The API token has these verified permissions:

| Permission | Status |
|---|---|
| Workers Scripts (read) | YES |
| Workers Settings (read) | YES |
| Workers Schedules (read) | YES |
| Workers Domains (read) | YES |
| D1 Database (read/query) | YES |
| KV Namespaces (read) | YES |
| R2 Buckets | Not enabled on account |
| Zones (list) | YES |
| DNS Records | NO (auth error) |
| Zone Settings | NO (unauthorized) |
| Pages Projects | NO (auth error) |
| Account Details (target) | NO (unauthorized) |

---

## Recovery Assessment

### What Was Recovered

1. **Full database schema** - Complete SQL DDL for all 8 business tables with indexes
2. **Application architecture** - Next.js App Router with identified pages and API routes
3. **Worker configurations** - Bindings, routes, compatibility settings
4. **Domain configuration** - Zone details, nameservers, registrar info
5. **Technology stack** - Next.js + Cloudflare Workers + D1 + @cloudflare/next-on-pages
6. **Commission structure** - 3-level MLM: 25% / 10% / 5%
7. **Worker runtime code** - Server-side rendering bundle (40KB)

### What Was NOT Recovered

1. **Source code** - The actual Next.js application source (pages, components, API logic) is in static assets we cannot download via this API token
2. **Environment variables** - Only `JWT_SECRET` binding identified; other env vars (API keys, AI service keys, etc.) are secrets we cannot read
3. **DNS records** - Token lacks DNS read permissions
4. **Pages deployment history** - Token lacks Pages API access
5. **Original target account data** - Account `07468e90032185025d9a0f30d032314a` is completely inaccessible
6. **Static assets** - CSS, fonts, client-side JavaScript chunks are in the ASSETS binding, not downloadable via API

---

## Next Steps for Full Recovery

### Immediate Actions

1. **Get correct API token for target account** `07468e90032185025d9a0f30d032314a`:
   - Log into `https://dash.cloudflare.com/07468e90032185025d9a0f30d032314a`
   - Go to My Profile > API Tokens
   - Create a token with: Account > Workers Scripts > Read, Account > Pages > Edit, Account > D1 > Edit, Zone > DNS > Read, Zone > Zone > Read

2. **If you have SSH/local access to the original development machine**, look for:
   - `wrangler.toml` or `.dev.vars` files
   - The Next.js project source code
   - `.vercel/` directory (if it was ever deployed to Vercel)
   - Any git history

3. **Check GitHub/GitLab** for the source repository:
   - The project appears to have been deployed via wrangler (CI/CD)
   - Check connected GitHub repos in Cloudflare dashboard
   - Look for repos named: `affiliate-builder`, `travail-pour-toi`, `publicationcashflow`, etc.

4. **Check Vercel dashboard** at vercel.com:
   - The bundle shows `.vercel/output/static/_worker.js/` path
   - The project may still exist on Vercel with full source and environment variables

### Rebuilding from Schema

The database schema is fully recoverable. You could rebuild the application using:
- The schema provided above
- The known Next.js App Router structure (`/`, `/admin`, `/site/[slug]`, `/api/*`)
- The commission model (3-level: 25%/10%/5%)
- Cloudflare Workers + D1 + @cloudflare/next-on-pages

### Files Saved During This Investigation

- `/tmp/ai-affiliate-part-index.js` - Worker runtime bundle (40KB)
- `/tmp/travail-pour-toi-worker-bundle.tar.gz` - Simple asset worker (370 bytes)

---

## API Commands Reference

For the correct token, use these commands:

```bash
# List all Pages projects
curl -s "https://api.cloudflare.com/client/v4/accounts/07468e90032185025d9a0f30d032314a/pages/projects" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN"

# Get specific project
curl -s "https://api.cloudflare.com/client/v4/accounts/07468e90032185025d9a0f30d032314a/pages/projects/affiliate-builder" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN"

# List deployments
curl -s "https://api.cloudflare.com/client/v4/accounts/07468e90032185025d9a0f30d032314a/pages/projects/affiliate-builder/deployments" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN"

# List workers
curl -s "https://api.cloudflare.com/client/v4/accounts/07468e90032185025d9a0f30d032314a/workers/scripts" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN"

# Query D1 database
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/07468e90032185025d9a0f30d032314a/d1/database/DATABASE_UUID/query" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT name FROM sqlite_master WHERE type=\"table\";"}'

# Get DNS records
curl -s "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_CORRECT_TOKEN"
```
