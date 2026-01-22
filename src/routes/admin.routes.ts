import { Router, type Router as RouterType } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminOnly } from '../middlewares/role.middleware';

const router: RouterType = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authMiddleware);
router.use(adminOnly);

// 获取所有消息列表
// GET /api/admin/messages?page=1&pageSize=10&status=unread
router.get('/messages', AdminController.getAllMessages);

// 批量设置消息超时状态（放在参数路由之前）
// PUT /api/admin/messages/batch-timeout
// Body: { messageIds: [1, 2, 3], isTimeout: true/false }
router.put('/messages/batch-timeout', AdminController.batchSetMessageTimeout);

// 获取消息详情
// GET /api/admin/messages/:id
router.get('/messages/:id', AdminController.getMessageDetail);

// 设置单条消息超时状态
// PUT /api/admin/messages/:id/timeout
// Body: { isTimeout: true/false }
router.put('/messages/:id/timeout', AdminController.setMessageTimeout);

export default router;
