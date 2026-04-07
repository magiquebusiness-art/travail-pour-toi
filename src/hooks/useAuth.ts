'use client'

export function useAuth() {
  const logout = () => {
    // Redirect to logout page - simple and reliable
    window.location.href = '/logout'
  }

  const isLoggingOut = false

  return { logout, isLoggingOut }
}
