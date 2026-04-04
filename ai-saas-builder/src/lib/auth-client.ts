// Client-side auth helpers

const API_BASE = '/api/auth'

export async function signup(data: {
  email: string
  password: string
  fullName: string
  referralCode?: string
}): Promise<{ success: boolean; error?: string; user?: any }> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    let errorMsg = 'Erreur lors de l\'inscription'
    try {
      const err = await res.json()
      errorMsg = err.error || errorMsg
    } catch {
      // Response not JSON
    }
    return { success: false, error: errorMsg }
  }

  return await res.json()
}

export async function login(data: {
  email: string
  password: string
}): Promise<{ success: boolean; error?: string; user?: any }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    let errorMsg = 'Erreur lors de la connexion'
    try {
      const err = await res.json()
      errorMsg = err.error || errorMsg
    } catch {
      // Response not JSON
    }
    return { success: false, error: errorMsg }
  }

  return await res.json()
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, { method: 'POST' })
  window.location.href = '/login'
}

export async function getCurrentUser(): Promise<any> {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
