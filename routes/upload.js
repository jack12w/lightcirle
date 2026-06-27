// lightcirle — File Upload Route (with OSS support)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');
const { uploadToOss, isOssEnabled } = require('./oss');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads dir exists
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch(e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos too
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|mp4|mov|avi|webm)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和视频格式: jpg/png/gif/webp/svg/ico/mp4/mov'));
    }
  }
});

// POST /api/upload (auth required)
// Accepts: multipart form with 'file' field
// Optional: 'folder' field — 'products', 'articles', 'site' (default)
router.post('/', authenticate, upload.single('file'), async (req, res) => {
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
    console.error('Upload failed:', err.message, err.stack);
    // Clean up local file on error
    try { fs.unlinkSync(localPath); } catch(e) {}
    res.status(500).json({ title: 'Upload Error', status: 500, detail: '上传失败: ' + err.message });
  }
});

module.exports = router;
