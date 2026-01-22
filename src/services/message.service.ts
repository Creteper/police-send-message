import { LessThan, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Message } from '../entities/Message';
import { Violation } from '../entities/Violation';
import { User } from '../entities/User';
import { Village } from '../entities/Village';
import { SystemConfig } from '../entities/SystemConfig';
import {
  MessageStatus,
  ViolationStatus,
  UserRole,
  PaginationQuery,
  PaginatedResult,
} from '../types';
import { AppError } from '../middlewares/error.middleware';

const messageRepository = () => AppDataSource.getRepository(Message);
const violationRepository = () => AppDataSource.getRepository(Violation);
const userRepository = () => AppDataSource.getRepository(User);
const villageRepository = () => AppDataSource.getRepository(Village);
const systemConfigRepository = () => AppDataSource.getRepository(SystemConfig);

export class MessageService {
  // 获取超时时间配置（小时）
  static async getTimeoutHours(): Promise<number> {
    const config = await systemConfigRepository().findOne({
      where: { key: 'unread_timeout_hours' },
    });
    return config ? parseInt(config.value, 10) : 24;
  }

  // 警察分发违章给村长
  static async dispatchViolation(
    violationId: number,
    policeId: number,
    villageChiefIds: number[]
  ): Promise<Message[]> {
    const violation = await violationRepository().findOne({
      where: { id: violationId },
    });

    if (!violation) {
      throw new AppError('违章信息不存在', 404);
    }

    if (violation.status !== ViolationStatus.PENDING && violation.status !== ViolationStatus.RETURNED) {
      throw new AppError('该违章信息已被处理', 400);
    }

    // 验证村长ID是否有效
    const villageChiefs = await userRepository().find({
      where: {
        id: In(villageChiefIds),
        role: UserRole.VILLAGE_CHIEF,
      },
    });

    if (villageChiefs.length !== villageChiefIds.length) {
      throw new AppError('部分村长ID无效', 400);
    }

    const now = new Date();
    const messages: Message[] = [];

    for (const chiefId of villageChiefIds) {
      const message = messageRepository().create({
        violationId,
        policeId,
        villageChiefId: chiefId,
        status: MessageStatus.UNREAD,
        sentAt: now,
      });
      messages.push(message);
    }

    await messageRepository().save(messages);

    // 更新违章状态为处理中
    violation.status = ViolationStatus.PROCESSING;
    await violationRepository().save(violation);

    return messages;
  }

  // 获取警察发送的未读消息
  static async getUnreadMessages(
    policeId: number,
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await messageRepository().findAndCount({
      where: {
        policeId,
        status: MessageStatus.UNREAD,
      },
      relations: ['violation', 'villageChief', 'villageChief.village'],
      order: { sentAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取超时消息
  static async getTimeoutMessages(
    policeId: number,
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await messageRepository().findAndCount({
      where: {
        policeId,
        status: MessageStatus.TIMEOUT,
      },
      relations: ['violation', 'villageChief', 'villageChief.village'],
      order: { sentAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取被退回的消息
  static async getRejectedMessages(
    policeId: number,
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await messageRepository().findAndCount({
      where: {
        policeId,
        status: MessageStatus.REJECTED,
      },
      relations: ['violation', 'villageChief', 'villageChief.village'],
      order: { processedAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取警察的历史记录
  static async getPoliceHistory(
    policeId: number,
    status: 'completed' | 'uncompleted',
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const statusFilter =
      status === 'completed'
        ? [MessageStatus.CONFIRMED]
        : [MessageStatus.UNREAD, MessageStatus.READ, MessageStatus.TIMEOUT, MessageStatus.REJECTED];

    const [items, total] = await messageRepository().findAndCount({
      where: {
        policeId,
        status: In(statusFilter),
      },
      relations: ['violation', 'villageChief', 'villageChief.village'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取村长待处理的消息
  static async getVillageChiefPendingMessages(
    villageChiefId: number,
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await messageRepository().findAndCount({
      where: {
        villageChiefId,
        status: In([MessageStatus.UNREAD, MessageStatus.READ]),
      },
      relations: ['violation', 'police'],
      order: { sentAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取消息详情并标记为已读
  static async getMessageDetail(
    messageId: number,
    userId: number,
    role: UserRole
  ): Promise<Message> {
    const whereCondition: any = { id: messageId };
    
    if (role === UserRole.VILLAGE_CHIEF) {
      whereCondition.villageChiefId = userId;
    } else if (role === UserRole.POLICE) {
      whereCondition.policeId = userId;
    }

    const message = await messageRepository().findOne({
      where: whereCondition,
      relations: ['violation', 'police', 'villageChief', 'villageChief.village'],
    });

    if (!message) {
      throw new AppError('消息不存在或无权访问', 404);
    }

    // 村长查看消息时，标记为已读
    if (role === UserRole.VILLAGE_CHIEF && message.status === MessageStatus.UNREAD) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      await messageRepository().save(message);
    }

    return message;
  }

  // 村长确认（是本村人）
  static async confirmMessage(
    messageId: number,
    villageChiefId: number
  ): Promise<Message> {
    const message = await messageRepository().findOne({
      where: {
        id: messageId,
        villageChiefId,
      },
      relations: ['violation'],
    });

    if (!message) {
      throw new AppError('消息不存在或无权访问', 404);
    }

    if (message.status !== MessageStatus.READ && message.status !== MessageStatus.UNREAD) {
      throw new AppError('该消息状态不允许确认操作', 400);
    }

    message.status = MessageStatus.CONFIRMED;
    message.isLocalResident = true;
    message.processedAt = new Date();
    await messageRepository().save(message);

    // 更新违章状态为已完成
    message.violation.status = ViolationStatus.COMPLETED;
    await violationRepository().save(message.violation);

    return message;
  }

  // 村长退回（非本村人）
  static async rejectMessage(
    messageId: number,
    villageChiefId: number
  ): Promise<Message> {
    const message = await messageRepository().findOne({
      where: {
        id: messageId,
        villageChiefId,
      },
      relations: ['violation'],
    });

    if (!message) {
      throw new AppError('消息不存在或无权访问', 404);
    }

    if (message.status !== MessageStatus.READ && message.status !== MessageStatus.UNREAD) {
      throw new AppError('该消息状态不允许退回操作', 400);
    }

    message.status = MessageStatus.REJECTED;
    message.isLocalResident = false;
    message.processedAt = new Date();
    await messageRepository().save(message);

    // 检查该违章是否还有其他未处理的消息
    const otherMessages = await messageRepository().find({
      where: {
        violationId: message.violationId,
        status: In([MessageStatus.UNREAD, MessageStatus.READ]),
      },
    });

    // 如果没有其他未处理消息，将违章状态改为退回
    if (otherMessages.length === 0) {
      message.violation.status = ViolationStatus.RETURNED;
      await violationRepository().save(message.violation);
    }

    return message;
  }

  // 获取村长历史记录
  static async getVillageChiefHistory(
    villageChiefId: number,
    status: 'processed' | 'unprocessed',
    query: PaginationQuery
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const statusFilter =
      status === 'processed'
        ? [MessageStatus.CONFIRMED, MessageStatus.REJECTED]
        : [MessageStatus.UNREAD, MessageStatus.READ];

    const [items, total] = await messageRepository().findAndCount({
      where: {
        villageChiefId,
        status: In(statusFilter),
      },
      relations: ['violation', 'police'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取所有村庄列表
  static async getAllVillages(): Promise<Village[]> {
    return await villageRepository().find({
      relations: ['chiefs'],
      order: { name: 'ASC' },
    });
  }

  // 获取村长信息
  static async getVillageChiefInfo(chiefId: number): Promise<Partial<User>> {
    const chief = await userRepository().findOne({
      where: { id: chiefId, role: UserRole.VILLAGE_CHIEF },
      relations: ['village'],
    });

    if (!chief) {
      throw new AppError('村长不存在', 404);
    }

    const { password: _, ...chiefWithoutPassword } = chief;
    return chiefWithoutPassword;
  }

  // 获取警察信息（供村长查看）
  static async getPoliceInfo(policeId: number): Promise<Partial<User>> {
    const police = await userRepository().findOne({
      where: { id: policeId, role: UserRole.POLICE },
    });

    if (!police) {
      throw new AppError('警察不存在', 404);
    }

    const { password: _, ...policeWithoutPassword } = police;
    return policeWithoutPassword;
  }

  // 检查并更新超时消息（定时任务使用）
  static async checkAndUpdateTimeoutMessages(): Promise<number> {
    const timeoutHours = await this.getTimeoutHours();
    const timeoutDate = new Date();
    timeoutDate.setHours(timeoutDate.getHours() - timeoutHours);

    const result = await messageRepository()
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.TIMEOUT })
      .where('status = :status', { status: MessageStatus.UNREAD })
      .andWhere('sent_at < :timeoutDate', { timeoutDate })
      .execute();

    return result.affected || 0;
  }

  // ==================== 管理员功能 ====================

  // 获取所有消息列表（管理员）
  static async getAllMessages(
    query: PaginationQuery & { status?: MessageStatus }
  ): Promise<PaginatedResult<Message>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const whereCondition: any = {};
    if (query.status) {
      whereCondition.status = query.status;
    }

    const [items, total] = await messageRepository().findAndCount({
      where: whereCondition,
      relations: ['violation', 'police', 'villageChief', 'villageChief.village'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 设置消息超时状态（管理员）
  static async setMessageTimeout(
    messageId: number,
    isTimeout: boolean
  ): Promise<Message> {
    const message = await messageRepository().findOne({
      where: { id: messageId },
      relations: ['violation', 'police', 'villageChief'],
    });

    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    if (isTimeout) {
      // 设置为超时状态
      if (message.status !== MessageStatus.UNREAD && message.status !== MessageStatus.READ) {
        throw new AppError('只有未读或已读状态的消息才能设置为超时', 400);
      }
      message.status = MessageStatus.TIMEOUT;
    } else {
      // 取消超时状态，恢复为未读
      if (message.status !== MessageStatus.TIMEOUT) {
        throw new AppError('该消息不是超时状态', 400);
      }
      message.status = MessageStatus.UNREAD;
    }

    await messageRepository().save(message);
    return message;
  }

  // 批量设置消息超时状态（管理员）
  static async batchSetMessageTimeout(
    messageIds: number[],
    isTimeout: boolean
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of messageIds) {
      try {
        await this.setMessageTimeout(id, isTimeout);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  // 获取消息详情（管理员，不受权限限制）
  static async getMessageDetailForAdmin(messageId: number): Promise<Message> {
    const message = await messageRepository().findOne({
      where: { id: messageId },
      relations: ['violation', 'police', 'villageChief', 'villageChief.village'],
    });

    if (!message) {
      throw new AppError('消息不存在', 404);
    }

    return message;
  }
}
