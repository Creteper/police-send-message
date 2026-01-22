import { Router, type Router as RouterType } from 'express';
import { MockController } from '../controllers/mock.controller';

const router: RouterType = Router();

// Mock数据路由（开发环境使用）
router.post('/violations/generate', MockController.generateViolations);
router.post('/violations', MockController.createViolation);

export default router;
