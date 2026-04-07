import { type NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'affiliation-pro-session'

// Routes publiques - pas besoin d'auth
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/logout',
]

const PUBLIC_PREFIXES = [
  '/r/',
  '/api/webhooks/',
  '/api/auth/',
  '/api/test',
  '/api/debug',
  '/_next/',
  '/favicon',
]

function isPublicPath(pathname: string): boolean {
  // Exact public paths
  if (PUBLIC_PATHS.includes(pathname)) return true

  // Prefix-based public paths
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }

  // Static assets
  if (pathname.includes('.')) {
    const ext = pathname.split('.').pop()?.toLowerCase()
    const staticExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'woff', 'woff2', 'ttf']
    if (ext && staticExts.includes(ext)) return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques → pas de vérification
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Vérifier la présence du cookie de session
  const sessionCookie = request.cookies.get(COOKIE_NAME)

  if (!sessionCookie?.value) {
    // Pour les requêtes API, renvoyer 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    // Pour les pages, rediriger vers login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cookie présent → laisser passer
  // (la vérification JWT est faite par chaque API route elle-même)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Toutes les routes sauf les assets statiques et favicon
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
