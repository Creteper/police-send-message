import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { MessageStatus } from '../types';

export class AdminController {
  // 获取所有消息列表
  static getAllMessages = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as MessageStatus | undefined;

    const validStatuses = Object.values(MessageStatus);
    const statusFilter = status && validStatuses.includes(status) ? status : undefined;

    const result = await MessageService.getAllMessages({
      page,
      pageSize,
      status: statusFilter,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // 获取消息详情
  static getMessageDetail = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    const message = await MessageService.getMessageDetailForAdmin(messageId);

    res.json({
      success: true,
      data: message,
    });
  });

  // 设置消息超时状态
  static setMessageTimeout = asyncHandler(async (req: Request, res: Response) => {
    const messageId = parseInt(req.params.id);
    const { isTimeout } = req.body;

    if (isNaN(messageId)) {
      res.status(400).json({
        success: false,
        error: '无效的消息ID',
      });
      return;
    }

    if (typeof isTimeout !== 'boolean') {
      res.status(400).json({
        success: false,
        error: '请提供有效的 isTimeout 参数（true 或 false）',
      });
      return;
    }

    const message = await MessageService.setMessageTimeout(messageId, isTimeout);

    res.json({
      success: true,
      data: message,
      message: isTimeout ? '已设置为超时状态' : '已取消超时状态',
    });
  });

  // 批量设置消息超时状态
  static batchSetMessageTimeout = asyncHandler(async (req: Request, res: Response) => {
    const { messageIds, isTimeout } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '请提供有效的消息ID数组',
      });
      return;
    }

    if (typeof isTimeout !== 'boolean') {
      res.status(400).json({
        success: false,
        error: '请提供有效的 isTimeout 参数（true 或 false）',
      });
      return;
    }

    const result = await MessageService.batchSetMessageTimeout(messageIds, isTimeout);

    res.json({
      success: true,
      data: result,
      message: `操作完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
    });
  });
}
