// src/middleware.ts - Version simplifiée
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Routes publiques (toujours accessibles)
  const publicRoutes = ['/auth', '/']
  if (publicRoutes.includes(pathname) || pathname === '/') {
    return NextResponse.next()
  }

  // Pour le MVP : on laisse passer toutes les routes protégées
  // La vérification réelle se fait côté client avec supabase.auth.getSession()
  // ✅ Cette approche simplifiée évite les dépendances complexes en middleware
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}