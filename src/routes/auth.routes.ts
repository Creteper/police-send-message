import { Router, type Router as RouterType } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: RouterType = Router();

// 公开路由
router.post('/login', AuthController.login);
router.post('/wechat/login', AuthController.wechatLogin); // 微信小程序登录（村长端）

// 需要认证的路由
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/password', authMiddleware, AuthController.changePassword);
router.post('/wechat/bind', authMiddleware, AuthController.bindWechat); // 绑定微信
router.post('/wechat/unbind', authMiddleware, AuthController.unbindWechat); // 解绑微信

export default router;
