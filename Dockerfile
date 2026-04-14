# 阶段 1: 构建项目
FROM node:24-alpine AS builder
WORKDIR /app

# 复制依赖配置文件
COPY package*.json ./

# 使用国内npm镜像加速安装
RUN npm install --registry=https://registry.npmmirror.com

# 复制项目源码
COPY . ./

# 构建项目
RUN npm run build

# 阶段 2: 运行 Nginx
FROM nginx:stable-alpine

# 删除默认配置
RUN rm -rf /usr/share/nginx/html/*

# 将构建产物复制到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
