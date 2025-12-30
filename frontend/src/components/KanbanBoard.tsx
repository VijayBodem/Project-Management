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
      <div className="flex gap-5 overflow-x-auto">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-w-[320px] flex-1 rounded-lg p-4 transition-colors ${
                    snapshot.isDraggingOver
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {col.label}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="min-h-[100px]">
                    {columnTasks
                      .sort((a, b) => a.position - b.position)
                      .map((task, index) => (
                        <Draggable
                          draggableId={task._id}
                          index={index}
                          key={task._id}
                        >
                          {(provided) => (
                            <TaskCard
                              task={task}
                              members={members}
                              onAssign={onAssign}
                              onDelete={onDelete}
                              onOpenDetails={onOpenDetails}
                              provided={provided}
                            />
                          )}
                        </Draggable>
                      ))}
                  </div>

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};
