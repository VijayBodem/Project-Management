import { useNavigate } from "react-router-dom";
import type { DashboardProject } from "../services/project.service";

interface Props {
  project: DashboardProject;
}

export const ProjectCard = ({ project }: Props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${project._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 cursor-pointer transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/10 transition-all duration-300" />

      <div className="relative space-y-5">
        {/* Project Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1">
              {project.name}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${
                project.stats.completionPercentage === 100
                  ? "bg-green-500"
                  : project.stats.completionPercentage >= 75
                  ? "bg-blue-500"
                  : project.stats.completionPercentage >= 50
                  ? "bg-yellow-500"
                  : "bg-slate-400"
              }`}
            />
          </div>

          {project.description && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Progress</span>
            <span className="font-bold text-slate-900">
              {project.stats.completionPercentage}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  project.stats.completionPercentage === 100
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : project.stats.completionPercentage >= 75
                    ? "bg-gradient-to-r from-blue-400 to-blue-500"
                    : project.stats.completionPercentage >= 50
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                    : project.stats.completionPercentage >= 25
                    ? "bg-gradient-to-r from-orange-400 to-orange-500"
                    : "bg-gradient-to-r from-slate-400 to-slate-500"
                }`}
                style={{ width: `${project.stats.completionPercentage}%` }}
              />
            </div>
            {/* Progress glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors duration-200">
            <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">
                {project.stats.completedTasks}/{project.stats.totalTasks}
              </div>
              <div className="text-xs text-slate-500">Tasks</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg group-hover:bg-purple-50 transition-colors duration-200">
            <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors duration-200">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">
                {project.memberCount}
              </div>
              <div className="text-xs text-slate-500">
                {project.memberCount === 1 ? "Member" : "Members"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Created by {project.createdBy.name}</span>
            <svg
              className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
