import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { UserRole } from '../types';

export class VillageController {
  // 获取待处理消息
  static getPendingMessages = asyncHandler(async (req: Request, res: Response) => {
    const villageChiefId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await MessageService.getVillageChiefPendingMessages(villageChiefId, {
      page,
      pageSize,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取消息详情
  static getMessageDetail = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);
    const userId = req.user!.userId;

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    const message = await MessageService.getMessageDetail(
      messageId,
      userId,
      UserRole.VILLAGE_CHIEF
    );

    res.json({
      success: true,
      data: message,
    });
  });

  // 确认消息（是本村人）
  static confirmMessage = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);
    const villageChiefId = req.user!.userId;

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    const message = await MessageService.confirmMessage(messageId, villageChiefId);

    res.json({
      success: true,
      data: message,
      message: '已确认，该违规人为本村人',
    });
  });

  // 退回消息（非本村人）
  static rejectMessage = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);
    const villageChiefId = req.user!.userId;

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    const message = await MessageService.rejectMessage(messageId, villageChiefId);

    res.json({
      success: true,
      data: message,
      message: '已退回，该违规人非本村人',
    });
  });

  // 获取历史记录
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const villageChiefId = req.user!.userId;
    const status = (req.query.status as string) || 'processed';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const validStatus = status === 'unprocessed' ? 'unprocessed' : 'processed';
    const result = await MessageService.getVillageChiefHistory(villageChiefId, validStatus, {
      page,
      pageSize,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取管辖警察信息
  static getPoliceInfo = asyncHandler(async (req: Request, res: Response) => {
    const policeId = parseInt(req.query.policeId as string);

    if (isNaN(policeId)) {
      res.status(400).json({
        success: false,
        error: '请提供警察ID',
      });
      return;
    }

    const police = await MessageService.getPoliceInfo(policeId);

    res.json({
      success: true,
      data: police,
    });
  });
}
