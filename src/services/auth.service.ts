import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { config } from '../config';
import { JwtPayload, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';

const userRepository = () => AppDataSource.getRepository(User);

export class AuthService {
  static async login(
    username: string,
    password: string
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
}
