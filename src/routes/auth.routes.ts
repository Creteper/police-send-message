import { Router, type Router as RouterType } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: RouterType = Router();

// 公开路由
router.post('/login', AuthController.login);

// 需要认证的路由
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/password', authMiddleware, AuthController.changePassword);

export default router;
