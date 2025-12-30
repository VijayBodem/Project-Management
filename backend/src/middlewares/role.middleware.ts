import { Request, Response, NextFunction } from "express";

import { UserRole } from "../utils/roles";

/**
 * Role-based access control
 */

/**
 * Role-based access control
 */
export const authorize =
  (allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log(
      "allowedroles****",
      allowedRoles,
      "req.usr.role",
      req.user.role
    );

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden*******" });
    }

    next();
  };
