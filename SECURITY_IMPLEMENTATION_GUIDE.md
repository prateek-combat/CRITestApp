# Security Implementation Guide - CRITestApp

## Quick Start Security Checklist

### For Developers
- [ ] Never commit `.env` files
- [ ] Always escape user input in emails and UI
- [ ] Use `fetchWithCSRF` for all state-changing API calls
- [ ] Store sensitive data in `sessionStorage`, not `localStorage`
- [ ] Run security linting before commits

### For DevOps
- [ ] Set up Redis for production rate limiting
- [ ] Configure WAF rules
- [ ] Enable security monitoring
- [ ] Set up secret rotation
- [ ] Configure backup encryption

---

## 1. Authentication Setup

### Environment Variables Required
```bash
# .env.local (never commit this file)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
DATABASE_URL=your-database-connection-string
```

### Generate Secure Secret
```bash
openssl rand -base64 32
```

### Admin User Setup
```bash
# Create admin user via Prisma
npx prisma studio
# Or use the setup script
npm run setup:admin
```

---

## 2. CSRF Protection Usage

### Frontend Implementation
```typescript
// Always use the useCSRF hook for API calls
import { useCSRF } from '@/hooks/useCSRF';

const MyComponent = () => {
  const { fetchWithCSRF } = useCSRF();
  
  const handleSubmit = async (data) => {
    const response = await fetchWithCSRF('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };
};
```

### API Route Protection
```typescript
// CSRF is automatically validated in middleware
// Just ensure your route is in the protected list
export async function POST(request: NextRequest) {
  // CSRF token already validated by middleware
  const body = await request.json();
  // Process request...
}
```

---

## 3. Session Security

### Session Timeouts
- **Maximum session**: 8 hours
- **Inactivity timeout**: 2 hours
- **Session update**: Every hour when active

### Implementing Session Monitoring
```typescript
// In your main layout or app component
import { setupSessionMonitor } from '@/lib/auth-utils';

useEffect(() => {
  const cleanup = setupSessionMonitor(() => {
    // Custom logout handler
    alert('Session expired due to inactivity');
    signOut();
  });
  
  return cleanup;
}, []);
```

---

## 4. Secure Storage

### Do's and Don'ts
```typescript
// ✅ DO: Use secure storage for sensitive data
import { secureStorage } from '@/lib/secure-storage';
secureStorage.setItem('userData', sensitiveData);

// ❌ DON'T: Use localStorage for sensitive data
localStorage.setItem('authToken', token); // NEVER DO THIS

// ✅ DO: Clear sensitive data on logout
secureStorage.clear();
```

---

## 5. API Security Best Practices

### Input Validation
```typescript
// Always validate input
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'])
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const validatedData = userSchema.parse(body);
    // Process validated data
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }
}
```

### Rate Limiting
```typescript
// Current implementation (development)
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const identifier = request.ip || 'anonymous';
  
  if (!rateLimiter.checkLimit(identifier, 'api', 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Process request
}
```

---

## 6. Security Headers Configuration

### Next.js Configuration
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 7. Preventing Common Vulnerabilities

### XSS Prevention
```typescript
// Always escape HTML in user content
import { escapeHtml } from '@/lib/security-utils';

// In email templates
const emailHtml = `
  <p>Hello ${escapeHtml(userName)},</p>
  <p>${escapeHtml(userMessage)}</p>
`;

// In React components (auto-escaped)
<div>{userContent}</div> // Safe by default

// Dangerous - only if you trust the content
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

### SQL Injection Prevention
```typescript
// Always use Prisma parameterized queries
// ✅ SAFE
const users = await prisma.user.findMany({
  where: { email: userEmail }
});

// ❌ NEVER use string concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

---

## 8. Production Deployment Checklist

### Environment Setup
- [ ] Set `NODE_ENV=production`
- [ ] Configure all production environment variables
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up Redis for rate limiting
- [ ] Configure CDN for static assets
- [ ] Enable security monitoring

### Database Security
- [ ] Enable SSL for database connections
- [ ] Set up database backups with encryption
- [ ] Configure database access logs
- [ ] Implement connection pooling
- [ ] Set up read replicas for scaling

### Infrastructure Security
- [ ] Configure WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Enable cloud security features
- [ ] Configure security groups/firewalls
- [ ] Set up intrusion detection

---

## 9. Security Monitoring

### Key Metrics to Monitor
1. **Failed login attempts** - Potential brute force
2. **Rate limit violations** - Potential DDoS
3. **CSRF failures** - Potential attack attempts
4. **Session anomalies** - Potential hijacking
5. **API error rates** - Potential exploitation

### Logging Requirements
```typescript
// Implement security event logging
import { securityLogger } from '@/lib/logger';

// Log authentication events
securityLogger.info('User login attempt', {
  email: user.email,
  ip: request.ip,
  userAgent: request.headers.get('user-agent'),
  success: true
});

// Log security violations
securityLogger.warn('Rate limit exceeded', {
  ip: request.ip,
  endpoint: request.url,
  limit: 100
});
```

---

## 10. Incident Response

### Security Incident Checklist
1. **Identify** - Determine the scope and impact
2. **Contain** - Isolate affected systems
3. **Investigate** - Analyze logs and evidence
4. **Remediate** - Fix vulnerabilities
5. **Document** - Record lessons learned

### Emergency Contacts
- Security Team: security@example.com
- DevOps On-Call: +1-XXX-XXX-XXXX
- Cloud Provider Support: [Support URL]

---

## Regular Security Tasks

### Daily
- Review security alerts
- Check rate limiting metrics
- Monitor authentication logs

### Weekly
- Review user access patterns
- Check for unusual API usage
- Update security dependencies

### Monthly
- Security dependency audit
- Access control review
- Security training updates

### Quarterly
- Penetration testing
- Security policy review
- Incident response drills

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

## Support

For security concerns or questions:
- Create a private security issue in the repository
- Email: security@example.com
- Use the security disclosure policy

Remember: **Security is everyone's responsibility!**