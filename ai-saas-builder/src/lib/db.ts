// @ts-nocheck

import { getCloudflareContext } from '@opennextjs/cloudflare'

export type Database = any

export function getDB(): Database {
  try {
    const ctx = getCloudflareContext()
    if (ctx?.env?.DB) return ctx.env.DB
  } catch (e) {
    console.error('getCloudflareContext error:', e?.message || e)
  }

  // Fallback: try global symbol (older opennextjs versions)
  try {
    const ctx = (globalThis as any)[Symbol.for("__cloudflare-context__")]
    if (ctx?.env?.DB) return ctx.env.DB
  } catch {}

  throw new Error('D1 database not available in this context')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function generateUniqueAffiliateCode(db: Database): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateAffiliateCode()
    const existing = await db.prepare('SELECT id FROM users WHERE affiliate_code = ?').bind(code).first()
    if (!existing) return code
  }
  return Date.now().toString(36).toUpperCase().slice(-8)
}
