import { AppDataSource } from '../config/database';
import { Violation } from '../entities/Violation';
import { ViolationStatus, PaginationQuery, PaginatedResult } from '../types';
import { AppError } from '../middlewares/error.middleware';

const violationRepository = () => AppDataSource.getRepository(Violation);

export class ViolationService {
  static async getPendingViolations(
    query: PaginationQuery
  ): Promise<PaginatedResult<Violation>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await violationRepository().findAndCount({
      where: { status: ViolationStatus.PENDING },
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

  static async getViolationById(id: number): Promise<Violation> {
    const violation = await violationRepository().findOne({
      where: { id },
      relations: ['messages', 'messages.villageChief', 'messages.police'],
    });

    if (!violation) {
      throw new AppError('违章信息不存在', 404);
    }

    return violation;
  }

  static async updateViolationStatus(
    id: number,
    status: ViolationStatus
  ): Promise<Violation> {
    const violation = await violationRepository().findOne({
      where: { id },
    });

    if (!violation) {
      throw new AppError('违章信息不存在', 404);
    }

    violation.status = status;
    await violationRepository().save(violation);

    return violation;
  }

  static async createViolation(data: {
    violationTime: Date;
    violationTag: string;
    imageUrl?: string;
    offenderName: string;
    offenderPhone: string;
    plateNumber: string;
    ownerName: string;
    ownerPhone: string;
  }): Promise<Violation> {
    const violation = violationRepository().create({
      violationTime: data.violationTime,
      violationTag: data.violationTag,
      imageUrl: data.imageUrl || null,
      offenderName: data.offenderName,
      offenderPhone: data.offenderPhone,
      plateNumber: data.plateNumber,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      status: ViolationStatus.PENDING,
    });

    await violationRepository().save(violation);
    return violation;
  }

  static async getReturnedViolations(
    query: PaginationQuery
  ): Promise<PaginatedResult<Violation>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [items, total] = await violationRepository().findAndCount({
      where: { status: ViolationStatus.RETURNED },
      order: { updatedAt: 'DESC' },
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
}
