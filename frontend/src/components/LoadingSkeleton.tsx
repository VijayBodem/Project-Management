export const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-soft hover:shadow-medium transition-shadow duration-200 p-5 animate-pulse">
    <div className="h-6 bg-slate-200"></div>
    <div className="h-4 bg-slate-200"></div>
    <div className="h-4 bg-slate-200"></div>
    <div className="h-2 bg-slate-200"></div>
    <div className="flex justify-between mt-3">
      <div className="h-4 bg-slate-200"></div>
      <div className="h-4 bg-slate-200"></div>
    </div>
  </div>
);

export const TaskCardSkeleton = () => (
  <div className="bg-white">
    <div className="h-4 bg-slate-200"></div>
    <div className="h-3 bg-slate-200"></div>
    <div className="h-3 bg-slate-200"></div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
    <div className="mb-8">
      <div className="h-8 bg-slate-200"></div>
      <div className="h-4 bg-slate-200"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const KanbanSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {[1, 2, 3].map((col) => (
      <div key={col} className="min-w-[320px] flex-1">
        <div className="h-6 bg-slate-200"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((task) => (
            <TaskCardSkeleton key={task} />
          ))}
        </div>
      </div>
    ))}
  </div>
);
