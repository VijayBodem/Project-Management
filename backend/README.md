# Backend - Project Management System

RESTful API backend with real-time WebSocket support, built with Node.js, Express, TypeScript, and MongoDB.

## 🎯 Overview

The backend provides a robust API for project and task management with real-time collaboration features, authentication, authorization, and comprehensive data validation.

## ✨ Features

### Core Features
- **RESTful API** - Well-structured REST endpoints
- **Real-time Communication** - Socket.IO for live updates
- **Authentication** - JWT-based secure authentication
- **Authorization** - Role-based access control (RBAC)
- **Data Validation** - Input validation and sanitization
- **Error Handling** - Centralized error management
- **Database Optimization** - Indexed queries and efficient data retrieval

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with 10 rounds
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Cross-origin resource sharing
- **Helmet.js** - Security headers
- **Input Sanitization** - XSS and injection prevention
- **Soft Delete** - Safe deletion with recovery

### Advanced Features
- **Pagination** - Efficient data pagination
- **Search** - Full-text search across projects and tasks
- **Activity Logging** - Track all user actions
- **Notifications** - Real-time notification system
- **Comments** - Task discussion threads
- **File Attachments** - Support for task attachments (ready for implementation)

## 🏗️ Architecture

### Technology Stack
- **Node.js 18+** - JavaScript runtime
- **Express 4.19** - Web framework
- **TypeScript 5.5** - Type safety
- **MongoDB 5+** - NoSQL database
- **Mongoose 8.5** - MongoDB ODM
- **Socket.IO 4.7** - WebSocket library
- **JWT** - JSON Web Tokens
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation

### Project Structure
```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.ts      # MongoDB connection
│   │
│   ├── models/              # Mongoose models
│   │   ├── User.ts          # User model
│   │   ├── Project.ts       # Project model
│   │   ├── Task.ts          # Task model
│   │   ├── Comment.ts       # Comment model
│   │   ├── Activity.ts      # Activity log model
│   │   └── Notification.ts  # Notification model
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── project.controller.ts
│   │   ├── task.controller.ts
│   │   ├── member.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── activity.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── search.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── project.routes.ts
│   │   ├── task.routes.ts
│   │   ├── member.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── activity.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── search.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts        # JWT verification
│   │   ├── permission.middleware.ts  # RBAC
│   │   ├── validation.middleware.ts  # Input validation
│   │   ├── errorHandler.ts           # Error handling
│   │   └── security.middleware.ts    # Security headers
│   │
│   ├── socket/              # Socket.IO handlers
│   │   ├── index.ts         # Socket setup
│   │   └── handlers/        # Event handlers
│   │       ├── projectHandlers.ts
│   │       ├── taskHandlers.ts
│   │       └── presenceHandlers.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── validation.ts    # Validation helpers
│   │   ├── pagination.ts    # Pagination helper
│   │   └── projectRoles.ts  # Role definitions
│   │
│   ├── types/               # TypeScript types
│   │   ├── express.d.ts     # Express type extensions
│   │   └── socket.d.ts      # Socket.IO types
│   │
│   ├── scripts/             # Database scripts
│   │   ├── createIndexes.ts       # Create DB indexes
│   │   ├── migrateTaskPosition.ts # Task position migration
│   │   └── migrateSoftDelete.ts   # Soft delete migration
│   │
│   └── index.ts             # Application entry point
│
├── .env                      # Environment variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── DATABASE_OPTIMIZATION.md # Database guide
└── SECURITY.md              # Security documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB 5+ (local or Atlas)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**

Create `.env` file:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project-management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

3. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string
```

4. **Run database migrations (optional)**
```bash
# Create indexes
npm run create-indexes

# Migrate task positions
npm run migrate-positions

# Migrate soft delete
npm run migrate-soft-delete
```

5. **Start development server**
```bash
npm run dev
```

6. **Server will be running at**
```
http://localhost:5000
```

### Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201 Created
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "token": "jwt-token-here",
  "user": { ... }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "userId": "user-id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Project Endpoints

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "project-id",
    "name": "My Project",
    "description": "Project description",
    "createdBy": { ... },
    "members": [ ... ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description"
}

Response: 201 Created
{
  "_id": "project-id",
  "name": "New Project",
  ...
}
```

#### Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "_id": "project-id",
  "name": "My Project",
  ...
}
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}

Response: 200 OK
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Project deleted successfully"
}
```

#### Get Project Stats
```http
GET /api/projects/:id/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "project": { ... },
  "stats": {
    "totalTasks": 10,
    "completedTasks": 5,
    "inProgressTasks": 3,
    "todoTasks": 2
  }
}
```

### Task Endpoints

#### Get Project Tasks
```http
GET /api/tasks/project/:projectId
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "task-id",
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "priority": "high",
    "assignedTo": { ... },
    "project": "project-id",
    "position": 0,
    "dueDate": "2024-12-31T00:00:00.000Z",
    "createdBy": { ... }
  }
]
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Task",
  "description": "Task description",
  "project": "project-id",
  "assignedTo": "user-id",
  "priority": "high",
  "dueDate": "2024-12-31"
}

Response: 201 Created
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Task",
  "description": "Updated description",
  "priority": "medium"
}

Response: 200 OK
```

#### Update Task Status
```http
PATCH /api/tasks/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in-progress",
  "position": 1
}

Response: 200 OK
```

#### Assign Task
```http
PATCH /api/tasks/:id/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-id"
}

Response: 200 OK
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer {token}

Response: 200 OK
```

### Member Endpoints

#### Get Project Members
```http
GET /api/members/project/:projectId
Authorization: Bearer {token}

Response: 200 OK
{
  "members": [
    {
      "user": {
        "_id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "role": "admin",
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdBy": { ... }
}
```

#### Add Member
```http
POST /api/members/project/:projectId
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "member"
}

Response: 201 Created
```

#### Update Member Role
```http
PATCH /api/members/project/:projectId/member/:memberId
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}

Response: 200 OK
```

#### Remove Member
```http
DELETE /api/members/project/:projectId/member/:memberId
Authorization: Bearer {token}

Response: 200 OK
```

### Comment Endpoints

#### Get Task Comments
```http
GET /api/comments/task/:taskId
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "comment-id",
    "content": "Comment text",
    "user": { ... },
    "task": "task-id",
    "edited": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Add Comment
```http
POST /api/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "task": "task-id",
  "content": "This is a comment"
}

Response: 201 Created
```

#### Update Comment
```http
PUT /api/comments/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated comment"
}

Response: 200 OK
```

#### Delete Comment
```http
DELETE /api/comments/:id
Authorization: Bearer {token}

Response: 200 OK
```

### Notification Endpoints

#### Get User Notifications
```http
GET /api/notifications?unreadOnly=false
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "notification-id",
    "type": "task_assigned",
    "title": "Task Assigned",
    "message": "You were assigned to a task",
    "read": false,
    "user": "user-id",
    "actor": { ... },
    "task": "task-id",
    "project": "project-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer {token}

Response: 200 OK
```

#### Mark All as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer {token}

Response: 200 OK
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer {token}

Response: 200 OK
```

#### Clear Read Notifications
```http
DELETE /api/notifications/clear-read
Authorization: Bearer {token}

Response: 200 OK
```

### Search Endpoints

#### Global Search
```http
GET /api/search?q=query&filter=all
Authorization: Bearer {token}

Query Parameters:
- q: Search query (required)
- filter: all | projects | tasks (default: all)

Response: 200 OK
{
  "projects": [ ... ],
  "tasks": [ ... ]
}
```

### Activity Endpoints

#### Get Task Activities
```http
GET /api/activities/task/:taskId
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "activity-id",
    "type": "task_created",
    "user": { ... },
    "task": "task-id",
    "project": "project-id",
    "details": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}

Response: 200 OK
{
  "_id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "emailNotifications": true,
    "pushNotifications": false
  }
}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "preferences": {
    "emailNotifications": false
  }
}

Response: 200 OK
```

#### Change Password
```http
PUT /api/users/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

Response: 200 OK
```

## 🔌 WebSocket Events

### Connection
```javascript
// Client connects
socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Project Room Events

#### Join Project
```javascript
// Client emits
socket.emit('project:join', { projectId });

// Server broadcasts
socket.on('user:joined', { userId, userName });
socket.on('project:current-viewers', [{ userId, userName }]);
```

#### Leave Project
```javascript
// Client emits
socket.emit('project:leave', { projectId });

// Server broadcasts
socket.on('user:left', { userId, userName });
```

### Task Events

#### Task Created
```javascript
// Server broadcasts
socket.on('task:created', {
  task: { ... },
  projectId,
  createdBy
});
```

#### Task Updated
```javascript
// Server broadcasts
socket.on('task:updated', {
  task: { ... },
  projectId,
  updatedBy
});
```

#### Task Assigned
```javascript
// Server broadcasts
socket.on('task:assigned', {
  task: { ... },
  projectId,
  assignedBy
});
```

#### Task Deleted
```javascript
// Server broadcasts
socket.on('task:deleted', {
  taskId,
  projectId,
  deletedBy
});
```

### Cursor Events

#### Cursor Move
```javascript
// Client emits
socket.emit('cursor:move', {
  projectId,
  x,
  y
});

// Server broadcasts
socket.on('cursor:update', {
  userId,
  userName,
  x,
  y
});
```

## 🗄️ Database Models

### User Model
```typescript
{
  name: string;
  email: string;
  password: string; // Hashed
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Model
```typescript
{
  name: string;
  description?: string;
  createdBy: ObjectId; // User reference
  members: [{
    user: ObjectId; // User reference
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Model
```typescript
{
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  project: ObjectId; // Project reference
  assignedTo?: ObjectId; // User reference
  createdBy: ObjectId; // User reference
  position: number;
  dueDate?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Comment Model
```typescript
{
  content: string;
  user: ObjectId; // User reference
  task: ObjectId; // Task reference
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity Model
```typescript
{
  type: string; // 'task_created', 'status_changed', etc.
  user: ObjectId; // User reference
  task: ObjectId; // Task reference
  project: ObjectId; // Project reference
  details: object; // Activity-specific data
  createdAt: Date;
}
```

### Notification Model
```typescript
{
  type: string; // 'task_assigned', 'task_comment', etc.
  title: string;
  message: string;
  read: boolean;
  user: ObjectId; // Recipient
  actor?: ObjectId; // User who triggered
  task?: ObjectId; // Related task
  project?: ObjectId; // Related project
  createdAt: Date;
}
```

## 🔐 Authentication & Authorization

### JWT Authentication

```typescript
// Generate token
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);

// Verify token (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
req.userId = decoded.userId;
```

### Role-Based Access Control

```typescript
// Project roles
enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

// Permissions
const permissions = {
  owner: ['all'],
  admin: ['manage_members', 'manage_tasks', 'delete_tasks'],
  member: ['view', 'create_tasks', 'update_own_tasks']
};
```

### Protected Routes

```typescript
// Require authentication
router.use(authenticate);

// Require project membership
router.use(requireProjectMember);

// Require specific role
router.use(requireRole(['owner', 'admin']));
```

## 🛡️ Security

### Security Measures
- **Password Hashing** - Bcrypt with 10 rounds
- **JWT Tokens** - Secure token generation
- **Rate Limiting** - 100 requests per 15 minutes
- **CORS** - Configured for frontend origin
- **Helmet.js** - Security headers
- **Input Validation** - Express Validator
- **XSS Protection** - Input sanitization
- **NoSQL Injection Prevention** - Mongoose sanitization

### Environment Variables Security
```env
# Never commit these to version control
JWT_SECRET=use-a-strong-random-secret-here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

## 📊 Database Optimization

### Indexes
```typescript
// User indexes
userSchema.index({ email: 1 }, { unique: true });

// Project indexes
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'members.user': 1 });

// Task indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1, position: 1 });

// Activity indexes
activitySchema.index({ task: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
```

### Query Optimization
- Use `.lean()` for read-only queries
- Use `.select()` to limit fields
- Use pagination for large datasets
- Use aggregation for complex queries

## 🧪 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run database migrations
npm run create-indexes
npm run migrate-positions
npm run migrate-soft-delete

# Type check
npm run type-check
```

### Testing

```bash
# Run tests (if configured)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🐛 Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 📦 Dependencies

### Core Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - WebSocket library
- `jsonwebtoken` - JWT implementation
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation
- `dotenv` - Environment variables

### Dev Dependencies
- `typescript` - Type checking
- `ts-node` - TypeScript execution
- `nodemon` - Development server
- `@types/*` - Type definitions

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Use MongoDB Atlas or production database
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Review security headers

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri

# Deploy
git push heroku main
```

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [JWT Documentation](https://jwt.io)

---

**Built with Node.js, Express, TypeScript, and MongoDB**


<!-- HELLO VIJAY -->
