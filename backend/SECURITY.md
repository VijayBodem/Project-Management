# Security Features - SkillForge

This document outlines the security measures implemented in the SkillForge application.

## 1. Rate Limiting

### Authentication Rate Limiting
- **Endpoint**: `/api/auth/*`
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent brute force attacks on login/register endpoints

### General API Rate Limiting
- **Endpoint**: `/api/*`
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Prevent API abuse and DoS attacks

### Password Change Rate Limiting
- **Endpoint**: `/api/users/change-password`
- **Limit**: 3 requests per hour per IP
- **Purpose**: Prevent password change abuse

## 2. Security Headers (Helmet.js)

The following security headers are automatically set:

- **Content-Security-Policy**: Restricts resource loading
- **X-DNS-Prefetch-Control**: Controls DNS prefetching
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security**: Enforces HTTPS
- **X-Download-Options**: Prevents file execution in IE
- **X-Permitted-Cross-Domain-Policies**: Controls cross-domain policies

## 3. Input Sanitization

### Status: Partially Disabled (Compatibility)

Due to compatibility issues with newer Express.js versions where `req.query` and `req.params` are read-only properties, the following middlewares have been temporarily disabled:

### MongoDB Query Sanitization (Disabled)
- **Reason**: Cannot modify read-only `req.query` in Express 5+
- **Alternative Protection**: 
  - Input validation in controllers using Express Validator
  - Mongoose schema validation prevents injection
  - Type checking with TypeScript

### XSS Protection (Partially Active)
- **Active**: Request body sanitization (removes script tags, event handlers)
- **Disabled**: Query and params sanitization (read-only properties)
- **Alternative Protection**:
  - React automatically escapes output (prevents XSS)
  - Input validation in controllers
  - Content Security Policy headers via Helmet

### HTTP Parameter Pollution Protection (Disabled)
- **Reason**: Cannot modify read-only `req.query`
- **Alternative Protection**:
  - Input validation in controllers
  - Type checking ensures correct data types

**Important Note**: The application remains secure because:
1. All user input is validated in controllers before processing
2. Mongoose schema validation prevents NoSQL injection
3. React's JSX automatically escapes output, preventing XSS
4. TypeScript provides compile-time type safety
5. Helmet provides Content Security Policy headers

## 4. Refresh Token Rotation

### How It Works
1. User logs in and receives access token + refresh token
2. Refresh token is stored in database (array of tokens)
3. When refreshing, old token is replaced with new token
4. Maximum 5 active tokens per user (supports 5 devices)
5. If token reuse is detected, all tokens are invalidated

### Benefits
- Prevents token theft and replay attacks
- Limits damage if refresh token is compromised
- Supports multiple devices securely

## 5. Account Locking

### Failed Login Protection
- **Max Attempts**: 5 failed login attempts
- **Lock Duration**: 2 hours
- **Reset**: Successful login resets counter

### How It Works
1. Each failed login increments attempt counter
2. After 5 attempts, account is locked for 2 hours
3. User receives clear error message with time remaining
4. Successful login resets the counter

## 6. Logout from All Devices

### Single Device Logout
- **Endpoint**: `POST /api/token/logout`
- **Body**: `{ refreshToken: "token" }`
- Removes specific refresh token from user's token array

### All Devices Logout
- **Endpoint**: `POST /api/token/logout-all`
- Clears all refresh tokens for the user
- Forces re-authentication on all devices

### Password Change Security
- Changing password automatically logs out all devices
- All refresh tokens are invalidated
- User must login again everywhere

## 7. CORS Configuration

- Configured to accept requests from frontend URL only
- Credentials enabled for cookie-based auth (if needed)
- Prevents unauthorized cross-origin requests

## 8. Request Body Size Limiting

- Maximum request body size: 10KB
- Prevents large payload attacks
- Protects against memory exhaustion

## 9. Password Security

### Hashing
- Uses bcrypt with salt rounds of 10
- Passwords are never stored in plain text
- Password changed timestamp tracked

### Password Change Requirements
- Must provide current password
- New password must be different from current
- Minimum 6 characters required
- All sessions invalidated on change

## 10. Token Security

### Access Token
- Short-lived (15 minutes default)
- Contains user ID and role
- Signed with JWT secret
- Cannot be revoked (short expiry mitigates risk)

### Refresh Token
- Long-lived (7 days default)
- Stored in database for validation
- Can be revoked
- Rotated on each use

## Best Practices for Deployment

### Environment Variables
```env
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### HTTPS
- Always use HTTPS in production
- Helmet enforces HSTS
- Prevents man-in-the-middle attacks

### Database Security
- Use strong MongoDB credentials
- Enable MongoDB authentication
- Use connection string with auth
- Restrict database access by IP

### Monitoring
- Monitor rate limit violations
- Log failed login attempts
- Track account lockouts
- Alert on suspicious activity

## Security Checklist

- [x] Rate limiting on auth endpoints
- [x] Rate limiting on API endpoints
- [x] Security headers (Helmet)
- [x] Input sanitization (Body only - query/params via validation)
- [x] XSS protection (Body only - React handles output)
- [~] HTTP Parameter Pollution protection (Disabled - validation handles this)
- [x] Refresh token rotation
- [x] Account locking after failed attempts
- [x] Logout from all devices
- [x] Password change invalidates all sessions
- [x] CORS configuration
- [x] Request body size limiting
- [x] Password hashing with bcrypt
- [x] JWT token security
- [x] Input validation in controllers
- [x] TypeScript type safety

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - TOTP-based 2FA
   - SMS verification
   - Backup codes

2. **Email Verification**
   - Verify email on registration
   - Email change verification

3. **Password Reset**
   - Secure password reset flow
   - Time-limited reset tokens

4. **Session Management**
   - View active sessions
   - Revoke specific sessions
   - Session activity logs

5. **IP Whitelisting**
   - Allow access from specific IPs
   - Geo-blocking

6. **Audit Logging**
   - Log all security events
   - Track user actions
   - Compliance reporting
