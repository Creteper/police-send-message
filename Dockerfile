FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建TypeScript
RUN npm run build

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/app.js"]
