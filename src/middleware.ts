import { NextRequest, NextResponse } from 'next/server'

// Subdomain routing middleware for NyXia multi-tenant architecture
// Only rewrites page requests, lets API/assets/static through normally
export const config = {
  matcher: ['/:path*'],
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  const hostname = request.headers.get('host') || ''

  // Skip API routes, static assets, _next, and other system paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.includes('.') // static files like .css, .js, .png, etc.
  ) {
    return NextResponse.next()
  }

  // Only run subdomain routing on the production domain
  const isProductionDomain = hostname.endsWith('travail-pour-toi.com')
  const isMainDomain =
    hostname === 'travail-pour-toi.com' ||
    hostname === 'www.travail-pour-toi.com' ||
    hostname === 'localhost:3000'

  if (!isProductionDomain || isMainDomain) {
    return NextResponse.next()
  }

  // Parse subdomain from hostname (now guaranteed to be *.travail-pour-toi.com)
  const parts = hostname.replace('.www.', '.').split('.')
  const subdomainPart = parts[0]

  // Extract subdomain info
  let subdomain = parts[0]
  let subType: string | null = null

  // Check for nested subdomains like "formation.diane.travail-pour-toi.com"
  if (parts.length > 3) {
    subType = parts[0]
    subdomain = parts[1]
  }

  // Rewrite to tenant pages
  if (subType === 'formation') {
    url.pathname = `/formation/${subdomain}${pathname === '/' ? '' : pathname}`
  } else {
    url.pathname = `/t/${subdomain}${pathname === '/' ? '' : pathname}`
  }

  return NextResponse.rewrite(url)
}
