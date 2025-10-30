import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    console.log('Middleware running for:', req.nextUrl.pathname)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        console.log('Authorization check for:', pathname)
        console.log('Token exists:', !!token)
        console.log('User role:', token?.role)

        // Always allow access to login and public routes
        if (pathname.startsWith('/login') || pathname === '/' || pathname.startsWith('/api/auth')) {
          return true
        }

        // For all other routes, just check if user is authenticated
        // Let the ProtectedRoute components handle role-based access
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/pos/:path*',
    '/inventory/:path*',
    '/sales/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/shops/:path*', // Include shop management routes
  ],
}
