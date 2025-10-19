# Authentication Middleware

This middleware implements automatic redirection for logged-in users from the root path (`/`) to the main dashboard (`/home`).

## How it works

### 1. Middleware (`src/middleware.js`)
- Runs on every request to check the current path
- If the path is `/` and the user has authentication cookies, redirects to `/home`
- Uses two cookies for authentication:
  - `user`: Contains user data (accessible client-side)
  - `auth-token`: Secure token for server-side verification

### 2. Authentication Flow
- **Login**: When users log in via `/api/auth`, the server sets authentication cookies
- **Middleware Check**: On each request to `/`, middleware checks for these cookies
- **Redirect**: If cookies exist, user is automatically redirected to `/home`
- **Logout**: When users log out, cookies are cleared via `/api/auth/logout`

### 3. Cookie Configuration
- `user` cookie: Non-httpOnly, allows client-side access
- `auth-token` cookie: HttpOnly, secure server-side token
- Both cookies expire after 7 days
- Secure in production, lax sameSite policy

## Files Modified

1. **`src/middleware.js`** - New middleware file
2. **`src/app/api/auth/route.js`** - Updated to set cookies on login
3. **`src/app/api/auth/logout/route.js`** - New logout endpoint
4. **`src/components/header.jsx`** - Updated logout handler
5. **`src/components/AuthGuard.jsx`** - Enhanced authentication checking

## Usage

The middleware works automatically:
- Logged-out users can access `/` normally
- Logged-in users are automatically redirected to `/home` when visiting `/`
- No additional configuration needed

## Security Considerations

- Cookies are secure in production environments
- HttpOnly cookies prevent XSS attacks
- SameSite policy prevents CSRF attacks
- Tokens expire after 7 days for security

## Testing

To test the middleware:
1. Log in to the application
2. Try to visit `/` - you should be automatically redirected to `/home`
3. Log out and try to visit `/` - you should see the login page
4. Visit `/home` while logged out - you should be redirected to `/`
