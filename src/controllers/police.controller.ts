import { Request, Response } from 'express';
import { ViolationService } from '../services/violation.service';
import { MessageService } from '../services/message.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class PoliceController {
  // 获取未处理的违章列表
  static getPendingViolations = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await ViolationService.getPendingViolations({ page, pageSize });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取违章详情
  static getViolationDetail = asyncHandler(async (req: Request, res: Response) => {
    const violationId = parseInt(req.params.id);

    if (isNaN(violationId)) {
      res.status(400).json({
        success: false,
        error: '无效的违章ID',
      });
      return;
    }

    const violation = await ViolationService.getViolationById(violationId);

    res.json({
      success: true,
      data: violation,
    });
  });

  // 分发违章给村长
  static dispatchViolation = asyncHandler(async (req: Request, res: Response) => {
    const policeId = req.user!.userId;
    const violationId = parseInt(req.params.id);
    const { villageChiefIds } = req.body;

    if (isNaN(violationId)) {
      res.status(400).json({
        success: false,
        error: '无效的违章ID',
      });
      return;
    }

    if (!Array.isArray(villageChiefIds) || villageChiefIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '请选择至少一个村长',
      });
      return;
    }

    const messages = await MessageService.dispatchViolation(
      violationId,
      policeId,
      villageChiefIds
    );

    res.json({
      success: true,
      data: messages,
      message: `成功分发给${messages.length}个村长`,
    });
  });

  // 获取未被查看的消息
  static getUnreadMessages = asyncHandler(async (req: Request, res: Response) => {
    const policeId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await MessageService.getUnreadMessages(policeId, { page, pageSize });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取超时消息
  static getTimeoutMessages = asyncHandler(async (req: Request, res: Response) => {
    const policeId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await MessageService.getTimeoutMessages(policeId, { page, pageSize });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取被退回的消息
  static getRejectedMessages = asyncHandler(async (req: Request, res: Response) => {
    const policeId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await MessageService.getRejectedMessages(policeId, { page, pageSize });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取被退回的违章列表（可重新分发）
  static getReturnedViolations = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await ViolationService.getReturnedViolations({ page, pageSize });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取历史记录
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const policeId = req.user!.userId;
    const status = (req.query.status as string) || 'completed';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const validStatus = status === 'uncompleted' ? 'uncompleted' : 'completed';
    const result = await MessageService.getPoliceHistory(policeId, validStatus, {
      page,
      pageSize,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取所有村庄列表
  static getVillages = asyncHandler(async (_req: Request, res: Response) => {
    const villages = await MessageService.getAllVillages();

    res.json({
      success: true,
      data: villages,
    });
  });

  // 获取村长信息
  static getVillageChiefInfo = asyncHandler(async (req: Request, res: Response) => {
    const chiefId = parseInt(req.params.id);

    if (isNaN(chiefId)) {
      res.status(400).json({
        success: false,
        error: '无效的村长ID',
      });
      return;
    }

    const chief = await MessageService.getVillageChiefInfo(chiefId);

    res.json({
      success: true,
      data: chief,
    });
  });

  // 获取消息详情
  static getMessageDetail = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    const message = await MessageService.getMessageDetail(messageId, userId, role);

    res.json({
      success: true,
      data: message,
    });
  });
}
