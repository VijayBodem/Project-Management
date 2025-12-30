export const ProjectRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type ProjectRole = typeof ProjectRole[keyof typeof ProjectRole];

export const ProjectPermission = {
  // Project permissions
  VIEW_PROJECT: "view_project",
  EDIT_PROJECT: "edit_project",
  DELETE_PROJECT: "delete_project",
  MANAGE_MEMBERS: "manage_members",
  MANAGE_ROLES: "manage_roles",
  
  // Task permissions
  CREATE_TASK: "create_task",
  EDIT_TASK: "edit_task",
  DELETE_TASK: "delete_task",
  ASSIGN_TASK: "assign_task",
  CHANGE_TASK_STATUS: "change_task_status",
  
  // Comment permissions
  CREATE_COMMENT: "create_comment",
  EDIT_OWN_COMMENT: "edit_own_comment",
  DELETE_OWN_COMMENT: "delete_own_comment",
  DELETE_ANY_COMMENT: "delete_any_comment",
} as const;

export type ProjectPermission = typeof ProjectPermission[keyof typeof ProjectPermission];

// Role-based permissions mapping (same as backend)
export const rolePermissions: Record<ProjectRole, ProjectPermission[]> = {
  [ProjectRole.OWNER]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.EDIT_PROJECT,
    ProjectPermission.DELETE_PROJECT,
    ProjectPermission.MANAGE_MEMBERS,
    ProjectPermission.MANAGE_ROLES,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.EDIT_TASK,
    ProjectPermission.DELETE_TASK,
    ProjectPermission.ASSIGN_TASK,
    ProjectPermission.CHANGE_TASK_STATUS,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.EDIT_OWN_COMMENT,
    ProjectPermission.DELETE_OWN_COMMENT,
    ProjectPermission.DELETE_ANY_COMMENT,
  ],
  [ProjectRole.ADMIN]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.EDIT_PROJECT,
    ProjectPermission.MANAGE_MEMBERS,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.EDIT_TASK,
    ProjectPermission.DELETE_TASK,
    ProjectPermission.ASSIGN_TASK,
    ProjectPermission.CHANGE_TASK_STATUS,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.EDIT_OWN_COMMENT,
    ProjectPermission.DELETE_OWN_COMMENT,
    ProjectPermission.DELETE_ANY_COMMENT,
  ],
  [ProjectRole.MEMBER]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.CREATE_TASK,
    ProjectPermission.EDIT_TASK,
    ProjectPermission.ASSIGN_TASK,
    ProjectPermission.CHANGE_TASK_STATUS,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.EDIT_OWN_COMMENT,
    ProjectPermission.DELETE_OWN_COMMENT,
  ],
  [ProjectRole.VIEWER]: [
    ProjectPermission.VIEW_PROJECT,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.EDIT_OWN_COMMENT,
    ProjectPermission.DELETE_OWN_COMMENT,
  ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (
  role: ProjectRole,
  permission: ProjectPermission
): boolean => {
  return rolePermissions[role].includes(permission);
};

// Helper function to get role display name
export const getRoleDisplayName = (role: ProjectRole): string => {
  const names: Record<ProjectRole, string> = {
    [ProjectRole.OWNER]: "Owner",
    [ProjectRole.ADMIN]: "Admin",
    [ProjectRole.MEMBER]: "Member",
    [ProjectRole.VIEWER]: "Viewer",
  };
  return names[role];
};

// Helper function to get role color
export const getRoleColor = (role: ProjectRole): string => {
  const colors: Record<ProjectRole, string> = {
    [ProjectRole.OWNER]: "#9c27b0",
    [ProjectRole.ADMIN]: "#f44336",
    [ProjectRole.MEMBER]: "#2196f3",
    [ProjectRole.VIEWER]: "#757575",
  };
  return colors[role];
};
