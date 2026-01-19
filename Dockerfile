FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源码
COPY . .

# 构建TypeScript
RUN npm run build

# 删除开发依赖，只保留生产依赖
RUN npm prune --production

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/app.js"]
