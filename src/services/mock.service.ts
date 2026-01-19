import { AppDataSource } from '../config/database';
import { Violation } from '../entities/Violation';
import { ViolationStatus } from '../types';

const violationRepository = () => AppDataSource.getRepository(Violation);

// 违规标签列表
const VIOLATION_TAGS = [
  '超载',
  '无证驾驶',
  '酒驾',
  '闯红灯',
  '逆行',
  '超速',
  '违规载人',
  '非法改装',
  '未悬挂号牌',
  '号牌污损',
];

// 随机姓氏
const LAST_NAMES = [
  '张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗',
];

// 随机名字
const FIRST_NAMES = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
  '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188'];
  const prefix = randomElement(prefixes);
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function randomPlate(): string {
  const provinces = ['黑'];
  const cities = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let plate = randomElement(provinces) + randomElement(cities);
  // 农用车格式
  plate += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) {
    plate += numbers[Math.floor(Math.random() * numbers.length)];
  }
  return plate;
}

function randomName(): string {
  return randomElement(LAST_NAMES) + randomElement(FIRST_NAMES);
}

function randomDate(daysBack: number = 30): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return pastDate;
}

export class MockService {
  // 生成指定数量的Mock违章数据
  static async generateViolations(count: number = 10): Promise<Violation[]> {
    const violations: Violation[] = [];

    for (let i = 0; i < count; i++) {
      const offenderName = randomName();
      const ownerName = Math.random() > 0.5 ? offenderName : randomName(); // 50%概率车主就是违规人

      const violation = violationRepository().create({
        violationTime: randomDate(),
        violationTag: randomElement(VIOLATION_TAGS),
        imageUrl: `/uploads/mock/violation_${Date.now()}_${i}.jpg`,
        offenderName,
        offenderPhone: randomPhone(),
        plateNumber: randomPlate(),
        ownerName,
        ownerPhone: ownerName === offenderName ? '' : randomPhone(),
        status: ViolationStatus.PENDING,
      });

      // 如果车主就是违规人，手机号一样
      if (ownerName === offenderName) {
        violation.ownerPhone = violation.offenderPhone;
      }

      violations.push(violation);
    }

    await violationRepository().save(violations);
    return violations;
  }

  // 手动添加违章数据
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
}
