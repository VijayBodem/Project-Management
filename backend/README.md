# 🚀 Project Management System - Backend

A robust, scalable REST API backend with real-time WebSocket support, built with Node.js, Express, TypeScript, and MongoDB.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [Security](#-security)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The backend serves as the core engine of the Project Management System, providing:

- **RESTful API** for complete CRUD operations on projects, tasks, and users
- **Real-time WebSocket communication** for live collaboration features
- **JWT-based authentication** with multi-device session management
- **Role-based access control (RBAC)** with granular permissions
- **Comprehensive data validation** using Zod schemas
- **Enterprise-grade security** with rate limiting and input sanitization
- **MongoDB integration** with optimized queries and indexing

### 🏢 Use Cases

This backend powers collaborative project management for:

- **Software Development Teams** - Sprint planning and bug tracking
- **Marketing Agencies** - Campaign management and content coordination
- **Design Teams** - Project organization and creative workflows
- **Remote Teams** - Real-time collaboration across time zones
- **Freelancers** - Multi-client project management

---

## ✨ Features

### 🔐 Authentication & Security

- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Multi-Device Sessions** - Track and manage concurrent user sessions
- **OTP Verification** - Email-based two-factor authentication for suspicious logins
- **Password Security** - Bcrypt hashing with configurable salt rounds
- **Rate Limiting** - Protection against brute force and DDoS attacks
- **Input Validation** - Comprehensive validation with Zod schemas
- **Security Headers** - Helmet.js protection against common vulnerabilities

### 📊 Project Management

- **Project CRUD** - Create, read, update, delete projects with soft deletion
- **Team Management** - Invite members with role-based permissions (Owner/Admin/Member/Viewer)
- **Project Statistics** - Real-time analytics and progress tracking
- **Activity Logging** - Complete audit trail of all project changes

### 🎯 Task Management

- **Task CRUD Operations** - Full lifecycle management of tasks
- **Kanban Workflow** - Status management (Todo → In Progress → Done)
- **Task Assignment** - Assign tasks to team members with notifications
- **Priority & Due Dates** - Task prioritization and deadline tracking
- **Position Management** - Drag-and-drop ordering within status columns

### 👥 Collaboration Features

- **Real-time Updates** - Instant synchronization via WebSocket
- **Presence System** - Track active users in projects
- **Collaborative Cursors** - Live cursor position sharing
- **Comment System** - Task discussion threads with @mentions
- **Notification System** - Real-time alerts for task assignments and updates

### 🔍 Advanced Functionality

- **Global Search** - Full-text search across projects, tasks, and users
- **Pagination** - Efficient data loading with customizable page sizes
- **Activity Feeds** - Chronological activity logs with filtering
- **Soft Deletes** - Safe deletion with recovery options
- **Data Export** - JSON/CSV export capabilities (API-ready)

---

## 🏗️ Architecture

### Technology Stack

| Category           | Technology         | Version | Purpose                                |
| ------------------ | ------------------ | ------- | -------------------------------------- |
| **Runtime**        | Node.js            | 18+     | JavaScript execution environment       |
| **Framework**      | Express.js         | 5.2+    | Web application framework              |
| **Language**       | TypeScript         | 5.5+    | Type safety and development experience |
| **Database**       | MongoDB            | 5+      | NoSQL document database                |
| **ODM**            | Mongoose           | 8.5+    | MongoDB object modeling                |
| **WebSocket**      | Socket.IO          | 4.8+    | Real-time bidirectional communication  |
| **Authentication** | JWT                | 9.0+    | JSON Web Token implementation          |
| **Validation**     | Zod                | 3.22+   | Runtime type validation                |
| **Security**       | Helmet.js          | 8.1+    | Security headers                       |
| **Rate Limiting**  | express-rate-limit | 7.1+    | Request rate limiting                  |

### Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # MongoDB connection setup
│   │   └── env.ts           # Environment variable validation
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controllers.ts     # Authentication logic
│   │   ├── project.controllers.ts  # Project management
│   │   ├── task.controllers.ts     # Task operations
│   │   ├── user.controllers.ts     # User profile management
│   │   ├── session.controllers.ts  # Session management
│   │   └── *.controllers.ts        # Feature-specific controllers
│   │
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User model with authentication
│   │   ├── Project.ts       # Project model with member roles
│   │   ├── Task.ts          # Task model with workflow states
│   │   ├── Session.ts       # Session tracking model
│   │   ├── Activity.ts      # Audit trail model
│   │   ├── Comment.ts       # Task discussion model
│   │   └── Notification.ts  # Notification model
│   │
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.ts          # Authentication endpoints
│   │   ├── project.routes.ts       # Project management routes
│   │   ├── task.routes.ts          # Task management routes
│   │   ├── security.routes.ts      # Session & OTP routes
│   │   ├── user.routes.ts          # User profile routes
│   │   └── *.routes.ts             # Feature-specific routes
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── permission.middleware.ts # RBAC enforcement
│   │   ├── validation.middleware.ts # Input validation
│   │   ├── errorHandler.ts          # Error handling
│   │   └── security.middleware.ts   # Security headers
│   │
│   ├── services/            # Business logic services
│   │   ├── email.service.ts        # Email sending (OTP, notifications)
│   │   ├── session.service.ts      # Session management
│   │   ├── otp.service.ts          # OTP generation/verification
│   │   ├── geolocation.service.ts  # IP geolocation
│   │   └── notification.service.ts # Notification handling
│   │
│   ├── socket/              # WebSocket handlers
│   │   ├── index.ts         # Socket.IO setup
│   │   └── events.ts        # Event broadcasting logic
│   │
│   ├── utils/               # Utility functions
│   │   ├── jwt.ts           # JWT token utilities
│   │   ├── validation.ts    # Validation helpers
│   │   ├── pagination.ts    # Pagination utilities
│   │   ├── projectRoles.ts  # Role definitions
│   │   └── notifications.ts # Notification helpers
│   │
│   └── index.ts             # Application entry point
│
├── scripts/                 # Database utilities
│   ├── createIndexes.ts     # Database indexing
│   ├── migrateSoftDelete.ts # Data migration scripts
│   └── *.ts                 # Other database scripts
│
├── test-email.js           # Email testing utility
├── .env                    # Environment configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **MongoDB** 5.0 or higher (local or Atlas)
- **npm** 8.0 or higher

### Installation

1. **Clone and navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project-management

# JWT Authentication
JWT_ACCESS_SECRET=your-super-secure-access-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Service (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173
```

4. **Start MongoDB**

```bash
# Using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) - just update MONGODB_URI
```

5. **Run database migrations**

```bash
# Create database indexes
npm run db:indexes

# Run data migrations (if upgrading)
npm run db:migrate:soft-delete
npm run db:migrate:task-position
npm run db:migrate:task-assignments
```

6. **Start the development server**

```bash
npm run dev
```

7. **Verify installation**

```bash
# Server should be running on http://localhost:5000
curl http://localhost:5000/health
```

### Development Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:indexes      # Create database indexes
npm run db:migrate:*    # Run specific migrations

# Testing
npm test               # Run test suite
npm run test:watch     # Watch mode testing
npm run test:coverage  # Test coverage report

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix linting issues
npm run type-check     # TypeScript type checking
```

---

## 📡 API Documentation

### Base URL

```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

### Core Endpoints

#### Authentication

```http
POST   /api/auth/register          # User registration
POST   /api/auth/login            # User login
POST   /api/security/verify-otp   # OTP verification
POST   /api/token/refresh         # Refresh access token
POST   /api/token/logout          # Logout current session
```

#### Projects

```http
GET    /api/projects              # Get user's projects
POST   /api/projects              # Create project
GET    /api/projects/:id          # Get project details
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
GET    /api/projects/:id/stats    # Get project statistics
```

#### Tasks

```http
GET    /api/tasks/project/:projectId  # Get project tasks
POST   /api/tasks                     # Create task
PUT    /api/tasks/:id                 # Update task
PATCH  /api/tasks/:id/status          # Update task status
PATCH  /api/tasks/:id/assign          # Assign/unassign task
DELETE /api/tasks/:id                 # Delete task
```

#### Team Management

```http
GET    /api/members/project/:projectId           # Get project members
POST   /api/members/project/:projectId           # Add member
PATCH  /api/members/project/:projectId/member/:memberId  # Update role
DELETE /api/members/project/:projectId/member/:memberId  # Remove member
```

#### Communication

```http
GET    /api/comments/task/:taskId    # Get task comments
POST   /api/comments                 # Add comment
PUT    /api/comments/:id             # Edit comment
DELETE /api/comments/:id             # Delete comment
GET    /api/activities/task/:taskId  # Get task activities
```

#### User Management

```http
GET    /api/user/profile             # Get user profile
PUT    /api/user/profile             # Update profile
PUT    /api/user/password            # Change password
GET    /api/search?q=query          # Global search
GET    /api/notifications            # Get notifications
```

#### Session Management

```http
GET    /api/security/sessions              # Get user sessions
POST   /api/security/sessions/logout       # Logout specific session
POST   /api/security/sessions/logout-all   # Logout multiple sessions
```

### Authentication Headers

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### Rate Limiting

| Endpoint Category | Limit        | Window     |
| ----------------- | ------------ | ---------- |
| Authentication    | 5 requests   | 15 minutes |
| General API       | 100 requests | 15 minutes |
| Search            | 30 requests  | 15 minutes |

---

## 🗄️ Database Models

### User Model

```typescript
{
  _id: ObjectId;
  name: string; // Full name
  email: string; // Unique email address
  password: string; // Bcrypt hashed password
  preferences: {
    emailNotifications: boolean; // Email notification preference
    pushNotifications: boolean; // Push notification preference
  }
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Model

```typescript
{
  _id: ObjectId;
  name: string;                    // Project name (3-100 chars)
  description?: string;            // Optional description
  createdBy: ObjectId;             // User reference (owner)
  members: [{
    user: ObjectId;                // User reference
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joinedAt: Date;
  }];
  isDeleted: boolean;              // Soft delete flag
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Model

```typescript
{
  _id: ObjectId;
  title: string;                   // Task title (required)
  description?: string;            // Optional description
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  project: ObjectId;               // Project reference
  assignedTo?: ObjectId;           // User reference
  createdBy: ObjectId;             // User reference
  position: number;                // Sort order within status
  dueDate?: Date;
  isDeleted: boolean;              // Soft delete flag
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Model

```typescript
{
  _id: ObjectId;
  userId: ObjectId;                // User reference
  sessionToken: string;            // Unique session identifier
  refreshToken: string;            // JWT refresh token
  deviceInfo: {
    fingerprint: string;           // Device fingerprint
    userAgent: string;             // Browser user agent
    browser: string;               // Browser name
    os: string;                    // Operating system
    device: string;                // Device type
  };
  location?: {
    ip: string;
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number; };
  };
  loginTime: Date;                 // Session start time
  lastActivity: Date;              // Last user activity
  isActive: boolean;               // Session status
  loginMethod: 'normal' | 'otp';  // Authentication method
}
```

### Activity Model

```typescript
{
  _id: ObjectId;
  task: ObjectId; // Task reference
  user: ObjectId; // User who performed action
  type: string; // Activity type (task_created, etc.)
  details: object; // Activity-specific data
  createdAt: Date;
}
```

---

## 🔐 Security

### Authentication Security

- **JWT Tokens** - Short-lived access tokens (15 minutes) with long-lived refresh tokens (7 days)
- **Password Hashing** - Bcrypt with 12 salt rounds for secure password storage
- **Session Management** - Device fingerprinting and concurrent session control
- **OTP Verification** - Email-based two-factor authentication for suspicious logins

### API Security

- **Rate Limiting** - Configurable limits per endpoint category
- **Input Validation** - Zod schema validation on all inputs
- **CORS Configuration** - Restricted cross-origin access
- **Security Headers** - Helmet.js protection against common vulnerabilities
- **XSS Protection** - Input sanitization and content security policies

### Data Protection

- **Soft Deletes** - Safe deletion with recovery options
- **Audit Trails** - Complete activity logging for compliance
- **Input Sanitization** - Prevention of injection attacks
- **Error Handling** - Secure error responses without data leakage

### Production Security Checklist

- [ ] Use strong, unique JWT secrets (min 32 characters)
- [ ] Configure HTTPS in production
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Monitor failed authentication attempts
- [ ] Regular security updates of dependencies
- [ ] Database backup and recovery procedures
- [ ] Log analysis and monitoring

---

## 🚀 Deployment

### Production Environment Setup

#### Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod-db
JWT_ACCESS_SECRET=your-production-access-secret-here
JWT_REFRESH_SECRET=your-production-refresh-secret-here
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

#### Docker Compose (Full Stack)

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/project-management
    depends_on:
      - mongodb

  mongodb:
    image: mongo:5
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongodb_data:
```

### Deployment Platforms

#### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Set build and run commands
4. Deploy automatically on push

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] JWT secrets are strong and unique
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] SSL certificate valid
- [ ] Performance optimized
- [ ] Security headers enabled

### Monitoring & Maintenance

#### Logging

- Request/response logging
- Error tracking and alerting
- Performance monitoring
- Security event logging

#### Health Checks

```http
GET /health         # Application health status
GET /api/status     # API and database connectivity
GET /metrics        # Application metrics (optional)
```
