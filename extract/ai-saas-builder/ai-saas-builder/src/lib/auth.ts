export const COOKIE_NAME = 'affiliation-pro-session'

function getSecret(): string {
  return process.env.JWT_SECRET || 'affiliation-pro-secret-change-in-production'
}

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)))
}

export interface SessionPayload {
  userId: string
  email: string
  role: 'super_admin' | 'admin' | 'affiliate'
}

// Simple JWT using Web Crypto API (no external dependency)
export async function createToken(payload: SessionPayload): Promise<string> {
  const encoder = new TextEncoder()
  const secret = encoder.encode(getSecret())

  const key = await crypto.subtle.importKey(
    'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )

  const header = base64url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const body = base64url(encoder.encode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
  })))
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`))
  const signature = base64url(new Uint8Array(sigBuf))

  return `${header}.${body}.${signature}`
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const encoder = new TextEncoder()
    const secret = encoder.encode(getSecret())

    const key = await crypto.subtle.importKey(
      'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )

    const sigData = base64urlDecode(parts[2])
    const msgData = encoder.encode(`${parts[0]}.${parts[1]}`)
    const valid = await crypto.subtle.verify(
      'HMAC', key, sigData.buffer as ArrayBuffer, msgData.buffer as ArrayBuffer
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])))
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

// Password hashing using SHA-256 + salt (Web Crypto API - native in Workers)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, '')
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `$sha256$${salt}$${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$')
    if (parts.length !== 4 || parts[1] !== 'sha256') return false
    const salt = parts[2]
    const encoder = new TextEncoder()
    const data = encoder.encode(salt + password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex === parts[3]
  } catch {
    return false
  }
}

export function getSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieHeader = request.headers.get('Cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (sessionCookie) {
    return sessionCookie.split('=')[1]
  }

  return null
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const token = getSessionToken(request)
  if (!token) return null
  return verifyToken(token)
}

export function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
}

export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}
