import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class AuthController {
  // 登录
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    const result = await AuthService.login(username, password);

    res.json({
      success: true,
      data: result,
      message: '登录成功',
    });
  });

  // 获取当前用户信息
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await AuthService.getProfile(userId);

    res.json({
      success: true,
      data: user,
    });
  });

  // 更新个人信息
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, phone, avatar } = req.body;

    const user = await AuthService.updateProfile(userId, { name, phone, avatar });

    res.json({
      success: true,
      data: user,
      message: '更新成功',
    });
  });

  // 修改密码
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: '原密码和新密码不能为空',
      });
      return;
    }

    await AuthService.changePassword(userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: '密码修改成功',
    });
  });

  // 登出（前端清除token即可，这里只返回成功）
  static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: '登出成功',
    });
  });
}
