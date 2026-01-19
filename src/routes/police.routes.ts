import { Router } from 'express';
import { PoliceController } from '../controllers/police.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { policeOnly } from '../middlewares/role.middleware';

const router = Router();

// 所有路由都需要认证和警察角色
router.use(authMiddleware, policeOnly);

// 违章相关
router.get('/violations/pending', PoliceController.getPendingViolations);
router.get('/violations/returned', PoliceController.getReturnedViolations);
router.get('/violations/:id', PoliceController.getViolationDetail);
router.post('/violations/:id/dispatch', PoliceController.dispatchViolation);

// 消息相关
router.get('/messages/unread', PoliceController.getUnreadMessages);
router.get('/messages/timeout', PoliceController.getTimeoutMessages);
router.get('/messages/rejected', PoliceController.getRejectedMessages);
router.get('/messages/:id', PoliceController.getMessageDetail);

// 历史记录
router.get('/history', PoliceController.getHistory);

// 村庄和村长信息
router.get('/villages', PoliceController.getVillages);
router.get('/village-chief/:id', PoliceController.getVillageChiefInfo);

export default router;
