'use client'

import { useEffect } from 'react'

// Force dynamic rendering — no static caching
// Client-side redirect for maximum reliability on Cloudflare Pages

export default function ReferralRedirectPage() {
  useEffect(() => {
    const pathname = window.location.pathname
    const pathParts = pathname.split('/').filter(Boolean)

    // Extract code from /r/CODE or /r/CODE/ format
    const codeIndex = pathParts.indexOf('r')
    const code = codeIndex >= 0 && pathParts[codeIndex + 1] ? pathParts[codeIndex + 1] : null

    if (code) {
      const normalizedCode = code.toUpperCase()

      // Track referral click (fire-and-forget, don't block redirect)
      fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode }),
      }).catch(() => {
        // Don't let tracking errors block the redirect
      })

      // Always redirect to signup with the referral code
      window.location.replace(`/signup?ref=${normalizedCode}`)
    } else {
      window.location.replace('/signup')
    }
  }, [])

  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="refresh" content="0;url=/signup" />
        <title>Redirection...</title>
      </head>
      <body style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0c1222',
        color: '#a1a1aa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(168, 85, 247, 0.3)',
            borderTop: '3px solid #a855f7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Redirection en cours...</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            <a href="/signup" style={{ color: '#a855f7', textDecoration: 'underline' }}>
              Cliquez ici si la redirection ne fonctionne pas
            </a>
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </body>
    </html>
  )
}
