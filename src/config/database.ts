import { DataSource } from 'typeorm';
import { config } from './index';
import { User } from '../entities/User';
import { Village } from '../entities/Village';
import { Violation } from '../entities/Violation';
import { Message } from '../entities/Message';
import { SystemConfig } from '../entities/SystemConfig';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: [User, Village, Violation, Message, SystemConfig],
  migrations: [],
  subscribers: [],
  charset: 'utf8mb4',
});
