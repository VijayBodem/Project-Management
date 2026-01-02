import { useState, useEffect } from "react";
import {
  searchUsers,
  getProjectMembers,
  addMemberToProject,
  updateMemberRole,
  removeMemberFromProject,
  transferProjectOwnership,
  type User,
  type ProjectMember,
} from "../services/member.service";
import { ToastNotification, type Toast } from "./ToastNotification";
import {
  ProjectRole,
  getRoleDisplayName,
  getRoleColor,
} from "../types/permissions";
import { usePermissions } from "../hooks/usePermissions";

// Helper function for role descriptions
const getRoleDescription = (role: ProjectRole): string => {
  const descriptions: Record<ProjectRole, string> = {
    [ProjectRole.OWNER]: "Full control",
    [ProjectRole.ADMIN]: "Manage members & tasks",
    [ProjectRole.MEMBER]: "Create & edit tasks",
    [ProjectRole.VIEWER]: "View only",
  };
  return descriptions[role];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userRole?: ProjectRole;
}

export const MemberManagementModal = ({
  isOpen,
  onClose,
  projectId,
  userRole,
}: Props) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [createdBy, setCreatedBy] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "add">("members");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>(
    ProjectRole.MEMBER
  );
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const permissions = usePermissions({ userRole });

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  console.log("memberssss", members);

  const fetchMembers = async () => {
    try {
      const data = await getProjectMembers(projectId);
      setMembers(data.members);
      setCreatedBy(data.createdBy);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const results = await searchUsers(searchQuery);
      // Filter out users who are already members
      const filtered = results.filter(
        (user) => !members.some((m) => m.user._id === user._id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addMemberToProject(projectId, userId, selectedRole);
      await fetchMembers();
      setSearchQuery("");
      setSearchResults([]);
      setSelectedRole(ProjectRole.MEMBER); // Reset to default
      setActiveTab("members");
    } catch (error: any) {
      console.error("Failed to add member:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to add member",
        type: "error",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    try {
      await updateMemberRole(projectId, userId, newRole);
      await fetchMembers();
      setEditingRoleFor(null);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to update role",
        type: "error",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMemberFromProject(projectId, userId);
      await fetchMembers();
    } catch (error: any) {
      console.error("Failed to remove member:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to remove member",
        type: "error",
      });
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to transfer ownership? You will lose creator privileges."
      )
    )
      return;

    try {
      await transferProjectOwnership(projectId, userId);
      await fetchMembers();
      console.log("Ownership transferred successfully");
    } catch (error: any) {
      console.error("Failed to transfer ownership:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="m-0 text-xl font-semibold text-gray-900">
            Manage Members
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 px-3 py-3 border-none bg-transparent cursor-pointer text-sm transition-colors ${
              activeTab === "members"
                ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                : "font-normal text-gray-600"
            }`}
          >
            Members ({members.length})
          </button>
          {permissions.canManageMembers && (
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 px-3 py-3 border-none bg-transparent cursor-pointer text-sm transition-colors ${
                activeTab === "add"
                  ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                  : "font-normal text-gray-600"
              }`}
            >
              Add Members
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "members" ? (
            <div>
              {members.map((member) => {
                const isMemberCreator = member.user._id === createdBy?._id;
                const isEditingRole = editingRoleFor === member.user._id;

                return (
                  <div
                    key={member.user._id}
                    className="flex justify-between items-center px-3 py-3 border-b border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {member.user.name}
                        </span>
                        {isMemberCreator ? (
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded"
                            style={{
                              backgroundColor:
                                getRoleColor(ProjectRole.OWNER) + "20",
                              color: getRoleColor(ProjectRole.OWNER),
                            }}
                          >
                            {getRoleDisplayName(ProjectRole.OWNER)}
                          </span>
                        ) : isEditingRole ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.user._id,
                                e.target.value as ProjectRole
                              )
                            }
                            className="px-2 py-0.5 text-xs border border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Object.values(ProjectRole)
                              .filter((r) => r !== ProjectRole.OWNER)
                              .map((role) => (
                                <option key={role} value={role}>
                                  {getRoleDisplayName(role)}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: getRoleColor(member.role) + "20",
                              color: getRoleColor(member.role),
                            }}
                            onClick={() =>
                              permissions.canManageRoles && setEditingRoleFor(member.user._id)
                            }
                            title={permissions.canManageRoles ? "Click to change role" : ""}
                          >
                            {getRoleDisplayName(member.role)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {member.user.email}
                      </div>
                    </div>

                    {permissions.canManageMembers && !isMemberCreator && (
                      <div className="flex gap-2">
                        {isEditingRole && (
                          <button
                            onClick={() => setEditingRoleFor(null)}
                            className="px-3 py-1.5 border border-gray-300"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleTransferOwnership(member.user._id)
                          }
                          className="px-3 py-1.5 border border-blue-500 rounded bg-white"
                        >
                          Make Owner
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="px-3 py-1.5 border border-red-500 rounded bg-white"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Role for New Member
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as ProjectRole)
                  }
                  className="w-full px-3 py-2 border border-gray-300"
                >
                  {Object.values(ProjectRole)
                    .filter((r) => r !== ProjectRole.OWNER)
                    .map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)} - {getRoleDescription(role)}
                      </option>
                    ))}
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 border border-gray-300"
                />
                <p className="text-xs text-gray-600">
                  Type at least 2 characters to search
                </p>
              </div>

              {loading && (
                <p className="text-center text-gray-600">
                  Searching...
                </p>
              )}

              {searchResults.length > 0 && (
                <div>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex justify-between items-center px-3 py-3 border-b border-gray-100"
                    >
                      <div>
                        <div className="font-medium mb-1 text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(user._id)}
                        className="px-4 py-1.5 border-none rounded bg-blue-500 text-white cursor-pointer text-xs hover:bg-blue-600 transition-colors"
                      >
                        Add as {getRoleDisplayName(selectedRole)}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!loading &&
                searchQuery.length >= 2 &&
                searchResults.length === 0 && (
                  <p className="text-center text-gray-600">
                    No users found
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300"
          >
            Close
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
