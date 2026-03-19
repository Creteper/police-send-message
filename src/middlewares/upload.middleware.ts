import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// 确保上传目录存在
const uploadDir = path.join(config.upload.dir, 'violations');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `violation_${uniqueSuffix}${ext}`);
    },
});

// 文件过滤：仅允许图片
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('仅支持上传图片文件 (JPEG, PNG, GIF, WebP, BMP)'));
    }
};

import { RequestHandler } from 'express';

export const uploadViolationImage: RequestHandler = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize, // 默认 10MB
    },
}).single('image');
