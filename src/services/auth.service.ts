import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { config } from '../config';
import { JwtPayload, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { WechatService } from './wechat.service';

const userRepository = () => AppDataSource.getRepository(User);

export class AuthService {
  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @param wxCode 可选，微信登录code，如果提供则登录后自动绑定微信
   */
  static async login(
    username: string,
    password: string,
    wxCode?: string
  ): Promise<{ user: Partial<User>; token: string }> {
    const user = await userRepository().findOne({
      where: { username },
      relations: ['village'],
    });

    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 如果提供了微信code且是村长角色，则自动绑定微信
    if (wxCode && user.role === UserRole.VILLAGE_CHIEF) {
      try {
        const sessionData = await WechatService.code2Session(wxCode);
        const openid = sessionData.openid;

        // 检查该 openid 是否已被其他账号绑定
        // const existingUser = await userRepository().findOne({
        //   where: { wxOpenid: openid },
        // });
        // if (!existingUser || existingUser.id === user.id) {
        // 绑定 openid
        user.wxOpenid = openid;
        await userRepository().save(user);
        // }
        // 如果已被其他账号绑定，静默忽略，不影响登录流程
      } catch (error) {
        // 微信绑定失败不影响登录，只记录日志
        console.error('微信绑定失败:', error);
      }
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  static async getProfile(userId: number): Promise<Partial<User>> {
    const user = await userRepository().findOne({
      where: { id: userId },
      relations: ['village'],
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(
    userId: number,
    data: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>
  ): Promise<Partial<User>> {
    const user = await userRepository().findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.avatar) user.avatar = data.avatar;

    await userRepository().save(user);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository().findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('原密码错误', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await userRepository().save(user);
  }

  static async createUser(data: {
    username: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    badgeNumber?: string;
    villageId?: number;
  }): Promise<Partial<User>> {
    const existingUser = await userRepository().findOne({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new AppError('用户名已存在', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = userRepository().create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: data.role,
      badgeNumber: data.badgeNumber || null,
      villageId: data.villageId || null,
    });

    await userRepository().save(user);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 微信小程序登录（村长端专用）
   * @param code 微信登录code
   */
  static async wechatLogin(code: string): Promise<{ user: Partial<User>; token: string }> {
    // 1. 使用 code 换取 openid
    const sessionData = await WechatService.code2Session(code);
    const openid = sessionData.openid;

    // 2. 查找是否有绑定该 openid 的村长用户
    let user = await userRepository().findOne({
      where: { wxOpenid: openid, role: UserRole.VILLAGE_CHIEF },
      relations: ['village'],
    });

    if (!user) {
      throw new AppError('该微信未绑定村长账号，请先绑定', 401);
    }

    // 3. 生成 JWT token
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 绑定微信账号（村长用账号密码登录后绑定）
   * @param userId 用户ID
   * @param code 微信登录code
   */
  static async bindWechat(userId: number, code: string): Promise<void> {
    const user = await userRepository().findOne({
      where: { id: userId, role: UserRole.VILLAGE_CHIEF },
    });

    if (!user) {
      throw new AppError('用户不存在或不是村长角色', 404);
    }

    // 使用 code 换取 openid
    const sessionData = await WechatService.code2Session(code);
    const openid = sessionData.openid;

    // 检查该 openid 是否已被其他账号绑定
    const existingUser = await userRepository().findOne({
      where: { wxOpenid: openid },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new AppError('该微信已绑定其他账号', 400);
    }

    // 绑定 openid
    user.wxOpenid = openid;
    await userRepository().save(user);
  }

  /**
   * 解绑微信账号
   * @param userId 用户ID
   */
  static async unbindWechat(userId: number): Promise<void> {
    const user = await userRepository().findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    user.wxOpenid = null;
    await userRepository().save(user);
  }
}
