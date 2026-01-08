# 📡 API Documentation

Complete REST API reference for the Project Management System backend, including authentication, project management, task operations, real-time features, and WebSocket events.

## 📋 Table of Contents

- [Base URL & Authentication](#base-url--authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [Project Management](#project-management)
- [Task Management](#task-management)
- [Team Management](#team-management)
- [Communication & Activity](#communication--activity)
- [User Management](#user-management)
- [Search & Discovery](#search--discovery)
- [Session Management](#session-management)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔗 Base URL & Authentication

### Base URL
```
Production: https://api.yourdomain.com/api
Development: http://localhost:5000/api
```

### Authentication Methods

#### JWT Bearer Token
All protected endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <access_token>
```

#### Token Refresh
Access tokens expire in 15 minutes. Use refresh tokens to obtain new access tokens:
```http
POST /token/refresh
Authorization: Bearer <refresh_token>
```

---

## 🔐 Authentication Endpoints

### Register User
Create a new user account with email verification.

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": false
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

### User Login
Authenticate user and return JWT tokens.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "deviceFingerprint": "abc123def456",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "browser": "Chrome",
    "os": "Windows",
    "device": "desktop"
  }
}
```

**Response (200 OK - Normal Login):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionToken": "sess_abc123def456"
}
```

**Response (200 OK - OTP Required):**
```json
{
  "success": true,
  "requiresOTP": true,
  "message": "OTP sent to your email for verification",
  "tempToken": "temp_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Verify OTP
Complete authentication with one-time password.

```http
POST /security/verify-otp
Authorization: Bearer <temp_token>
Content-Type: application/json

{
  "otp": "123456",
  "purpose": "login",
  "deviceFingerprint": "abc123def456",
  "deviceInfo": { ... }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionToken": "sess_abc123def456"
}
```

### Refresh Token
Obtain new access token using refresh token.

```http
POST /token/refresh
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
Terminate current user session.

```http
POST /token/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "sessionToken": "sess_abc123def456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📁 Project Management

### Get User Projects
Retrieve all projects where user is a member.

```http
GET /projects
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: "createdAt")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Response (200 OK):**
```json
{
  "success": true,
  "projects": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "E-commerce Platform",
      "description": "Building a modern e-commerce solution",
      "createdBy": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "members": [
        {
          "user": {
            "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
            "name": "John Doe"
          },
          "role": "owner",
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "isDeleted": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Create Project
Create a new project and become its owner.

```http
POST /projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Mobile App Development",
  "description": "Native mobile application for iOS and Android"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "name": "Mobile App Development",
    "description": "Native mobile application for iOS and Android",
    "createdBy": "64f1a2b3c4d5e6f7g8h9i0j1",
    "members": [
      {
        "user": "64f1a2b3c4d5e6f7g8h9i0j1",
        "role": "owner",
        "joinedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "isDeleted": false,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Get Project Details
Retrieve detailed information about a specific project.

```http
GET /projects/:projectId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "project": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "name": "Mobile App Development",
    "description": "Native mobile application for iOS and Android",
    "createdBy": { ... },
    "members": [ ... ],
    "isDeleted": false,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Update Project
Modify project name and description.

```http
PUT /projects/:projectId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated project description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "project": { ... }
}
```

### Delete Project
Soft delete a project (requires owner permissions).

```http
DELETE /projects/:projectId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Get Project Statistics
Retrieve comprehensive project analytics.

```http
GET /projects/:projectId/stats
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "project": { ... },
  "stats": {
    "totalTasks": 15,
    "completedTasks": 8,
    "inProgressTasks": 4,
    "todoTasks": 3,
    "overdueTasks": 1,
    "totalMembers": 5,
    "activeMembers": 4,
    "completionRate": 53.33
  }
}
```

---

## 🎯 Task Management

### Get Project Tasks
Retrieve all tasks for a specific project.

```http
GET /tasks/project/:projectId
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status ("todo", "in-progress", "done")
- `assignedTo` (optional): Filter by assignee user ID
- `priority` (optional): Filter by priority ("low", "medium", "high", "urgent")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: "position")
- `sortOrder` (optional): Sort order (default: "asc")

**Response (200 OK):**
```json
{
  "success": true,
  "tasks": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "title": "Design User Interface",
      "description": "Create wireframes and mockups for the main screens",
      "status": "in-progress",
      "priority": "high",
      "project": "64f1a2b3c4d5e6f7g8h9i0j3",
      "assignedTo": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
        "name": "Jane Smith",
        "email": "jane.smith@example.com"
      },
      "createdBy": { ... },
      "position": 0,
      "dueDate": "2024-02-15T00:00:00.000Z",
      "isDeleted": false,
      "createdAt": "2024-01-15T11:15:00.000Z",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Create Task
Create a new task in a project.

```http
POST /tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement User Authentication",
  "description": "Add login, registration, and password reset functionality",
  "project": "64f1a2b3c4d5e6f7g8h9i0j3",
  "assignedTo": "64f1a2b3c4d5e6f7g8h9i0j5",
  "priority": "high",
  "dueDate": "2024-02-01"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": { ... }
}
```

### Update Task
Modify task details.

```http
PUT /tasks/:taskId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Task Title",
  "description": "Updated task description",
  "priority": "urgent",
  "dueDate": "2024-01-30"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": { ... }
}
```

### Update Task Status
Change task status and position (used for drag-and-drop).

```http
PATCH /tasks/:taskId/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "in-progress",
  "position": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "task": { ... }
}
```

### Assign/Unassign Task
Change task assignment.

```http
PATCH /tasks/:taskId/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "64f1a2b3c4d5e6f7g8h9i0j5"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "task": { ... }
}
```

### Delete Task
Soft delete a task.

```http
DELETE /tasks/:taskId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 👥 Team Management

### Get Project Members
Retrieve all members of a project with their roles.

```http
GET /members/project/:projectId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "members": [
    {
      "user": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "role": "owner",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "user": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
        "name": "Jane Smith",
        "email": "jane.smith@example.com"
      },
      "role": "admin",
      "joinedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "createdBy": { ... }
}
```

### Add Team Member
Invite a new member to the project.

```http
POST /members/project/:projectId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "new.member@example.com",
  "role": "member"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Member invitation sent successfully"
}
```

### Update Member Role
Change a member's role in the project.

```http
PATCH /members/project/:projectId/member/:memberId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member role updated successfully"
}
```

### Remove Member
Remove a member from the project.

```http
DELETE /members/project/:projectId/member/:memberId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## 💬 Communication & Activity

### Get Task Comments
Retrieve all comments for a specific task.

```http
GET /comments/task/:taskId
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "comments": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
      "content": "I've completed the initial design. Please review.",
      "user": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
        "name": "Jane Smith",
        "email": "jane.smith@example.com"
      },
      "task": "64f1a2b3c4d5e6f7g8h9i0j4",
      "edited": false,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Add Comment
Create a new comment on a task.

```http
POST /comments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "task": "64f1a2b3c4d5e6f7g8h9i0j4",
  "content": "Great work on the design! Just a few minor suggestions..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": { ... }
}
```

### Update Comment
Edit an existing comment (only by author).

```http
PUT /comments/:commentId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Updated comment content"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "comment": { ... }
}
```

### Delete Comment
Remove a comment (author or admin only).

```http
DELETE /comments/:commentId
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Get Task Activities
Retrieve activity log for a specific task.

```http
GET /activities/task/:taskId
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "activities": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j7",
      "type": "task_created",
      "user": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "John Doe"
      },
      "task": "64f1a2b3c4d5e6f7g8h9i0j4",
      "project": "64f1a2b3c4d5e6f7g8h9i0j3",
      "details": {
        "title": "Design User Interface",
        "priority": "high"
      },
      "createdAt": "2024-01-15T11:15:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j8",
      "type": "status_changed",
      "user": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
        "name": "Jane Smith"
      },
      "task": "64f1a2b3c4d5e6f7g8h9i0j4",
      "project": "64f1a2b3c4d5e6f7g8h9i0j3",
      "details": {
        "oldStatus": "todo",
        "newStatus": "in-progress"
      },
      "createdAt": "2024-01-15T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 👤 User Management

### Get User Profile
Retrieve current user's profile information.

```http
GET /user/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": false
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Profile
Modify user profile information.

```http
PUT /user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Smith",
  "preferences": {
    "emailNotifications": false,
    "pushNotifications": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Change Password
Update user password (requires current password).

```http
PUT /user/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🔍 Search & Discovery

### Global Search
Search across projects, tasks, and team members.

```http
GET /search?q=authentication&filter=all
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q` (required): Search query string
- `filter` (optional): Search scope ("all", "projects", "tasks") - default: "all"
- `page` (optional): Page number - default: 1
- `limit` (optional): Results per page - default: 20

**Response (200 OK):**
```json
{
  "success": true,
  "results": {
    "projects": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "name": "Mobile App Development",
        "description": "Native mobile application...",
        "matchScore": 0.85
      }
    ],
    "tasks": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
        "title": "Implement User Authentication",
        "description": "Add login, registration...",
        "project": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
          "name": "Mobile App Development"
        },
        "matchScore": 0.92
      }
    ],
    "members": []
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 🔒 Session Management

### Get User Sessions
Retrieve all active sessions for the current user.

```http
GET /security/sessions
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j9",
      "sessionToken": "sess_abc123def456",
      "deviceInfo": {
        "fingerprint": "chrome_desktop_win10_1920x1080",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "browser": "Chrome",
        "browserVersion": "120.0.0.0",
        "os": "Windows",
        "device": "desktop",
        "platform": "Win32"
      },
      "location": {
        "ip": "192.168.1.100",
        "country": "United States",
        "city": "San Francisco",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "loginTime": "2024-01-15T14:30:00.000Z",
      "lastActivity": "2024-01-15T15:45:00.000Z",
      "isActive": true,
      "loginMethod": "otp",
      "isCurrentSession": true
    }
  ]
}
```

### Logout Specific Session
Logout a specific session (requires OTP verification).

```http
POST /security/sessions/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "sessionToken": "sess_xyz789ghi012",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session logged out successfully"
}
```

### Logout All Sessions
Logout all sessions or other sessions only.

```http
POST /security/sessions/logout-all
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "otp": "123456",
  "exceptCurrent": false  // true to logout other sessions only
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out from 3 sessions",
  "loggedOutCount": 3
}
```

---

## 🔌 WebSocket Events

### Connection Management

#### Connect to Server
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-access-token',
    sessionToken: 'your-session-token'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

#### Join Project Room
```javascript
// Client emits
socket.emit('project:join', {
  projectId: '64f1a2b3c4d5e6f7g8h9i0j3'
});

// Server responds
socket.on('user:joined', (data) => {
  console.log('User joined:', data.userId);
});

socket.on('project:current-viewers', (data) => {
  console.log('Current viewers:', data);
});
```

#### Leave Project Room
```javascript
// Client emits
socket.emit('project:leave', {
  projectId: '64f1a2b3c4d5e6f7g8h9i0j3'
});

// Server responds
socket.on('user:left', (data) => {
  console.log('User left:', data.userId);
});
```

### Task Events

#### Task Created
```javascript
// Server broadcasts to project room
socket.on('task:created', (data) => {
  console.log('New task:', data.task);
  // Update UI with new task
});
```

#### Task Updated
```javascript
// Server broadcasts to project room
socket.on('task:updated', (data) => {
  console.log('Task updated:', data.task);
  // Update task in UI
});
```

#### Task Assigned
```javascript
// Server broadcasts to project room
socket.on('task:assigned', (data) => {
  console.log('Task assigned:', data.task);
  // Update task assignment in UI
});
```

#### Task Deleted
```javascript
// Server broadcasts to project room
socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data.taskId);
  // Remove task from UI
});
```

### Presence & Cursor Events

#### Cursor Movement
```javascript
// Client emits cursor position
socket.emit('cursor:move', {
  projectId: '64f1a2b3c4d5e6f7g8h9i0j3',
  x: 450,
  y: 320
});

// Server broadcasts to other clients in project
socket.on('cursor:update', (data) => {
  console.log('Cursor moved:', data);
  // Update cursor position in UI
});
```

### Notification Events

#### Real-time Notifications
```javascript
// Server broadcasts to user-specific room
socket.on('notification:new', (data) => {
  console.log('New notification:', data.notification);
  // Show notification in UI
});
```

#### Session Logout
```javascript
// Server broadcasts to specific session
socket.on('auth:logout', (data) => {
  console.log('Logged out:', data.message);
  // Clear local storage and redirect to login
});
```

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid credentials
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND_ERROR` - Resource not found
- `CONFLICT_ERROR` - Resource conflict
- `RATE_LIMIT_ERROR` - Too many requests
- `SESSION_EXPIRED` - Session/token expired
- `OTP_INVALID` - Invalid OTP code
- `OTP_EXPIRED` - OTP code expired

---

## 🛡️ Rate Limiting

### Rate Limits by Endpoint Category

| Category | Limit | Window | Description |
|----------|-------|--------|-------------|
| Authentication | 5 requests | 15 minutes | Login, register, OTP |
| General API | 100 requests | 15 minutes | Most API endpoints |
| Search | 30 requests | 15 minutes | Search endpoints |
| File Upload | 10 requests | 15 minutes | File upload endpoints |

### Rate Limit Headers

When rate limited, the API returns these headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

### Handling Rate Limits

```javascript
// Example: Handle rate limit error
if (error.response?.status === 429) {
  const resetTime = error.response.headers['x-ratelimit-reset'];
  const waitTime = error.response.headers['retry-after'];

  console.log(`Rate limited. Retry after ${waitTime} seconds`);

  // Implement retry logic or show user-friendly message
  setTimeout(() => {
    // Retry the request
  }, waitTime * 1000);
}
```

---

## 📝 Notes

### Pagination
All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Sorting
Supported sort parameters vary by endpoint. Common options:
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `name`: Alphabetical by name
- `position`: Custom ordering

### Soft Deletes
Deleted resources are marked as `isDeleted: true` rather than being permanently removed. This allows for data recovery and maintains referential integrity.

### Real-time Updates
All collaborative features use WebSocket connections for instant updates. Ensure your client maintains a persistent connection for optimal experience.

### Data Validation
All endpoints use Zod schemas for comprehensive input validation. Invalid data will return detailed error messages with specific field validation errors.
