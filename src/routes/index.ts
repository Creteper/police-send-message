import { Router } from 'express';
import authRoutes from './auth.routes';
import policeRoutes from './police.routes';
import villageRoutes from './village.routes';
import mockRoutes from './mock.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/police', policeRoutes);
router.use('/village', villageRoutes);
router.use('/mock', mockRoutes);

// 健康检查
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

export default router;
