import { Router } from 'express';
import { VillageController } from '../controllers/village.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { villageChiefOnly } from '../middlewares/role.middleware';

const router = Router();

// 所有路由都需要认证和村长角色
router.use(authMiddleware, villageChiefOnly);

// 消息相关
router.get('/messages/pending', VillageController.getPendingMessages);
router.get('/messages/:id', VillageController.getMessageDetail);
router.post('/messages/:id/confirm', VillageController.confirmMessage);
router.post('/messages/:id/reject', VillageController.rejectMessage);

// 历史记录
router.get('/history', VillageController.getHistory);

// 警察信息
router.get('/police-info', VillageController.getPoliceInfo);

export default router;
