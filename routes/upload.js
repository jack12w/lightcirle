// lightcirle — File Upload Route (with OSS support)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');
const { uploadToOss, isOssEnabled, getR2Config } = require('./oss');
const { signPutUrl } = require('./r2-presign');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads dir exists
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch(e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // multer 默认以 latin1 编码接收 multipart 文件名，需转回 UTF-8 才能正确保存/显示中文名
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    file.originalname = originalname;
    const ext = path.extname(originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const MAX_FILE_SIZE_MB = 150; // 上传上限（图片+视频共用）

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|mp4|mov|avi|webm)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和视频格式: jpg/png/gif/webp/svg/ico/mp4/mov/avi/webm'));
    }
  }
});

// multer 错误（超限/格式）在这里拦截，返回明确中文提示，不再掉进兜底 500
function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const detail = err.code === 'LIMIT_FILE_SIZE'
        ? `文件超过 ${MAX_FILE_SIZE_MB}MB 上限，请压缩后重试`
        : err.message;
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
        .json({ title: 'Upload Error', status: 400, detail });
    }
    next();
  });
}

// POST /api/upload (auth required)
// Accepts: multipart form with 'file' field
// Optional: 'folder' field — 'products', 'articles', 'site' (default)
router.post('/', authenticate, handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ title: 'Upload Error', status: 400, detail: '请选择文件' });
  }

  const db = getDb();
  const folder = req.body.folder || 'site';
  const { filename, originalname, mimetype, size } = req.file;
  const localPath = path.join(UPLOADS_DIR, filename);

  let filePath = '/uploads/' + filename;
  let ossPath = '';

  try {
    if (isOssEnabled()) {
      // Upload to OSS
      const result = await uploadToOss(localPath, filename, folder);
      filePath = result.url;  // Use OSS URL
      ossPath = result.ossPath;

      // Remove local temp file after OSS upload
      try { fs.unlinkSync(localPath); } catch(e) {}
    }

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO media (filename, original_name, file_path, mime_type, file_size, folder, oss_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(filename, originalname, filePath, mimetype, size, folder, ossPath);

    const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
    res.status(201).json({ id, filename, originalName: originalname, filePath, mimeType: mimetype, fileSize: size, folder, url: filePath });

  } catch (err) {
    console.error('Upload failed:', err.message);
    // Clean up local file on error
    try { fs.unlinkSync(localPath); } catch(e) {}
    res.status(500).json({ title: 'Upload Error', status: 500, detail: '上传失败: ' + err.message });
  }
});

// POST /api/upload/presign — return an R2 presigned PUT URL so the browser uploads
// the file DIRECTLY to R2 (the file never transits our server). When R2 is not
// enabled we return 501 and the frontend falls back to the server-upload route above.
router.post('/presign', authenticate, (req, res) => {
  const config = getR2Config();
  if (!config || !config.enabled) {
    return res.status(501).json({ title: 'R2 Disabled', status: 501, detail: 'R2 未启用，已回退服务器上传' });
  }
  const body = req.body || {};
  const filename = body.filename;
  if (!filename) return res.status(400).json({ title: 'Bad Request', status: 400, detail: '缺少 filename' });

  const safeFolder = String(body.folder || 'site').replace(/[^a-zA-Z0-9_-]/g, '');
  const ext = path.extname(filename);
  const key = config.prefix + '/' + safeFolder + '/' + Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;

  const publicUrl = config.publicUrl
    ? config.publicUrl.replace(/\/$/, '') + '/' + key
    : config.endpoint.replace(/\/$/, '') + '/' + config.bucket + '/' + key;

  try {
    const uploadUrl = signPutUrl({
      endpoint: config.endpoint,
      bucket: config.bucket,
      region: 'auto',
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.accessKeySecret,
      key,
      expiresIn: 15 * 60,
    });
    res.json({ uploadUrl, key, publicUrl, expiresIn: 15 * 60 });
  } catch (err) {
    res.status(500).json({ title: 'Presign Error', status: 500, detail: err.message });
  }
});

module.exports = router;
