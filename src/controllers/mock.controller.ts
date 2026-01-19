import { Request, Response } from 'express';
import { MockService } from '../services/mock.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class MockController {
  // 生成Mock违章数据
  static generateViolations = asyncHandler(async (req: Request, res: Response) => {
    const count = parseInt(req.body.count as string) || 10;

    if (count < 1 || count > 100) {
      res.status(400).json({
        success: false,
        error: '数量必须在1-100之间',
      });
      return;
    }

    const violations = await MockService.generateViolations(count);

    res.json({
      success: true,
      data: violations,
      message: `成功生成${violations.length}条违章数据`,
    });
  });

  // 手动添加违章数据
  static createViolation = asyncHandler(async (req: Request, res: Response) => {
    const {
      violationTime,
      violationTag,
      imageUrl,
      offenderName,
      offenderPhone,
      plateNumber,
      ownerName,
      ownerPhone,
    } = req.body;

    // 验证必填字段
    if (!violationTag || !offenderName || !offenderPhone || !plateNumber || !ownerName || !ownerPhone) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      });
      return;
    }

    const violation = await MockService.createViolation({
      violationTime: violationTime ? new Date(violationTime) : new Date(),
      violationTag,
      imageUrl,
      offenderName,
      offenderPhone,
      plateNumber,
      ownerName,
      ownerPhone,
    });

    res.json({
      success: true,
      data: violation,
      message: '违章数据创建成功',
    });
  });
}
