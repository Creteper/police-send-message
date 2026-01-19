import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Village } from '../entities/Village';
import { SystemConfig } from '../entities/SystemConfig';
import { UserRole } from '../types';

export async function seedInitialData(): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);
  const villageRepository = AppDataSource.getRepository(Village);
  const configRepository = AppDataSource.getRepository(SystemConfig);

  // 检查是否已经有数据
  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('数据库已有数据，跳过种子数据初始化');
    return;
  }

  console.log('开始初始化种子数据...');

  // 1. 创建系统配置
  const configs = [
    {
      key: 'unread_timeout_hours',
      value: '24',
      description: '消息未查看超时时间（小时）',
    },
  ];

  for (const cfg of configs) {
    const existing = await configRepository.findOne({ where: { key: cfg.key } });
    if (!existing) {
      await configRepository.save(configRepository.create(cfg));
    }
  }
  console.log('系统配置初始化完成');

  // 2. 创建示例村庄（五大连池市部分村庄 - 用户可以在数据库中添加更多）
  const villages = [
    { name: '龙镇村', area: '五大连池市龙镇' },
    { name: '和平村', area: '五大连池市和平镇' },
    { name: '建设村', area: '五大连池市建设乡' },
    { name: '太平村', area: '五大连池市太平乡' },
    { name: '新发村', area: '五大连池市新发镇' },
    { name: '兴隆村', area: '五大连池市兴隆镇' },
    { name: '团结村', area: '五大连池市团结镇' },
    { name: '双泉村', area: '五大连池市双泉镇' },
    { name: '朝阳村', area: '五大连池市朝阳乡' },
    { name: '莲花村', area: '五大连池市莲花镇' },
  ];

  const savedVillages: Village[] = [];
  for (const v of villages) {
    const village = villageRepository.create(v);
    savedVillages.push(await villageRepository.save(village));
  }
  console.log(`创建了${savedVillages.length}个示例村庄`);

  // 3. 创建示例警察账号
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const policeUser = userRepository.create({
    username: 'police001',
    password: hashedPassword,
    name: '张警官',
    phone: '13800138001',
    role: UserRole.POLICE,
    badgeNumber: 'P001',
  });
  await userRepository.save(policeUser);
  console.log('创建示例警察账号: police001 / 123456');

  // 4. 为每个村庄创建一个村长账号
  for (let i = 0; i < savedVillages.length; i++) {
    const village = savedVillages[i];
    const villageChief = userRepository.create({
      username: `chief${String(i + 1).padStart(3, '0')}`,
      password: hashedPassword,
      name: `${village.name}村长`,
      phone: `1380013800${String(i + 2).padStart(1, '0')}`,
      role: UserRole.VILLAGE_CHIEF,
      villageId: village.id,
    });
    await userRepository.save(villageChief);
  }
  console.log(`创建了${savedVillages.length}个村长账号 (chief001~chief010 / 123456)`);

  console.log('种子数据初始化完成');
}
