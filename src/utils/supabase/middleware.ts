import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for custom auth cookie
  const userCookie = request.cookies.get('user')?.value
  const user = userCookie ? JSON.parse(userCookie) : null

  // Define protected routes - all routes except home page and login
  const publicRoutes = ['/', '/login', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access login page
  if (user && request.nextUrl.pathname === '/login') {
    // Redirect based on user role
    let redirectUrl
    switch (user.role_id) {
      case 1:
        redirectUrl = new URL('/dashboard/admin', request.url)
        break
      case 2:
        redirectUrl = new URL('/dashboard/guru', request.url)
        break
      case 3:
        redirectUrl = new URL('/dashboard/siswa', request.url)
        break
      default:
        redirectUrl = new URL('/dashboard', request.url)
    }
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
