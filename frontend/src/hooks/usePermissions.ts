import { useMemo } from "react";
import { ProjectRole, ProjectPermission, hasPermission } from "../types/permissions";

interface UsePermissionsProps {
  userRole?: ProjectRole;
}

export const usePermissions = ({ userRole }: UsePermissionsProps) => {
  const permissions = useMemo(() => {
    if (!userRole) {
      return {
        canViewProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canManageMembers: false,
        canManageRoles: false,
        canCreateTask: false,
        canEditTask: false,
        canDeleteTask: false,
        canAssignTask: false,
        canChangeTaskStatus: false,
        canCreateComment: false,
        canEditOwnComment: false,
        canDeleteOwnComment: false,
        canDeleteAnyComment: false,
        hasPermission: () => false,
      };
    }

    return {
      canViewProject: hasPermission(userRole, ProjectPermission.VIEW_PROJECT),
      canEditProject: hasPermission(userRole, ProjectPermission.EDIT_PROJECT),
      canDeleteProject: hasPermission(userRole, ProjectPermission.DELETE_PROJECT),
      canManageMembers: hasPermission(userRole, ProjectPermission.MANAGE_MEMBERS),
      canManageRoles: hasPermission(userRole, ProjectPermission.MANAGE_ROLES),
      canCreateTask: hasPermission(userRole, ProjectPermission.CREATE_TASK),
      canEditTask: hasPermission(userRole, ProjectPermission.EDIT_TASK),
      canDeleteTask: hasPermission(userRole, ProjectPermission.DELETE_TASK),
      canAssignTask: hasPermission(userRole, ProjectPermission.ASSIGN_TASK),
      canChangeTaskStatus: hasPermission(userRole, ProjectPermission.CHANGE_TASK_STATUS),
      canCreateComment: hasPermission(userRole, ProjectPermission.CREATE_COMMENT),
      canEditOwnComment: hasPermission(userRole, ProjectPermission.EDIT_OWN_COMMENT),
      canDeleteOwnComment: hasPermission(userRole, ProjectPermission.DELETE_OWN_COMMENT),
      canDeleteAnyComment: hasPermission(userRole, ProjectPermission.DELETE_ANY_COMMENT),
      hasPermission: (permission: ProjectPermission) => hasPermission(userRole, permission),
    };
  }, [userRole]);

  return permissions;
};
