import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { search, type SearchResults } from "../services/search.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "projects" | "tasks">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(null);
    }
  }, [query, filter]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await search(query, filter);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    onClose();
  };

  const handleTaskClick = (task: any) => {
    const projectId =
      typeof task.project === "string" ? task.project : task.project._id;
    navigate(`/projects/${projectId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-5 border-b border-gray-200">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            className="w-full p-3 border border-gray-300"
          />
        </div>

        {/* Filter */}
        <div className="py-3 px-5 border-b border-gray-200">
          {(["all", "projects", "tasks"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`py-1.5 px-3 border-none rounded text-xs capitalize cursor-pointer transition-colors ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5">
          {query.length < 2 ? (
            <div className="text-center text-gray-500">
              Type at least 2 characters to search
            </div>
          ) : loading ? (
            <div className="text-center text-gray-500">
              Searching...
            </div>
          ) : !results ? (
            <div className="text-center text-gray-500">
              No results found
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <h3 className="m-0 mb-3 text-sm font-semibold text-gray-600">
                    Projects ({results.projects.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.projects.map((project) => (
                      <div
                        key={project._id}
                        onClick={() => handleProjectClick(project._id)}
                        className="p-3 border border-gray-200"
                      >
                        <div className="font-medium text-sm mb-1 text-gray-900">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-600">
                            {project.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Created by {project.createdBy.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <h3 className="m-0 mb-3 text-sm font-semibold text-gray-600">
                    Tasks ({results.tasks.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.tasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => handleTaskClick(task)}
                        className="p-3 border border-gray-200"
                      >
                        <div className="font-medium text-sm mb-1 text-gray-900">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600">
                            {task.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          <span>
                            Project:{" "}
                            {typeof task.project === "string"
                              ? task.project
                              : task.project.name}
                          </span>
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <span>
                              Assigned to: {task.assignedTo[0].name}
                              {task.assignedTo.length > 1 && ` +${task.assignedTo.length - 1} more`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.projects.length === 0 && results.tasks.length === 0 && (
                <div className="text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
