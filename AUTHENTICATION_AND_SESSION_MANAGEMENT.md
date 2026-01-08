# 🔐 Authentication & Session Management Documentation

## Overview

This document comprehensively covers the authentication and session management system implemented in the Project Management application. The system provides enterprise-grade security with multi-device session management, OTP verification, and real-time logout capabilities.

## 🏗️ Architecture

### Backend Components

- **Authentication Controllers**: Handle login, logout, and OTP verification
- **Session Management**: Track and manage user sessions across devices
- **OTP Service**: Email-based verification for security-sensitive operations
- **Socket System**: Real-time communication for instant logout notifications
- **JWT Tokens**: Secure token-based authentication

### Frontend Components

- **AuthContext**: Centralized authentication state management
- **OTP Modal**: Secure verification interface
- **Session Management UI**: Integrated into User Profile
- **Socket Client**: Real-time connection management

---

## 🔑 Authentication Flow

### 1. User Registration

```
POST /api/auth/register
Body: { name, email, password }

Response: {
  success: true,
  user: { _id, name, email, role },
  accessToken,
  refreshToken
}
```

### 2. User Login

```
POST /api/auth/login
Body: {
  email,
  password,
  deviceFingerprint,
  deviceInfo
}
```

#### Login Flow Decision Tree:

```
Login Attempt
├── Valid Credentials? ✅
│   ├── Check Active Sessions
│   │   ├── Different Device Detected? 🚨
│   │   │   ├── Send OTP to Email 📧
│   │   │   └── Return: { requiresOTP: true, tempToken }
│   │   └── Same Device/No Sessions 🎯
│   │       └── Create Session & Return Tokens ✅
│   └── Invalid Credentials ❌
│       └── Increment failed attempts & return error
└── Invalid Credentials ❌
    └── Return authentication error
```

### 3. OTP Verification (For Suspicious Logins)

```
POST /api/security/verify-otp
Headers: { Authorization: Bearer ${tempToken} }
Body: {
  otp,
  purpose: "login",
  deviceFingerprint,
  deviceInfo
}
```

#### OTP Verification Flow:

```
Receive OTP Code
├── Validate OTP Code ✅
│   ├── Purpose: "login"
│   │   ├── Create Session ✅
│   │   └── Return: { accessToken, refreshToken, sessionToken }
│   ├── Purpose: "session_logout"
│   │   └── Logout Specific Session ✅
│   ├── Purpose: "logout_all"
│   │   └── Logout All Sessions ✅
│   └── Invalid Purpose ❌
└── Invalid OTP ❌
    └── Return verification error
```

---

## 📱 Session Management

### Session Creation

When a user successfully logs in (normal or OTP), a session is created:

```typescript
Session Data:
{
  userId: ObjectId,
  sessionToken: string,        // Unique session identifier
  refreshToken: string,        // JWT refresh token
  deviceInfo: {
    fingerprint: string,       // Device fingerprint
    userAgent: string,         // Browser user agent
    browser: string,           // Browser name
    os: string,                // Operating system
    device: string             // Device type (mobile/tablet/desktop)
  },
  location: {
    ip: string,
    country?: string,
    city?: string,
    coordinates?: { lat, lng }
  },
  loginTime: Date,
  lastActivity: Date,
  isActive: boolean,
  loginMethod: "normal" | "otp"
}
```

### Session Tracking

- **Device Fingerprinting**: Unique identification per browser/device
- **Geolocation**: IP-based location tracking (optional)
- **Activity Monitoring**: Updates lastActivity on user actions
- **Expiration**: Sessions auto-expire based on token validity

---

## 🚪 Logout Flows

### 1. Header Logout (Current Device Only)

```
User clicks "Logout" in Dashboard header
├── Call logout() from AuthContext
├── POST /api/token/logout with sessionToken
├── Backend: Deactivate specific session
├── Emit logout event to current device only
└── Frontend: Clear localStorage, redirect to login
```

### 2. Individual Session Logout

```
User selects specific session in Profile → Sessions
├── Click "Logout" on target session
├── OTP sent to email for verification
├── POST /api/security/verify-otp with purpose: "session_logout"
├── Backend: Deactivate target session
├── Emit logout event to target device(s)
└── Target device logs out instantly
```

### 3. Logout Other Devices

```
User clicks "Logout Other Devices" in Profile → Sessions
├── OTP sent to email for verification
├── POST /api/security/verify-otp with purpose: "logout_all"
├── Backend: Deactivate all sessions EXCEPT current
├── Emit logout event to all other devices
└── Other devices log out, current device stays active
```

### 4. Logout All Devices

```
User clicks "Logout All Devices" in Profile → Sessions
├── OTP sent to email for verification
├── POST /api/security/verify-otp with purpose: "logout_all"
├── Backend: Deactivate ALL sessions
├── Emit logout event to all devices
└── All devices including current log out
```

---

## 🔒 Security Features

### Multi-Device Protection

- **Concurrent Login Detection**: Monitors active sessions from different devices
- **OTP Verification**: Required for suspicious login attempts
- **Device Fingerprinting**: Prevents session hijacking
- **Session Isolation**: Each device maintains separate session

### Real-time Security

- **Instant Logout**: Socket events ensure immediate session termination
- **Cross-Tab Synchronization**: All browser tabs logout simultaneously
- **Activity Tracking**: Monitors user activity for security

### Token Security

- **JWT Access Tokens**: Short-lived (15-60 minutes)
- **Refresh Tokens**: Long-lived, stored securely
- **Token Rotation**: New tokens issued on refresh
- **Secure Storage**: HTTP-only cookies or secure localStorage

---

## 🎨 User Interface

### Profile → Sessions Tab

```
Active Sessions
├── Session List
│   ├── Device Info (Browser, OS, Location)
│   ├── Login Time & Last Activity
│   ├── Current Session Badge
│   └── Logout Button (non-current sessions)
├── Action Buttons
│   ├── "Logout Other Devices" (with OTP)
│   └── "Logout All Devices" (with OTP)
└── Real-time Updates
    └── Auto-refresh session list
```

### OTP Verification Modal

```
Verify Your Identity
├── Email Display: user@example.com
├── 6-digit OTP Input Field
├── Countdown Timer (5 minutes)
├── Resend OTP Button
├── Error Messages
└── Verify/Cancel Buttons
```

---

## 🔌 Socket Communication

### Connection Establishment

```typescript
// After successful login
connectSocket({
  token: accessToken,
  sessionToken: sessionToken,
});

// Socket authenticates with backend
io.use(async (socket, next) => {
  const { token, sessionToken } = socket.handshake.auth;
  // Validate tokens and set socket.data.sessionToken
});
```

### Real-time Events

```typescript
// Logout Events
emitToSession(sessionToken, "auth:logout", payload); // Single device
emitToUserExceptSession(userId, sessionToken, "auth:logout", payload); // Other devices
emitToUser(userId, "auth:logout", payload); // All devices

// Frontend Handling
socket.on("auth:logout", (data) => {
  handleForceLogout(); // Clear storage + redirect
});
```

### Room Management

```typescript
// User joins personal room
socket.join(`user:${userId}`);

// Targeted emissions
emitToUser(userId, event, payload); // All user's devices
emitToUserExceptSession(userId, sessionToken, event, payload); // Exclude one session
emitToSession(sessionToken, event, payload); // Specific session only
```

---

## 📊 API Endpoints

### Authentication

```http
POST /api/auth/register          # User registration
POST /api/auth/login            # User login
POST /api/security/verify-otp   # OTP verification
```

### Session Management

```http
GET  /api/security/sessions              # Get user sessions
POST /api/security/sessions/logout       # Logout specific session (OTP)
POST /api/security/sessions/logout-all   # Logout multiple sessions (OTP)
```

### Token Management

```http
POST /api/token/refresh          # Refresh access token
POST /api/token/logout           # Logout current session
```

---

## 🛠️ Technical Implementation

### Backend Architecture

```
controllers/
├── auth.controllers.ts      # Login/logout logic
├── session.controllers.ts   # Session management
├── logout.controller.ts     # Legacy logout handling
└── token.controller.ts      # Token refresh

services/
├── session.service.ts       # Session CRUD operations
├── otp.service.ts          # OTP generation/verification
├── email.service.ts        # Email sending
└── geolocation.service.ts   # Location detection

models/
├── User.ts                 # User model with refresh tokens
├── Session.model.ts        # Session tracking
└── OTP.model.ts           # OTP storage
```

### Frontend Architecture

```
context/
└── AuthContext.tsx         # Authentication state

components/
└── OTPVerificationModal.tsx # OTP input interface

pages/
└── UserProfile.tsx         # Sessions tab integration

services/
├── api.ts                  # HTTP client
├── socket.ts              # WebSocket client
└── auth.service.ts        # Legacy auth functions
```

---

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database
MONGO_URI=mongodb://localhost:27017/projectmgmt

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_API_SOCKET_URL=http://localhost:5000
```

### Security Settings

```typescript
// OTP Configuration
OTP_LENGTH: 6
OTP_EXPIRES_IN: 5 minutes
MAX_OTP_ATTEMPTS: 3

// Session Limits
MAX_SESSIONS_PER_USER: 10
SESSION_TIMEOUT: 24 hours
INACTIVE_TIMEOUT: 30 minutes
```

---

## 🧪 Testing Scenarios

### Normal Login Flow

1. User registers/logs in normally
2. No active sessions from other devices
3. ✅ Session created, tokens returned, socket connected

### Suspicious Login Flow

1. User has active sessions from different device
2. Login attempt triggers OTP requirement
3. User receives email with 6-digit code
4. OTP verification creates new session
5. ✅ Both devices remain logged in

### Session Management

1. User accesses Profile → Sessions tab
2. Views all active sessions with device details
3. Can logout specific sessions or bulk operations
4. ✅ Real-time updates and instant logout

### Logout Scenarios

1. **Header Logout**: Only current device logs out
2. **Session Logout**: Target device logs out instantly
3. **Logout Other Devices**: Other devices logout, current stays active
4. **Logout All Devices**: All devices logout simultaneously

---
