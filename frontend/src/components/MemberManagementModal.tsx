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
import { ProjectRole, getRoleDisplayName } from "../types/permissions";
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Manage Members
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
              activeTab === "members"
                ? "text-blue-700 bg-white border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Members ({members.length})
            {activeTab === "members" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />
            )}
          </button>
          {permissions.canManageMembers && (
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                activeTab === "add"
                  ? "text-blue-700 bg-white border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Add Members
              {activeTab === "add" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "members" ? (
            <div className="px-8 py-6">
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No members yet
                  </h3>
                  <p className="text-slate-600">
                    Add team members to collaborate on this project
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const isMemberCreator = member.user._id === createdBy?._id;
                    const isEditingRole = editingRoleFor === member.user._id;

                    return (
                      <div
                        key={member.user._id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-700">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900 truncate">
                                {member.user.name}
                              </span>
                              {isMemberCreator && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-600 truncate">
                              {member.user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isEditingRole ? (
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateRole(
                                    member.user._id,
                                    e.target.value as ProjectRole
                                  )
                                }
                                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className={`px-3 py-1 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                                  member.role === ProjectRole.ADMIN
                                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                    : member.role === ProjectRole.MEMBER
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                                onClick={() =>
                                  permissions.canManageRoles &&
                                  !isMemberCreator &&
                                  setEditingRoleFor(member.user._id)
                                }
                                title={
                                  permissions.canManageRoles && !isMemberCreator
                                    ? "Click to change role"
                                    : ""
                                }
                              >
                                {getRoleDisplayName(member.role)}
                              </span>
                            )}
                          </div>
                        </div>

                        {permissions.canManageMembers && !isMemberCreator && (
                          <div className="flex items-center gap-2 ml-4">
                            {isEditingRole && (
                              <button
                                onClick={() => setEditingRoleFor(null)}
                                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
                              >
                                Cancel
                              </button>
                            )}
                            {/* Transfer Ownership button - Only visible to OWNER */}
                            {userRole === ProjectRole.OWNER && (
                              <button
                                onClick={() =>
                                  handleTransferOwnership(member.user._id)
                                }
                                className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
                              >
                                Transfer Ownership
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleRemoveMember(member.user._id)
                              }
                              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="px-8 py-6">
              <div className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Select Role for New Member
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as ProjectRole)
                    }
                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Object.values(ProjectRole)
                      .filter((r) => r !== ProjectRole.OWNER)
                      .map((role) => (
                        <option key={role} value={role}>
                          {getRoleDisplayName(role)} -{" "}
                          {getRoleDescription(role)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Search Users
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-4 pr-10 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Type at least 2 characters to search
                  </p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-600">Searching users...</p>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Search Results
                    </h3>
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-slate-600">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user._id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                          >
                            Add as {getRoleDisplayName(selectedRole)}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!loading &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No users found
                      </h3>
                      <p className="text-slate-600">
                        Try searching with a different name or email
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
