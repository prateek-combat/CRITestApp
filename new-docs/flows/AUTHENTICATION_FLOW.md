# Authentication Flow Documentation

## Overview
CRITestApp uses NextAuth.js v4 with Google OAuth for authentication. The system implements role-based access control with session-based authentication.

## Authentication Flow Diagram

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│   Browser   │                    │   Next.js    │                    │   Google     │
│   Client    │                    │   Server     │                    │   OAuth      │
└─────────────┘                    └──────────────┘                    └──────────────┘
       │                                   │                                   │
       │  1. User clicks "Sign in"         │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │  2. Redirect to /api/auth/signin  │                                   │
       │◄──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  3. Select Google provider        │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  4. Redirect to Google OAuth      │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  5. Google login page             │                                   │
       │◄──────────────────────────────────────────────────────────────────────┤
       │                                   │                                   │
       │  6. User authorizes               │                                   │
       ├──────────────────────────────────────────────────────────────────────►│
       │                                   │                                   │
       │                                   │  7. Return with auth code         │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                   │
       │                                   │  8. Exchange code for tokens      │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │                                   │  9. Return user profile           │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                   │
       │                                   │  10. Check user in database       │
       │                                   ├─────────┐                         │
       │                                   │         │                         │
       │                                   │◄────────┘                         │
       │                                   │                                   │
       │  11. Create session & redirect    │                                   │
       │◄──────────────────────────────────┤                                   │
       │                                   │                                   │
```

## Session Management

### Session Creation
```typescript
// Session callback in NextAuth configuration
callbacks: {
  async session({ session, token }) {
    if (session?.user) {
      // Add user role and ID to session
      session.user.id = token.sub;
      session.user.role = token.role;
    }
    return session;
  },
  
  async jwt({ token, user, account }) {
    if (user) {
      // Store user role in JWT token
      const dbUser = await getUserByEmail(user.email);
      token.role = dbUser?.role || 'USER';
    }
    return token;
  }
}
```

### Session Storage
- Sessions stored in encrypted JWT cookies
- Cookie settings:
  - HttpOnly: true
  - Secure: true (in production)
  - SameSite: lax
  - MaxAge: 30 days

## Authorization Flows

### Role-Based Access Control

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Request   │────►│  Middleware  │────►│   Route     │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Check Session│
                    └──────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌─────────────┐ ┌─────────────┐
            │  Has Role?  │ │   No Auth   │
            └─────────────┘ └─────────────┘
                    │               │
                    ▼               ▼
            ┌─────────────┐ ┌─────────────┐
            │   Allow     │ │  Redirect   │
            └─────────────┘ └─────────────┘
```

### Protected Route Patterns

```typescript
// API Route Protection
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return new Response("Forbidden", { status: 403 });
  }
  
  // Process request...
}

// Page Protection (Server Component)
export default async function AdminPage() {
  const session = await auth();
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized');
  }
  
  // Render page...
}
```

## User Registration Flow

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│   Admin     │                    │   Next.js    │                    │  Database    │
│   User      │                    │   Server     │                    │  (Prisma)    │
└─────────────┘                    └──────────────┘                    └──────────────┘
       │                                   │                                   │
       │  1. Access admin panel            │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │  2. Create new admin form         │                                   │
       │◄──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  3. Submit user details           │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  4. Check email uniqueness       │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │                                   │  5. Email available              │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                   │
       │                                   │  6. Hash password & save         │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │                                   │  7. User created                  │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                   │
       │  8. Success message               │                                   │
       │◄──────────────────────────────────┤                                   │
```

## Security Measures

### 1. Pre-Registration Check
```typescript
// Only pre-registered emails can authenticate
signIn: async ({ user, account, profile }) => {
  if (!user?.email) return false;
  
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  });
  
  return !!dbUser; // Only allow if user exists
}
```

### 2. CSRF Protection
- NextAuth automatically handles CSRF tokens
- Tokens validated on all state-changing operations

### 3. Session Security
- Sessions expire after 30 days of inactivity
- JWT tokens signed with NEXTAUTH_SECRET
- Refresh tokens not implemented (security decision)

## Error Handling

### Authentication Errors
```
┌─────────────────┐
│ Error Occurred  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User Not Found  │     │ Invalid Creds   │     │ OAuth Error     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Show Error Page │     │ Show Login Form │     │ Retry OAuth     │
│ "Access Denied" │     │ With Error Msg  │     │ Or Show Error   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Logout Flow

```
User clicks logout → DELETE /api/auth/signout → Clear session → Redirect to /login
```

## Environment Variables

```env
# Required for authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

Last Updated: January 13, 2025
