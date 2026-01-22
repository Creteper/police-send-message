import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

export const roleMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: '无权访问此资源',
      });
      return;
    }

    next();
  };
};

export const policeOnly = roleMiddleware(UserRole.POLICE);
export const villageChiefOnly = roleMiddleware(UserRole.VILLAGE_CHIEF);
export const adminOnly = roleMiddleware(UserRole.ADMIN);
export const anyRole = roleMiddleware(UserRole.POLICE, UserRole.VILLAGE_CHIEF, UserRole.ADMIN);
