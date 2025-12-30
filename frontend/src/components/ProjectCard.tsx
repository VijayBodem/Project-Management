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

  const getProgressClass = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 cursor-pointer transition-all bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      <h3 className="m-0 mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {project.name}
      </h3>

      {project.description && (
        <p className="m-0 mb-4 text-gray-600 dark:text-gray-400 text-sm leading-snug">
          {project.description}
        </p>
      )}

      <div className="mb-3">
        <div className="flex justify-between mb-1 text-xs">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {project.stats.completionPercentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressClass(
              project.stats.completionPercentage
            )}`}
            style={{ width: `${project.stats.completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium text-gray-900 dark:text-white">
            {project.stats.completedTasks}
          </span>
          /{project.stats.totalTasks} tasks
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-white">{project.memberCount}</span>{" "}
          {project.memberCount === 1 ? "member" : "members"}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Created by {project.createdBy.name}
        </div>
      </div>
    </div>
  );
};
