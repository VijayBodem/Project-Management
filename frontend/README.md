# 🎨 Project Management System - Frontend

A modern, responsive React application with real-time collaboration features, built with TypeScript, Vite, and Tailwind CSS.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [User Interface](#-user-interface)
- [Real-time Features](#-real-time-features)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The frontend delivers a modern, intuitive user experience for collaborative project management with:

- **Single-Page Application (SPA)** built with React 19 and TypeScript
- **Real-time collaboration** with live updates and presence indicators
- **Responsive design** that works seamlessly across all devices
- **Dark mode support** with system preference detection
- **Drag-and-drop task management** with smooth animations
- **Comprehensive notification system** for user awareness
- **Global search** across projects, tasks, and team members
- **Role-based interface** adapting to user permissions

### 🎨 Design Philosophy

- **Modern UI/UX** - Clean, intuitive interface following design system principles
- **Accessibility First** - WCAG compliant with keyboard navigation and screen reader support
- **Performance Optimized** - Lazy loading, code splitting, and optimized rendering
- **Mobile-First** - Responsive design that scales from mobile to desktop
- **Consistent Branding** - Unified design language across all components

---

## ✨ Features

### 📱 Core Functionality

#### Dashboard

- **Project Overview** - Visual cards showing project progress and team members
- **Quick Actions** - One-click project creation and navigation
- **Statistics Display** - Task completion rates and activity indicators
- **Personal Tasks** - Quick access to user's assigned tasks across projects

#### Project Board (Kanban)

- **Three-Column Layout** - Todo, In Progress, Done workflow
- **Drag & Drop** - Intuitive task movement with visual feedback
- **Task Cards** - Compact display of essential task information
- **Real-time Sync** - Instant updates across all connected users

#### Task Management

- **Task Creation** - Rich modal with validation and member assignment
- **Task Details** - Comprehensive modal with tabs for info, comments, and activity
- **Priority Levels** - Visual priority indicators (Low, Medium, High, Urgent)
- **Due Date Tracking** - Calendar integration with overdue highlighting
- **Bulk Operations** - Multi-select tasks for batch operations

#### Team Collaboration

- **Member Management** - Invite, role assignment, and member removal
- **Role-Based UI** - Interface adapts based on user permissions
- **Presence Indicators** - See who's actively viewing the project
- **Collaborative Cursors** - Live cursor positions during collaboration

### 💬 Communication

#### Comments System

- **Task Discussions** - Threaded conversations on individual tasks
- **Rich Text Support** - Formatted text with basic markdown
- **Mention System** - @username notifications for team mentions
- **Edit/Delete** - Comment modification with permission checks

#### Notifications

- **Toast Notifications** - Brief, non-intrusive feedback for actions
- **Notification Center** - Persistent notification management
- **Real-time Alerts** - Instant notifications for task assignments and updates
- **Categorization** - Group notifications by type and project

### 🔍 Advanced Features

#### Global Search

- **Full-Text Search** - Search across project names, task titles, and descriptions
- **Member Discovery** - Find team members by name or email
- **Result Filtering** - Filter by project, type, or date range
- **Quick Navigation** - Direct links to search results

#### User Preferences

- **Profile Management** - Update personal information and avatar
- **Notification Settings** - Configure email and push notification preferences
- **Theme Selection** - Light, dark, or system preference
- **Password Management** - Secure password updates

#### Session Management

- **Device Overview** - View all active sessions across devices
- **Session Details** - Device info, location, and login time
- **Remote Logout** - Logout specific sessions or all other devices
- **Security Verification** - OTP confirmation for sensitive operations

### 🎨 User Experience

#### Accessibility

- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - ARIA labels and semantic HTML
- **High Contrast** - Improved visibility options
- **Focus Management** - Clear focus indicators and logical tab order

---

## 🏗️ Architecture

### Technology Stack

| Category             | Technology        | Version  | Purpose                                          |
| -------------------- | ----------------- | -------- | ------------------------------------------------ |
| **Framework**        | React             | 19.2+    | Component-based UI library                       |
| **Language**         | TypeScript        | 5.5+     | Type safety and developer experience             |
| **Build Tool**       | Vite              | 5.4+     | Fast development and optimized production builds |
| **Styling**          | Tailwind CSS      | 4.1+     | Utility-first CSS framework                      |
| **Routing**          | React Router DOM  | 7.11+    | Client-side routing                              |
| **State Management** | React Context     | Built-in | Global state management                          |
| **HTTP Client**      | Axios             | 1.13+    | API communication with interceptors              |
| **WebSocket**        | Socket.IO Client  | 4.8+     | Real-time bidirectional communication            |
| **Drag & Drop**      | @hello-pangea/dnd | 18.0+    | Smooth drag-and-drop interactions                |
| **Forms**            | React Hook Form   | 7.69+    | Performant form state management                 |
| **Validation**       | Zod               | 3.22+    | Runtime type validation                          |
| **Icons**            | Lucide React      | 0.562+   | Consistent, scalable iconography                 |

### Project Structure

```
frontend/
├── public/                      # Static assets
│   ├── favicon.ico             # Application favicon
│   └── vite.svg                # Vite logo
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx      # Button component variants
│   │   │   ├── Input.tsx       # Form input components
│   │   │   ├── Modal.tsx       # Modal dialog system
│   │   │   └── Badge.tsx       # Status and label badges
│   │   │
│   │   ├── CollaborativeCursor.tsx  # Real-time cursor display
│   │   ├── CreateProjectModal.tsx   # Project creation dialog
│   │   ├── CreateTaskModal.tsx      # Task creation form
│   │   ├── KanbanBoard.tsx          # Main Kanban board
│   │   ├── NotificationCenter.tsx   # Notification management
│   │   ├── OTPVerificationModal.tsx # Security verification
│   │   ├── PresenceIndicator.tsx    # User presence display
│   │   ├── ProjectCard.tsx          # Project overview cards
│   │   ├── SearchModal.tsx          # Global search interface
│   │   ├── TaskCard.tsx             # Task display cards
│   │   ├── TaskDetailsModal.tsx     # Comprehensive task view
│   │   └── ToastNotification.tsx    # Toast notification system
│   │
│   ├── pages/                  # Route-based page components
│   │   ├── Dashboard.tsx       # Main dashboard view
│   │   ├── Login.tsx           # Authentication page
│   │   ├── MyTasks.tsx         # Personal task view
│   │   ├── ProjectBoard.tsx    # Kanban board page
│   │   ├── Register.tsx        # User registration
│   │   └── UserProfile.tsx     # User settings and profile
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── ThemeContext.tsx    # Theme management
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication utilities
│   │   ├── usePermissions.ts   # Permission checking
│   │   ├── useTaskRealtime.ts  # Real-time task updates
│   │   └── useTheme.ts         # Theme management
│   │
│   ├── services/               # API and external services
│   │   ├── api.ts              # Axios configuration
│   │   ├── socket.ts           # WebSocket client
│   │   ├── auth.service.ts     # Authentication API calls
│   │   ├── project.service.ts  # Project management APIs
│   │   ├── task.service.ts     # Task operation APIs
│   │   ├── user.service.ts     # User profile APIs
│   │   ├── search.service.ts   # Search functionality
│   │   ├── comment.service.ts  # Comment management
│   │   ├── activity.service.ts # Activity logging
│   │   └── notification.service.ts # Notification handling
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── auth.types.ts       # Authentication types
│   │   ├── project.types.ts    # Project data types
│   │   ├── task.types.ts       # Task data types
│   │   ├── user.types.ts       # User data types
│   │   ├── api.types.ts        # API response types
│   │   └── permissions.ts      # Permission definitions
│   │
│   ├── schemas/                # Zod validation schemas
│   │   └── validation.ts       # Form validation schemas
│   │
│   ├── utils/                  # Utility functions
│   │   ├── errorHandler.ts     # Error handling utilities
│   │   ├── dateFormatter.ts    # Date formatting helpers
│   │   └── token.ts            # JWT token utilities
│   │
│   ├── routes/                 # Route configuration
│   │   ├── AppRoutes.tsx       # Main route definitions
│   │   └── ProtectedRoute.tsx  # Authentication guard
│   │
│   ├── App.tsx                 # Root application component
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles and Tailwind
│   └── vite-env.d.ts           # Vite type definitions
│
├── .env                        # Environment configuration
├── .env.example                # Environment template
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # Application TypeScript config
├── tsconfig.node.json          # Node TypeScript config
├── vite.config.ts              # Vite build configuration
├── eslint.config.js            # ESLint configuration
└── README.md                   # This documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher
- **Backend API** running (see backend documentation)

### Installation

1. **Navigate to frontend directory**

```bash
cd frontend
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
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_API_SOCKET_URL=http://localhost:5000

# Optional: App Configuration
VITE_APP_NAME=Project Management System
VITE_APP_VERSION=1.0.0
```

4. **Start development server**

```bash
npm run dev
```

5. **Access the application**

```
http://localhost:5173
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix linting issues

# Type Checking
npm run type-check      # TypeScript validation
```

---

## 🎨 User Interface

### Application Pages

#### Authentication Pages

- **Login** (`/login`) - Email/password authentication with error handling
- **Register** (`/register`) - User registration with validation
- **OTP Verification** - Modal for two-factor authentication

#### Main Application Pages

- **Dashboard** (`/dashboard`) - Project overview and quick actions
- **Project Board** (`/projects/:id`) - Kanban board with real-time collaboration
- **My Tasks** (`/my-tasks`) - Personal task view with filtering
- **User Profile** (`/profile`) - Account settings and session management

### Key Components

#### KanbanBoard Component

```tsx
interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onStatusChange: (
    taskId: string,
    status: TaskStatus,
    position: number
  ) => void;
  onAssign: (taskId: string, userId: string | null) => void;
  onDelete: (taskId: string) => void;
  onOpenDetails: (taskId: string) => void;
}

// Usage
<KanbanBoard
  tasks={projectTasks}
  members={projectMembers}
  onStatusChange={handleStatusChange}
  onAssign={handleAssign}
  onDelete={handleDelete}
  onOpenDetails={handleOpenDetails}
/>;
```

#### TaskDetailsModal Component

```tsx
interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  members: Member[];
  currentUserId: string;
  onTaskUpdate: (task: Task) => void;
}

// Comprehensive task view with tabs
<TaskDetailsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  taskId={selectedTaskId}
  members={projectMembers}
  currentUserId={currentUser.id}
  onTaskUpdate={handleTaskUpdate}
/>;
```

#### NotificationCenter Component

```tsx
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// Centralized notification management
<NotificationCenter
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
/>;
```

### UI Patterns

#### Modal System

- **Consistent Sizing** - Small, medium, large, and full-screen variants
- **Focus Management** - Automatic focus trapping and restoration
- **Keyboard Navigation** - ESC to close, Tab navigation within modal
- **Backdrop Behavior** - Click outside to close (configurable)

#### Form Handling

- **React Hook Form** - Performance-optimized form state management
- **Zod Validation** - Runtime type validation with detailed error messages
- **Real-time Feedback** - Instant validation as user types
- **Accessibility** - Proper labeling and error announcements

#### Loading States

- **Skeleton Screens** - Placeholder content during loading
- **Progressive Loading** - Content appears as it loads
- **Optimistic Updates** - Immediate UI feedback for user actions
- **Error Boundaries** - Graceful error handling and recovery

---

## ⚡ Real-Time Features

### WebSocket Integration

#### Connection Management

```typescript
// Socket connection with authentication
import { connectSocket } from "./services/socket";

const socket = connectSocket({
  token: accessToken,
  sessionToken: sessionToken,
});

// Connection event handlers
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

#### Real-Time Events

##### Task Events

```typescript
// Listen for task updates
socket.on("task:created", (data: { task: Task; projectId: string }) => {
  // Add new task to UI
  setTasks((prev) => [data.task, ...prev]);
});

socket.on("task:updated", (data: { task: Task; projectId: string }) => {
  // Update existing task
  setTasks((prev) =>
    prev.map((t) => (t._id === data.task._id ? data.task : t))
  );
});

socket.on("task:deleted", (data: { taskId: string; projectId: string }) => {
  // Remove task from UI
  setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
});
```

##### Presence Events

```typescript
// Join project room
socket.emit("project:join", { projectId });

// Listen for user presence
socket.on("user:joined", (data: { userId: string; userName: string }) => {
  // Update presence indicators
  setOnlineUsers((prev) => [...prev, data]);
});

socket.on("user:left", (data: { userId: string }) => {
  // Remove from presence indicators
  setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
});
```

##### Cursor Events

```typescript
// Emit cursor position
const handleMouseMove = (x: number, y: number) => {
  socket.emit("cursor:move", {
    projectId,
    x,
    y,
  });
};

// Listen for other users' cursors
socket.on(
  "cursor:update",
  (data: { userId: string; userName: string; x: number; y: number }) => {
    // Update cursor positions
    setCursors((prev) => ({
      ...prev,
      [data.userId]: data,
    }));
  }
);
```

### State Synchronization

#### Optimistic Updates

```typescript
const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
  // Optimistic UI update
  setTasks((prev) =>
    prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
  );

  try {
    // API call
    await updateTask(taskId, updates);
  } catch (error) {
    // Revert on error
    setTasks((prev) => prev.map((t) => (t._id === taskId ? originalTask : t)));
    showError("Failed to update task");
  }
};
```

#### Conflict Resolution

```typescript
// Handle concurrent edits
socket.on(
  "task:conflict",
  (data: { taskId: string; serverVersion: Task; localVersion: Task }) => {
    // Show conflict resolution dialog
    showConflictDialog({
      serverVersion: data.serverVersion,
      localVersion: data.localVersion,
      onResolve: (resolved) => {
        // Apply resolved version
        setTasks((prev) =>
          prev.map((t) => (t._id === data.taskId ? resolved : t))
        );
      },
    });
  }
);
```

---

### Code Quality

#### TypeScript Standards

- **Strict Mode** - All strict TypeScript checks enabled
- **Interface Definitions** - Comprehensive type definitions
- **Generic Types** - Reusable generic components
- **Type Guards** - Runtime type checking utilities

#### Component Patterns

- **Functional Components** - Modern React patterns with hooks
- **Custom Hooks** - Extract reusable logic
- **Compound Components** - Flexible component APIs
- **Render Props** - Advanced composition patterns

#### Styling Guidelines

- **Tailwind Classes** - Utility-first approach
- **Design Tokens** - Consistent spacing, colors, typography
- **Responsive Design** - Mobile-first breakpoints
- **Dark Mode Support** - Theme-aware styling

## 🚀 Deployment

### Build Process

1. **Environment Setup**

```bash
# Set production environment variables
cp .env.example .env.production
# Edit with production values
```

2. **Build Application**

```bash
npm run build
```

3. **Build Output**

```
dist/
├── assets/           # Compiled CSS and JS
├── index.html        # Main HTML file
└── favicon.ico       # Application icon
```

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_API_SOCKET_URL
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Docker

```dockerfile
# Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose (Full Stack)

```yaml
version: "3.8"
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:5000/api
      - VITE_API_SOCKET_URL=http://backend:5000
    depends_on:
      - backend

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

volumes:
  mongodb_data:
```

### Production Configuration

#### Environment Variables

```env
# Production API endpoints
VITE_API_URL=https://api.yourdomain.com/api
VITE_API_SOCKET_URL=https://api.yourdomain.com

# Analytics (optional)
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID

# Feature flags (optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

#### Performance Optimization

- **CDN Integration** - Serve static assets from CDN
- **Compression** - Enable gzip/brotli compression
- **Caching** - Implement proper cache headers
- **Monitoring** - Set up performance monitoring

#### SEO and Meta Tags

```html
<!-- index.html -->
<title>Project Management System</title>
<meta
  name="description"
  content="Collaborative project management with real-time features"
/>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#3B82F6" />
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Backup strategy implemented

---
