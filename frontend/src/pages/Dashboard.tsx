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
      <div className="p-5 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="m-0 mb-2 text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="m-0 text-gray-600 dark:text-gray-400">
            Manage your projects and track progress
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Search (Cmd/Ctrl + K)"
          >
            🔍 Search
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(true)}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-sm relative hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[11px] font-semibold min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => navigate("/profile")}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            👤 Profile
          </button>

          <button
            onClick={handleLogout}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>

           
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 border-none rounded bg-blue-500 text-white cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
        >
          + Create New Project
        </button>
        <button
          onClick={() => navigate("/my-tasks")}
          className="px-6 py-3 border border-blue-500 rounded bg-white dark:bg-gray-800 text-blue-500 cursor-pointer text-base font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        >
          📋 My Tasks
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-15 px-5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="m-0 mb-3 text-gray-600 dark:text-gray-400 text-lg">
            No projects yet
          </h3>
          <p className="m-0 mb-5 text-gray-500 dark:text-gray-500">
            Create your first project to get started
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 border-none rounded bg-blue-500 text-white cursor-pointer text-sm hover:bg-blue-600 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <>
          <h2 className="m-0 mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Your Projects ({projects.length})
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
              />
            ))}
          </div>
        </>
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
