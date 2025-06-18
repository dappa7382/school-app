// Copilot, buat middleware untuk Next.js menggunakan @supabase/ssr
// 1. Impor updateSession dari utils/supabase/middleware
// 2. Middleware ini harus melindungi semua rute kecuali halaman utama dan halaman login
// 3. Jika pengguna belum login dan mencoba mengakses rute yang dilindungi, redirect ke halaman /login

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session cookies and handle authentication logic
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     * Public routes that should be accessible without auth:
     * - / (home page)
     * - /login (login page)
     * - /auth/callback (auth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|auth/callback|$).*)',
  ],
}