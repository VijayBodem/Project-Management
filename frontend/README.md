# Frontend - Project Management System

React-based frontend application with real-time collaboration features, built with TypeScript, Vite, and Tailwind CSS.

## 🎨 Overview

The frontend is a modern, responsive single-page application (SPA) that provides an intuitive interface for project and task management with real-time collaboration features.

## ✨ Features

### Core Features
- **Dashboard** - Overview of all projects with quick access
- **Project Board** - Kanban-style board with drag-and-drop
- **Task Management** - Create, edit, assign, and track tasks
- **My Tasks** - Personal task view with filtering
- **User Profile** - Manage account settings and preferences

### Real-time Collaboration
- **Live Updates** - Instant synchronization across all clients
- **Presence Indicators** - See who's viewing the project
- **Collaborative Cursors** - View other users' cursor positions
- **Toast Notifications** - Real-time feedback for actions

### UI/UX Features
- **Dark Mode** - Full dark theme support
- **Responsive Design** - Mobile-friendly interface
- **Global Search** - Quick search across projects and tasks
- **Notification Center** - Centralized notification management
- **Drag & Drop** - Intuitive task movement between columns

## 🏗️ Architecture

### Technology Stack
- **React 18.3** - UI library with hooks
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router 6.26** - Client-side routing
- **Socket.IO Client 4.7** - Real-time communication
- **React Beautiful DnD 13.1** - Drag and drop
- **Zod 3.23** - Schema validation

### Project Structure
```
frontend/
├── public/                   # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CollaborativeCursor.tsx
│   │   ├── CreateProjectModal.tsx
│   │   ├── CreateTaskModal.tsx
│   │   ├── DarkModeToggle.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── MemberManagementModal.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── PresenceIndicator.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── SearchModal.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetailsModal.tsx
│   │   └── ToastNotification.tsx
│   │
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── ProjectBoard.tsx # Project board with Kanban
│   │   ├── MyTasks.tsx      # User's tasks view
│   │   └── UserProfile.tsx  # User profile settings
│   │
│   ├── services/            # API and Socket services
│   │   ├── api.ts           # Axios instance
│   │   ├── auth.service.ts  # Authentication
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   ├── member.service.ts
│   │   ├── comment.service.ts
│   │   ├── activity.service.ts
│   │   ├── notification.service.ts
│   │   ├── search.service.ts
│   │   ├── user.service.ts
│   │   └── socket.ts        # Socket.IO client
│   │
│   ├── context/             # React Context
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ThemeContext.tsx # Dark mode state
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useTheme.ts      # Theme hook
│   │   └── usePermissions.ts # Permission checking
│   │
│   ├── types/               # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── project.types.ts
│   │   ├── task.types.ts
│   │   └── permissions.ts
│   │
│   ├── schemas/             # Zod validation schemas
│   │   └── validation.ts
│   │
│   ├── utils/               # Utility functions
│   │   └── dateFormatter.ts
│   │
│   ├── routes/              # Route configuration
│   │   └── AppRoutes.tsx
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── .env                      # Environment variables
├── index.html               # HTML template
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend server running (see backend README)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

3. **Start development server**
```bash
npm run dev
```

4. **Access the application**
```
http://localhost:5173
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📱 Pages & Components

### Pages

#### Dashboard (`/dashboard`)
- Overview of all user's projects
- Quick project creation
- Project cards with progress indicators
- Search and filter functionality

#### Project Board (`/projects/:id`)
- Kanban board with three columns (To Do, In Progress, Done)
- Drag-and-drop task management
- Real-time collaboration features
- Task filtering by assignee and status
- Member management
- Presence indicators

#### My Tasks (`/my-tasks`)
- Personal task list view
- Filter by status and priority
- Quick task updates
- Due date tracking

#### User Profile (`/profile`)
- Account information
- Password change
- Notification preferences
- Theme settings

#### Login (`/login`)
- Email/password authentication
- Form validation
- Error handling

#### Register (`/register`)
- User registration
- Email validation
- Password strength requirements

### Key Components

#### KanbanBoard
Drag-and-drop task board with three status columns.
```tsx
<KanbanBoard
  tasks={tasks}
  members={members}
  onStatusChange={handleStatusChange}
  onAssign={handleAssign}
  onDelete={handleDelete}
  onOpenDetails={handleOpenDetails}
/>
```

#### TaskDetailsModal
Comprehensive task details with tabs for details, comments, and activity.
```tsx
<TaskDetailsModal
  isOpen={showModal}
  onClose={handleClose}
  taskId={taskId}
  members={members}
  currentUserId={userId}
  onTaskUpdate={handleUpdate}
/>
```

#### CreateTaskModal
Modal for creating new tasks with validation.
```tsx
<CreateTaskModal
  isOpen={showModal}
  onClose={handleClose}
  onSubmit={handleCreateTask}
  members={members}
/>
```

#### NotificationCenter
Sidebar for managing notifications.
```tsx
<NotificationCenter
  isOpen={isOpen}
  onClose={handleClose}
/>
```

#### SearchModal
Global search across projects and tasks.
```tsx
<SearchModal
  isOpen={isOpen}
  onClose={handleClose}
/>
```

## 🔌 Real-time Features

### Socket.IO Integration

The application uses Socket.IO for real-time features:

```typescript
// Join project room
joinProjectRoom(projectId);

// Listen for task updates
onTaskCreated((data) => {
  setTasks(prev => [data.task, ...prev]);
});

onTaskUpdated((data) => {
  setTasks(prev => prev.map(t => 
    t._id === data.task._id ? data.task : t
  ));
});

// Emit cursor position
emitCursorMove(projectId, x, y);

// Listen for cursor updates
onCursorUpdate((data) => {
  setCursors(prev => [...prev, data]);
});
```

### Real-time Events
- `task:created` - New task added
- `task:updated` - Task modified
- `task:assigned` - Task assigned to user
- `task:deleted` - Task removed
- `user:joined` - User joined project
- `user:left` - User left project
- `cursor:update` - Cursor position changed

## 🎨 Styling

### Tailwind CSS

All components use Tailwind CSS utility classes with dark mode support:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
    Click me
  </button>
</div>
```

### Dark Mode

Dark mode is managed through ThemeContext:

```tsx
const { theme, toggleTheme } = useTheme();

// Toggle dark mode
<button onClick={toggleTheme}>
  {theme === 'dark' ? '☀️' : '🌙'}
</button>
```

### Responsive Design

Tailwind breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

## 🔐 Authentication

### Auth Flow

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all API requests via Axios interceptor
5. Protected routes check authentication status

### Protected Routes

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/projects/:id" element={<ProjectBoard />} />
  <Route path="/my-tasks" element={<MyTasks />} />
  <Route path="/profile" element={<UserProfile />} />
</Route>
```

### Auth Context

```tsx
const { user, login, logout, isAuthenticated } = useAuth();

// Login
await login(email, password);

// Logout
logout();

// Check authentication
if (isAuthenticated) {
  // User is logged in
}
```

## 📡 API Integration

### Axios Configuration

```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Service Layer

All API calls are abstracted into service files:

```typescript
// src/services/task.service.ts
export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  const response = await api.get(`/tasks/project/${projectId}`);
  return response.data;
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};
```

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

### Code Quality

- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting with React rules
- **Prettier** - Code formatting (if configured)

### Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Optional
VITE_APP_NAME=Project Management System
```

## 🐛 Troubleshooting

### Common Issues

**Socket connection fails**
- Ensure backend is running
- Check VITE_SOCKET_URL in .env
- Verify CORS settings on backend

**Authentication errors**
- Clear localStorage and re-login
- Check token expiration
- Verify backend JWT_SECRET matches

**Build errors**
- Clear node_modules and reinstall
- Check TypeScript errors with `npm run type-check`
- Verify all dependencies are installed

## 📦 Dependencies

### Core Dependencies
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `axios` - HTTP client
- `socket.io-client` - WebSocket client
- `react-beautiful-dnd` - Drag and drop
- `zod` - Schema validation

### Dev Dependencies
- `vite` - Build tool
- `typescript` - Type checking
- `@vitejs/plugin-react` - React plugin for Vite
- `tailwindcss` - CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes
- `eslint` - Code linting

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Environment Variables

Set these in your hosting platform:
- `VITE_API_URL` - Production API URL
- `VITE_SOCKET_URL` - Production Socket URL

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Router Documentation](https://reactrouter.com)

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper type definitions
4. Use Tailwind CSS for styling
5. Test real-time features thoroughly
6. Update documentation as needed

---

**Built with React, TypeScript, and Tailwind CSS**
