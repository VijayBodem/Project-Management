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
  canDeleteTask?: boolean;
}

export const TaskCard = ({
  task,
  members,
  onAssign,
  onDelete,
  onOpenDetails,
  provided,
  canDeleteTask = true,
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

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onOpenDetails(task._id)}
      style={provided.draggableProps.style}
      className="card p-4 hover:shadow-medium cursor-pointer transition-all duration-200 group"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 flex-1">
            {task.title}
          </h4>
          {canDeleteTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {task.priority && (
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide rounded-full ${
              task.priority === 'low' ? 'bg-green-100 text-green-800 border border-green-200' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              task.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-red-50 text-red-900 border border-red-300'
            }`}>
              {task.priority.toUpperCase()}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide rounded-full ${
              isOverdue
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Assignees */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="relative">
            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div
                onClick={handleAssignClick}
                className="flex items-center gap-1 cursor-pointer group"
              >
                {/* Show up to 3 avatars */}
                <div className="flex -space-x-1">
                  {task.assignedTo.slice(0, 3).map((assignee, index) => (
                    <div
                      key={assignee._id}
                      className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold border-2 border-white ring-1 ring-secondary-100"
                      style={{ zIndex: 3 - index }}
                      title={assignee.name}
                    >
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {task.assignedTo.length > 3 && (
                    <div
                      className="w-6 h-6 rounded-full bg-secondary-400 text-white flex items-center justify-center text-xs font-semibold border-2 border-white ring-1 ring-secondary-100"
                      title={`+${task.assignedTo.length - 3} more`}
                    >
                      +{task.assignedTo.length - 3}
                    </div>
                  )}
                </div>
                <svg className="w-3 h-3 text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            ) : (
              <button
                onClick={handleAssignClick}
                className="btn btn-ghost btn-sm px-2 py-1 text-xs"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Assign
              </button>
            )}

            {showMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-secondary-200 py-2 z-10 min-w-[200px]">
                <div className="px-3 py-2 border-b border-secondary-200">
                  <p className="text-xs font-semibold text-secondary-900">
                    Assign Members ({selectedAssignees.length})
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {members.map((member) => (
                    <label
                      key={member.user._id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.user._id)}
                        onChange={() => toggleAssignee(member.user._id)}
                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      />
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-secondary-900">
                        {member.user.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drag handle */}
          <div className="text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
