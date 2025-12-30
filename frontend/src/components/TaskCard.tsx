import { useState } from "react";
import type { Task } from "../services/task.service";
import type { ProjectMember } from "../services/member.service";

interface Props {
  task: Task;
  members: ProjectMember[];
  onAssign: (taskId: string, userIds: string[]) => void;
  onDelete: (taskId: string) => void;
  onOpenDetails: (taskId: string) => void;
  provided: any;
}

export const TaskCard = ({
  task,
  members,
  onAssign,
  onDelete,
  onOpenDetails,
  provided,
}: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.assignedTo?.map(a => a._id) || []
  );

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const toggleAssignee = (userId: string) => {
    const newSelection = selectedAssignees.includes(userId)
      ? selectedAssignees.filter(id => id !== userId)
      : [...selectedAssignees, userId];
    
    setSelectedAssignees(newSelection);
    onAssign(task._id, newSelection);
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onOpenDetails(task._id)}
      style={provided.draggableProps.style}
      className="p-3 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 font-medium text-sm text-gray-900 dark:text-white">
          {task.title}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          className="border-none bg-transparent cursor-pointer text-gray-400 hover:text-red-500 text-base px-1 transition-colors"
          title="Delete task"
        >
          ×
        </button>
      </div>

      {task.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-snug overflow-hidden line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Priority and Due Date */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {task.priority && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${getPriorityClass(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
        )}
        {task.dueDate && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isOverdue ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}>
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="relative">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            <div
              onClick={handleAssignClick}
              className="flex items-center gap-1 cursor-pointer"
            >
              {/* Show up to 3 avatars */}
              <div className="flex -space-x-2">
                {task.assignedTo.slice(0, 3).map((assignee, index) => (
                  <div
                    key={assignee._id}
                    className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white dark:border-gray-800"
                    style={{ zIndex: 3 - index }}
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.assignedTo.length > 3 && (
                  <div
                    className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-[9px] font-semibold border-2 border-white dark:border-gray-800"
                    title={`+${task.assignedTo.length - 3} more`}
                  >
                    +{task.assignedTo.length - 3}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleAssignClick}
              className="px-2 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Assign
            </button>
          )}

          {showMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[180px] max-h-[250px] overflow-y-auto">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Assign Members ({selectedAssignees.length})
                </p>
              </div>
              {members.map((member) => (
                <label
                  key={member.user._id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(member.user._id)}
                    onChange={() => toggleAssignee(member.user._id)}
                    className="w-3.5 h-3.5 text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-900 dark:text-white flex-1">
                    {member.user.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
