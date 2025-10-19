import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Only apply this middleware to the root path
  if (pathname === '/') {
    // Check if user is logged in by looking for user data in cookies
    // Since the app uses localStorage for auth, we'll check for a session cookie
    // or create a simple check based on the request
    
    // For now, we'll redirect based on a simple check
    // In a production app, you'd want to verify the session properly
    
    // Check if there's a user cookie or session
    const userCookie = request.cookies.get('user');
    const authToken = request.cookies.get('auth-token');
    
    // If user is logged in (has user cookie or auth token), redirect to /home
    if (userCookie || authToken) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
