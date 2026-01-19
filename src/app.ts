import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import cron from 'node-cron';
import { config } from './config';
import { AppDataSource } from './config/database';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { MessageService } from './services/message.service';
import { seedInitialData } from './utils/seed';

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API路由
app.use('/api', routes);

// 404处理
app.use(notFoundMiddleware);

// 错误处理
app.use(errorMiddleware);

// 启动定时任务：每小时检查超时消息
cron.schedule('0 * * * *', async () => {
  try {
    const count = await MessageService.checkAndUpdateTimeoutMessages();
    if (count > 0) {
      console.log(`[定时任务] 已将${count}条消息标记为超时`);
    }
  } catch (error) {
    console.error('[定时任务] 检查超时消息失败:', error);
  }
});

// 数据库连接和服务器启动
AppDataSource.initialize()
  .then(async () => {
    console.log('数据库连接成功');

    // 初始化种子数据
    await seedInitialData();

    app.listen(config.port, () => {
      console.log(`服务器运行在端口 ${config.port}`);
      console.log(`环境: ${config.nodeEnv}`);
      console.log(`API地址: http://localhost:${config.port}/api`);
    });
  })
  .catch((error) => {
    console.error('数据库连接失败:', error);
    process.exit(1);
  });

export default app;
