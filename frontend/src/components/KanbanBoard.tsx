import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { Task } from "../services/task.service";
import type { ProjectMember } from "../services/member.service";
import { TaskCard } from "./TaskCard";

export type TaskStatus = "todo" | "in-progress" | "done";

interface Props {
  tasks: Task[];
  members: ProjectMember[];
  onStatusChange: (taskId: string, status: TaskStatus, position?: number) => void;
  onAssign: (taskId: string, userIds: string[]) => void;
  onDelete: (taskId: string) => void;
  onOpenDetails: (taskId: string) => void;
  canDeleteTask?: boolean;
}

const columns: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "TO DO" },
  { id: "in-progress", label: "IN PROGRESS" },
  { id: "done", label: "DONE" },
];

export const KanbanBoard = ({
  tasks,
  members,
  onStatusChange,
  onAssign,
  onDelete,
  onOpenDetails,
  canDeleteTask = true,
}: Props) => {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const newPosition = result.destination.index;

    // Only update if position or status changed
    const sourceStatus = result.source.droppableId;
    const sourcePosition = result.source.index;

    if (sourceStatus !== newStatus || sourcePosition !== newPosition) {
      onStatusChange(taskId, newStatus, newPosition);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-w-[320px] flex-1 rounded-xl transition-all duration-200 ${
                    snapshot.isDraggingOver
                      ? "bg-blue-50 border-2 border-blue-200 border-dashed"
                      : "bg-white border border-slate-200"
                  } shadow-soft`}
                >
                  {/* Column Header */}
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          col.id === 'todo' ? 'bg-yellow-500' :
                          col.id === 'in-progress' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                        <h3 className="text-lg font-semibold text-slate-900">
                          {col.label}
                        </h3>
                      </div>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-sm font-medium">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="p-4 min-h-[200px] space-y-3">
                    {columnTasks
                      .sort((a, b) => a.position - b.position)
                      .map((task, index) => (
                        <Draggable
                          draggableId={task._id}
                          index={index}
                          key={task._id}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transform transition-transform ${
                                snapshot.isDragging ? 'rotate-2 shadow-2xl' : ''
                              }`}
                            >
                              <TaskCard
                                task={task}
                                members={members}
                                onAssign={onAssign}
                                onDelete={onDelete}
                                onOpenDetails={onOpenDetails}
                                provided={provided}
                                canDeleteTask={canDeleteTask}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}

                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">No tasks</p>
                      </div>
                    )}

                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};
