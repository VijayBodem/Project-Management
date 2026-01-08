# 🚀 Project Management System

A comprehensive full-stack collaborative project management platform with enterprise-grade security, real-time collaboration, and advanced task management features. Built with modern technologies including React, TypeScript, Node.js, Express, MongoDB, and Socket.IO.

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

This enterprise-level project management system empowers teams to collaborate efficiently with real-time synchronization, secure authentication, role-based access control, and comprehensive project tracking. The platform supports multiple projects with Kanban boards, advanced task management, team collaboration, and detailed activity tracking.

### 🏢 Use Cases

- **Software Development Teams** - Sprint planning, bug tracking, and release management
- **Marketing Agencies** - Campaign planning and content coordination
- **Design Teams** - Project organization and review workflows
- **Remote Teams** - Cross-timezone collaboration with real-time updates
- **Freelancers** - Multi-client project management
- **Product Teams** - Feature development and roadmap tracking

## ✨ Key Features

### 🔐 Authentication & Security

- **Multi-Device Session Management** - Secure concurrent login detection and OTP verification
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Role-Based Access Control** - Owner, Admin, Member, and Viewer project roles
- **Advanced Security** - Rate limiting, input validation, XSS protection, and secure headers
- **Session Tracking** - Device fingerprinting, geolocation, and activity monitoring

### 📊 Project Management

- **Project Creation & Organization** - Create and manage multiple projects with custom descriptions
- **Team Management** - Invite members with granular permission control
- **Project Statistics** - Real-time progress tracking and analytics
- **Project Settings** - Customize project properties and member roles

### 🎯 Task Management

- **Kanban Board** - Visual drag-and-drop task organization
- **Task Properties** - Title, description, priority levels, due dates, and assignees
- **Status Workflow** - Todo → In Progress → Done with smooth transitions
- **Task Assignment** - Assign tasks to team members with notifications
- **Bulk Operations** - Multi-task status updates and assignments

### 👥 Real-Time Collaboration

- **Live Synchronization** - Instant updates across all connected clients
- **Presence Indicators** - See who's currently viewing projects and tasks
- **Collaborative Cursors** - Real-time cursor tracking during collaboration
- **Live Notifications** - Instant alerts for task assignments and updates
- **Activity Feed** - Complete audit trail of all project activities

### 💬 Communication

- **Task Comments** - Threaded discussions on individual tasks
- **Activity Tracking** - Detailed logs of all changes and actions
- **Mention System** - Tag team members in comments and tasks
- **Real-time Updates** - Live comment synchronization

### 🔍 Advanced Features

- **Global Search** - Search across projects, tasks, and team members
- **Advanced Filtering** - Filter tasks by status, assignee, priority, and due dates
- **Personal Dashboard** - User's assigned tasks and project overview
- **Notification Center** - Centralized notification management with read/unread status
- **Export Capabilities** - Export project data and task lists

### 🎨 User Experience

- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Intuitive UI** - Clean, modern interface with smooth animations
- **Toast Notifications** - Non-intrusive feedback for user actions
- **Loading States** - Progressive loading and skeleton screens

### 📱 Mobile Experience

- **Responsive Layout** - Adapts seamlessly to all screen sizes
- **Touch Gestures** - Swipe actions for task management
- **Mobile-Optimized** - Dedicated mobile interface elements
- **Offline Support** - Basic offline functionality with sync

### 🔧 Technical Features

- **TypeScript** - Full type safety across frontend and backend
- **Database Optimization** - Indexed queries and efficient data retrieval
- **API Documentation** - Comprehensive REST API with examples
- **Error Handling** - Centralized error management with user-friendly messages
- **Performance Monitoring** - Built-in performance tracking and optimization

## 🏗️ Architecture

### 🖥️ Frontend Architecture

- **React 19** with TypeScript for type-safe component development
- **Vite** for lightning-fast development server and optimized production builds
- **Tailwind CSS** for utility-first styling with full dark mode support
- **React Router DOM** for client-side routing and navigation
- **Socket.IO Client** for real-time bidirectional communication
- **React Beautiful DnD** for smooth drag-and-drop task management
- **Axios** for robust HTTP client with interceptors
- **Zod** for runtime type validation and schema enforcement
- **React Hook Form** for performant form handling with validation
- **Lucide React** for consistent, scalable iconography

### 🖧 Backend Architecture

- **Node.js 18+** with Express.js for scalable server-side development
- **TypeScript** for complete type safety and better developer experience
- **MongoDB** with Mongoose ODM for flexible document-based data storage
- **Socket.IO** for real-time WebSocket communication and event handling
- **JWT** for secure authentication with access and refresh token patterns
- **Bcrypt** for secure password hashing with configurable rounds
- **Nodemailer** for email service integration (OTP, notifications)
- **Express Rate Limit** for DDoS protection and abuse prevention
- **Helmet.js** for security headers and XSS protection
- **CORS** for cross-origin resource sharing configuration

### 🗄️ Database Design

- **User Model** - Authentication, profiles, preferences, and session management
- **Project Model** - Project metadata, member relationships, and settings
- **Task Model** - Task details, assignments, priorities, and status tracking
- **Session Model** - Multi-device session tracking with security metadata
- **Activity Model** - Comprehensive audit trail for all user actions
- **Comment Model** - Task discussions and threaded conversations
- **Notification Model** - Real-time notification system with read status
- **OTP Model** - Secure one-time password generation and validation

### 🔄 Real-Time Communication

- **Socket.IO Rooms** - Project-based and user-specific room management
- **Event-Driven Architecture** - Decoupled event handling for scalability
- **Presence System** - Real-time user presence and cursor tracking
- **Notification Broadcasting** - Instant notification delivery to relevant users
- **Collaborative Features** - Live cursor positions and simultaneous editing support

### 🛡️ Security Architecture

- **Multi-Layer Authentication** - JWT tokens with OTP verification for suspicious logins
- **Session Management** - Device fingerprinting and concurrent session control
- **Role-Based Permissions** - Granular access control with project and task permissions
- **Input Validation** - Client and server-side validation with Zod schemas
- **Rate Limiting** - Configurable rate limits for API endpoints and authentication
- **Data Sanitization** - XSS prevention and NoSQL injection protection
- **Secure Headers** - Helmet.js configuration for security best practices
- **Password Security** - Bcrypt hashing with salt rounds for secure storage

## 🔄 Application Workflows

### 1. 🔐 Authentication & Onboarding

```
New User Registration
├── User visits registration page
├── Provides email, name, and secure password
├── System validates input and creates account
├── User receives welcome notification
└── Automatic login with JWT token generation

Existing User Login
├── User provides email and password
├── System validates credentials
├── Checks for concurrent sessions from different devices
├── If suspicious: Triggers OTP verification via email
├── Successful authentication with token generation
└── Socket connection establishment for real-time features
```

### 2. 📁 Project Lifecycle Management

```
Project Creation & Setup
├── User creates project with title and description
├── System generates unique project identifier
├── Creator automatically becomes project owner
├── Project appears in dashboard with management options
└── Ready for team member invitations

Team Member Management
├── Project owner/admin invites members via email
├── Members receive invitation notifications
├── Role assignment (Owner/Admin/Member/Viewer)
├── Permission inheritance based on assigned roles
├── Real-time member list updates for all project viewers
└── Activity logging for all membership changes
```

### 3. 🎯 Task Management Workflow

```
Task Creation & Assignment
├── User creates task with title, description, priority
├── Optional due date and assignee assignment
├── Task appears in appropriate Kanban column (Todo)
├── Real-time broadcast to all project viewers
└── Notification sent to assigned user (if applicable)

Task Progression & Updates
├── Drag-and-drop status changes (Todo → In Progress → Done)
├── Real-time position updates within columns
├── Task details editing (description, priority, due dates)
├── Assignee changes with notification delivery
├── Comment addition triggers activity logging
└── All changes broadcast instantly to collaborators

Task Completion & Archival
├── Task moved to "Done" column
├── Completion timestamp recorded
├── Activity log entry created
├── Project statistics automatically updated
└── Task remains searchable and referenceable
```

### 4. 👥 Real-Time Collaboration

```
Live Collaboration Session
├── Multiple users join project room via Socket.IO
├── Presence indicators show active collaborators
├── Cursor positions tracked and displayed
├── Task updates broadcast instantly
├── Comments appear in real-time
└── Notification center updates live

Conflict Resolution
├── Optimistic UI updates for smooth experience
├── Server validation prevents conflicts
├── Failed operations trigger user feedback
├── Automatic UI reconciliation on errors
└── Comprehensive error handling and recovery
```

### 5. 📊 Advanced Features Usage

```
Global Search & Discovery
├── User enters search query in global search
├── System searches across projects, tasks, and members
├── Results categorized by type (projects/tasks)
├── Permission-based result filtering
└── Direct navigation to matched items

Notification Management
├── User receives real-time notifications
├── Toast notifications for immediate awareness
├── Persistent notification center for history
├── Mark as read/unread functionality
├── Bulk notification management
└── Notification preferences in user profile

Personal Dashboard & Tasks
├── User views assigned tasks across all projects
├── Filter by status, priority, and due dates
├── Quick action buttons for status updates
├── Project context maintained
└── Progress tracking and deadline awareness
```

### 6. 🔒 Security & Session Management

```
Multi-Device Session Control
├── User logs in from new device
├── System detects different device fingerprint
├── OTP verification required for security
├── Successful verification creates new session
└── User can manage all sessions in profile

Session Lifecycle
├── Active session tracking with device metadata
├── Automatic session cleanup on logout
├── "Logout other devices" functionality
├── Session timeout handling
└── Security event logging and monitoring
```

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js**: Version 18.0 or higher (LTS recommended)
- **MongoDB**: Version 5.0 or higher (local installation or Atlas cloud)
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control

### 🛠️ Installation & Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-management-system
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env  # If available, or create .env file
```

**Required Backend Environment Variables (.env):**

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

# Email Service (for OTP verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env  # If available, or create .env file
```

**Required Frontend Environment Variables (.env):**

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_API_SOCKET_URL=http://localhost:5000

# Optional: App Configuration
VITE_APP_NAME=Project Management System
VITE_APP_VERSION=1.0.0
```

#### 4. Database Setup

```bash
# Start MongoDB service (if using local installation)
# On macOS with Homebrew:
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Debian:
sudo systemctl start mongod

# Or use MongoDB Atlas cloud database by updating MONGODB_URI
```

#### 5. Database Initialization

```bash
# Navigate to backend directory
cd backend

# Create database indexes for performance
npm run db:indexes

# Optional: Run data migrations (if upgrading from older version)
npm run db:migrate:soft-delete
npm run db:migrate:task-position
npm run db:migrate:task-assignments
```

#### 6. Start the Application

**Development Mode (Recommended):**

```bash
# Terminal 1 - Start Backend Server
cd backend
npm run dev

# Terminal 2 - Start Frontend Development Server
cd frontend
npm run dev
```

**Production Mode:**

```bash
# Terminal 1 - Build and Start Backend
cd backend
npm run build
npm start

# Terminal 2 - Build and Start Frontend
cd frontend
npm run build
npm run preview  # Or deploy the dist/ folder
```

#### 7. Access the Application

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/docs (if Swagger is configured)

### 🧪 Testing the Setup

1. **Open the frontend application** in your browser
2. **Register a new account** or login with existing credentials
3. **Create a new project** from the dashboard
4. **Add team members** to your project
5. **Create tasks** and assign them to team members
6. **Test real-time collaboration** by opening multiple browser tabs
7. **Verify notifications** are working properly

### 🔧 Troubleshooting

#### Common Issues:

**MongoDB Connection Error:**

- Ensure MongoDB is running: `brew services list | grep mongodb`
- Check connection string in `.env`
- Verify MongoDB user permissions if using authentication

**Port Already in Use:**

- Change PORT in backend `.env` (try 5001, 5002, etc.)
- Update frontend `.env` VITE_API_URL accordingly

**Socket.IO Connection Failed:**

- Verify VITE_API_SOCKET_URL matches backend PORT
- Check browser console for WebSocket errors
- Ensure CORS_ORIGIN allows frontend domain

**Authentication Issues:**

- Verify JWT secrets are strong and unique
- Check token expiration times
- Clear browser localStorage and retry

#### Development Commands:

```bash
# Backend development commands
cd backend
npm run dev              # Start with hot reload
npm run build           # Build for production
npm run start           # Start production server
npm run db:indexes      # Create database indexes

# Frontend development commands
cd frontend
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

## 📚 Documentation

### 📖 Complete Documentation Set

#### 🔐 Core System Documentation

- **[Authentication & Session Management](./AUTHENTICATION_AND_SESSION_MANAGEMENT.md)**

  - Complete authentication flow documentation
  - Multi-device session management with OTP verification
  - Security features and session isolation
  - Logout scenarios and real-time session termination

- **[Features Documentation](./FEATURES_DOCUMENTATION.md)**

  - Comprehensive feature guide with usage instructions
  - Project management, task workflows, and team collaboration
  - Real-time features, UI components, and advanced functionality
  - Mobile experience and accessibility features

- **[API Documentation](./API_DOCUMENTATION.md)**
  - Complete REST API reference with examples
  - Authentication, project, task, and user management endpoints
  - WebSocket events and real-time communication
  - Error handling, rate limiting, and data formats

### 🔗 API Reference

#### Base URL: `http://localhost:5000/api`

#### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /security/verify-otp` - OTP verification for security
- `POST /token/refresh` - Refresh access tokens
- `POST /token/logout` - Logout current session

#### Project Management

- `GET /projects` - Get user's projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project (soft delete)
- `GET /projects/:id/stats` - Get project statistics

#### Task Management

- `GET /tasks/project/:projectId` - Get project tasks
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `PATCH /tasks/:id/status` - Update task status
- `PATCH /tasks/:id/assign` - Assign/unassign task
- `DELETE /tasks/:id` - Delete task (soft delete)

#### Team Management

- `GET /members/project/:projectId` - Get project members
- `POST /members/project/:projectId` - Add team member
- `PATCH /members/project/:projectId/member/:memberId` - Update member role
- `DELETE /members/project/:projectId/member/:memberId` - Remove member

#### Communication & Activity

- `GET /comments/task/:taskId` - Get task comments
- `POST /comments` - Add comment
- `PUT /comments/:id` - Edit comment
- `DELETE /comments/:id` - Delete comment
- `GET /activities/task/:taskId` - Get task activity log

#### User Management & Search

- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update profile
- `PUT /user/password` - Change password
- `GET /search?q=query&filter=all` - Global search

#### Session Management

- `GET /security/sessions` - Get user sessions
- `POST /security/sessions/logout` - Logout specific session
- `POST /security/sessions/logout-all` - Logout multiple sessions

### 🔌 WebSocket Events

#### Real-Time Collaboration

- `project:join` - Join project room
- `project:leave` - Leave project room
- `cursor:move` - Update cursor position
- `task:created` - New task notification
- `task:updated` - Task update notification
- `task:assigned` - Task assignment notification
- `task:deleted` - Task deletion notification

#### Presence & Activity

- `user:joined` - User joined project
- `user:left` - User left project
- `cursor:update` - Cursor position update

## 📁 Project Structure

```
project-management-system/
├── 📁 frontend/                          # React SPA Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/                # Reusable UI Components
│   │   │   ├── CollaborativeCursor.tsx   # Real-time cursor tracking
│   │   │   ├── KanbanBoard.tsx          # Drag-drop task board
│   │   │   ├── NotificationCenter.tsx   # Notification management
│   │   │   ├── OTPVerificationModal.tsx # Security verification
│   │   │   └── TaskDetailsModal.tsx     # Task editing interface
│   │   ├── 📁 pages/                    # Route-based page components
│   │   │   ├── Dashboard.tsx           # Project overview
│   │   │   ├── ProjectBoard.tsx        # Kanban board view
│   │   │   ├── MyTasks.tsx             # Personal task view
│   │   │   ├── UserProfile.tsx         # User settings
│   │   │   ├── Login.tsx               # Authentication
│   │   │   └── Register.tsx            # User registration
│   │   ├── 📁 context/                 # React Context providers
│   │   │   ├── AuthContext.tsx         # Authentication state
│   │   │   └── ThemeContext.tsx        # Dark mode state
│   │   ├── 📁 services/                # API & external services
│   │   │   ├── api.ts                  # Axios configuration
│   │   │   ├── socket.ts               # WebSocket client
│   │   │   └── *.service.ts            # Feature-specific APIs
│   │   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── 📁 types/                   # TypeScript definitions
│   │   └── 📁 utils/                   # Helper functions
│   └── 📄 README.md                    # Frontend documentation
│
├── 📁 backend/                           # Node.js API Backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/              # Request handlers
│   │   │   ├── auth.controllers.ts      # Authentication logic
│   │   │   ├── session.controllers.ts   # Session management
│   │   │   ├── project.controllers.ts   # Project operations
│   │   │   ├── task.controllers.ts      # Task management
│   │   │   └── *.controllers.ts         # Feature controllers
│   │   ├── 📁 models/                   # MongoDB schemas
│   │   │   ├── User.ts                  # User model
│   │   │   ├── Project.ts               # Project model
│   │   │   ├── Task.ts                  # Task model
│   │   │   ├── Session.ts               # Session tracking
│   │   │   └── Activity.ts              # Audit trail
│   │   ├── 📁 routes/                   # API route definitions
│   │   ├── 📁 middlewares/              # Express middlewares
│   │   │   ├── auth.middleware.ts       # JWT verification
│   │   │   ├── permission.middleware.ts # RBAC enforcement
│   │   │   └── security.middleware.ts   # Security headers
│   │   ├── 📁 socket/                   # WebSocket handlers
│   │   ├── 📁 services/                 # Business logic services
│   │   └── 📁 utils/                    # Helper utilities
│   ├── 📁 scripts/                      # Database scripts
│   ├── 📄 README.md                     # Backend documentation
│   ├── 📄 SECURITY.md                   # Security documentation
│   └── 📄 DATABASE_OPTIMIZATION.md      # Database guide
│
├── 📄 AUTHENTICATION_AND_SESSION_MANAGEMENT.md  # Auth documentation
├── 📄 README.md                          # Main project documentation
└── 📄 package.json                       # Project metadata
```

## 🔑 Technology Stack

| Category     | Technology          | Purpose                               |
| ------------ | ------------------- | ------------------------------------- |
| **Frontend** | React 19            | Component-based UI framework          |
|              | TypeScript          | Type-safe JavaScript                  |
|              | Vite                | Fast build tool and dev server        |
|              | Tailwind CSS        | Utility-first CSS framework           |
|              | React Router        | Client-side routing                   |
|              | Socket.IO Client    | Real-time communication               |
|              | React Beautiful DnD | Drag-and-drop functionality           |
|              | Axios               | HTTP client with interceptors         |
|              | Zod                 | Runtime type validation               |
|              | React Hook Form     | Form state management                 |
| **Backend**  | Node.js 18+         | JavaScript runtime                    |
|              | Express.js          | Web application framework             |
|              | TypeScript          | Type safety                           |
|              | MongoDB             | NoSQL document database               |
|              | Mongoose            | MongoDB object modeling               |
|              | Socket.IO           | Real-time bidirectional communication |
|              | JWT                 | JSON Web Token authentication         |
|              | Bcrypt              | Password hashing                      |
|              | Nodemailer          | Email service integration             |
|              | Express Rate Limit  | Rate limiting middleware              |
|              | Helmet.js           | Security headers                      |
| **DevOps**   | ESLint              | Code linting                          |
|              | Prettier            | Code formatting                       |
|              | Husky               | Git hooks                             |
|              | Docker              | Containerization                      |
|              | PM2                 | Process management                    |

## 🔐 Security Features

- JWT-based authentication with secure token storage
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- XSS protection
- SQL injection prevention (NoSQL)

## 🎯 Use Cases

1. **Software Development Teams** - Manage sprints, track bugs, and coordinate releases
2. **Marketing Teams** - Plan campaigns, assign tasks, and track deliverables
3. **Design Teams** - Organize design projects and review workflows
4. **Remote Teams** - Collaborate across time zones with real-time updates
5. **Freelancers** - Manage multiple client projects in one place
