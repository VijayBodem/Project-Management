import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { listenToNotifications } from "../services/socket";
import {
  getDashboardProjects,
  createProject,
  type DashboardProject,
} from "../services/project.service";
import { getUnreadCount } from "../services/notification.service";
import { ProjectCard } from "../components/ProjectCard";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { SearchModal } from "../components/SearchModal";
import { NotificationCenter } from "../components/NotificationCenter";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchData();
    fetchUnreadCount();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectsData = await getDashboardProjects();
      setProjects(projectsData.projects);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      await createProject(data);
      fetchData();
    } catch (error: any) {
      console.error("Failed to create project:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    listenToNotifications((data) => {
      console.log("Notification received:", data);
      fetchUnreadCount();
    });
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 text-lg">
              Manage your projects and track progress
            </p>
          </div>

          {/* Action Buttons - Top Right */}
          <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-end">
            {/* Search Button */}
            <button
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
              title="Search (Cmd/Ctrl + K)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden md:inline">Search</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifications(true)}
              className="inline-flex items-center justify-center p-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm relative"
              title="Notifications"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h4l4 4v-4h4a2 2 0 002-2z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[18px] text-center shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden md:inline">Profile</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action - Hero Section */}
      <div className="mb-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border border-slate-200 shadow-sm">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
          </div>

          <div className="relative px-8 py-12 lg:px-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Get Started
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  Ready to start a new project?
                </h2>
                <p className="text-lg text-slate-600 max-w-lg">
                  Create your first project and begin collaborating with your
                  team in minutes
                </p>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <svg
                    className="relative w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="relative font-semibold text-lg">
                    Create Project
                  </span>
                </button>

                {/* Floating elements for visual interest */}
                <div className="hidden lg:block absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-20 animate-pulse" />
                <div className="hidden lg:block absolute -bottom-6 -left-6 w-12 h-12 bg-blue-400 rounded-full opacity-10 animate-pulse delay-1000" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="mb-12">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                Quick Actions
              </h3>
              <p className="text-slate-600">
                Access your tasks and manage your workflow
              </p>
            </div>
            <button
              onClick={() => navigate("/my-tasks")}
              className="inline-flex items-center gap-3 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View My Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 md:p-16 text-center shadow-sm">
          <div className="space-y-8">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-slate-900">
                No projects yet
              </h3>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Create your first project to get started managing your tasks and
                collaborating with your team. It's quick and easy!
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl text-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Your First Project
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Projects
              </h2>
              <p className="text-slate-600">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"} total
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }}
      />
    </div>
  );
};

export default Dashboard;
