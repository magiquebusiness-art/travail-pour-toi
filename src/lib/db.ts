// @ts-nocheck
import { getCloudflareContext } from '@opennextjs/cloudflare'

export type Database = any

export async function getDB(): Promise<Database> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return env.DB as D1Database
  } catch (error) {
    console.error('getDB error:', error)
    return null
  }
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
