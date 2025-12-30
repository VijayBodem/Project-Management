# Project Management System

A full-stack collaborative project management application with real-time features, built with React, TypeScript, Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Overview

This is a modern project management system that enables teams to collaborate in real-time. It features a Kanban-style board, task management, team collaboration tools, and live updates across all connected clients.

## ✨ Key Features

### Project Management
- **Project Creation & Organization** - Create and manage multiple projects with descriptions and team members
- **Kanban Board** - Visual task management with drag-and-drop functionality
- **Task Management** - Create, assign, update, and track tasks with priorities and due dates
- **Project Dashboard** - Overview of all projects with progress tracking

### Collaboration
- **Real-time Updates** - Live synchronization of tasks, assignments, and status changes
- **Presence Indicators** - See who's currently viewing the project board
- **Collaborative Cursors** - View other users' cursor positions in real-time
- **Comments & Activity Log** - Discuss tasks and track all changes
- **Team Management** - Add/remove members with role-based permissions

### User Experience
- **Dark Mode** - Full dark theme support across the entire application
- **Global Search** - Quick search across projects and tasks
- **Notifications** - Real-time notifications for task assignments and updates
- **Toast Messages** - Non-intrusive feedback for user actions
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### Security & Performance
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Project owner, admin, and member roles
- **Rate Limiting** - Protection against abuse and DDoS attacks
- **Input Validation** - Comprehensive validation on both frontend and backend
- **Database Optimization** - Indexed queries and efficient data retrieval
- **Soft Delete** - Safe deletion with recovery options

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with dark mode support
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **React Beautiful DnD** for drag-and-drop functionality
- **Zod** for schema validation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation

## 📋 Application Workflow

### 1. User Registration & Authentication
```
User → Register → Email & Password → JWT Token → Access Application
```

### 2. Project Creation
```
User → Dashboard → Create Project → Add Details → Invite Members → Project Board
```

### 3. Task Management
```
Project Board → Create Task → Assign Member → Set Priority/Due Date → 
Drag to Status Column → Update Details → Add Comments → Complete Task
```

### 4. Real-time Collaboration
```
User A Updates Task → Socket.IO → Server Broadcasts → All Connected Users → 
UI Updates Automatically + Toast Notification
```

### 5. Team Collaboration
```
Project Owner → Manage Members → Assign Roles → Set Permissions → 
Members Collaborate → Activity Tracked → Notifications Sent
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd project-management-system
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-management
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. **Start the application**

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
project-management-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and Socket.IO services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── routes/          # Route configuration
│   └── README.md            # Frontend documentation
│
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── socket/          # Socket.IO handlers
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   └── scripts/         # Database migration scripts
│   └── README.md            # Backend documentation
│
└── README.md                 # This file
```

## 🔑 Key Technologies

| Category | Technologies |
|----------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO |
| Authentication | JWT, Bcrypt |
| Validation | Zod, Express Validator |
| UI/UX | React Beautiful DnD, Dark Mode |

## 📚 Documentation

- [Frontend Documentation](./frontend/README.md) - Detailed frontend setup and architecture
- [Backend Documentation](./backend/README.md) - API documentation and backend architecture
- [Security Guide](./backend/SECURITY.md) - Security features and best practices
- [Database Optimization](./backend/DATABASE_OPTIMIZATION.md) - Database performance guide
- [Tailwind Conversion Guide](./TAILWIND_CONVERSION_GUIDE.md) - Styling documentation

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

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time capabilities
- MongoDB team for the excellent database
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors

## 📞 Support

For support, email support@example.com or open an issue in the repository.

---

**Built with ❤️ using React, Node.js, and MongoDB**
