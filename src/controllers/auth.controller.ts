import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class AuthController {
  // 登录（支持可选的微信绑定）
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password, code } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    // code 可选，如果提供则登录后自动绑定微信
    const result = await AuthService.login(username, password, code);

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

  // 微信小程序登录（村长端专用）
  static wechatLogin = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: '微信登录code不能为空',
      });
      return;
    }

    const result = await AuthService.wechatLogin(code);

    res.json({
      success: true,
      data: result,
      message: '登录成功',
    });
  });

  // 绑定微信账号
  static bindWechat = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: '微信登录code不能为空',
      });
      return;
    }

    await AuthService.bindWechat(userId, code);

    res.json({
      success: true,
      message: '绑定成功',
    });
  });

  // 解绑微信账号
  static unbindWechat = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await AuthService.unbindWechat(userId);

    res.json({
      success: true,
      message: '解绑成功',
    });
  });
}
