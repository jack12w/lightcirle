// lightcirle — Media Route (with OSS support)
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');
const { deleteFromOss, isOssEnabled } = require('./oss');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// GET /api/media?folder=products
router.get('/', (req, res) => {
  const db = getDb();
  const folder = req.query.folder;

  let rows;
  if (folder && folder !== 'all') {
    rows = db.prepare('SELECT * FROM media WHERE folder = ? ORDER BY created_at DESC').all(folder);
  } else {
    rows = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  }

  res.json(rows.map(f => ({
    id: f.id,
    filename: f.filename,
    originalName: f.original_name,
    filePath: f.file_path,
    mimeType: f.mime_type,
    fileSize: f.file_size,
    folder: f.folder,
    url: f.file_path,
    createdAt: f.created_at,
  })));
});

// GET /api/media/stats — folder counts
router.get('/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM media').get().c;
  const products = db.prepare("SELECT COUNT(*) as c FROM media WHERE folder='products'").get().c;
  const articles = db.prepare("SELECT COUNT(*) as c FROM media WHERE folder='articles'").get().c;
  const company = db.prepare("SELECT COUNT(*) as c FROM media WHERE folder='company'").get().c;
  const site = db.prepare("SELECT COUNT(*) as c FROM media WHERE folder='site'").get().c;
  res.json({ total, products, articles, company, site });
});

// DELETE /api/media/:id (auth required)
router.delete('/:id', authenticate, (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ title: 'Not Found', status: 404, detail: '文件不存在' });

  // Delete from OSS if applicable
  if (file.oss_path && isOssEnabled()) {
    deleteFromOss(file.oss_path).catch(err => console.error('OSS delete error:', err.message));
  }

  // Delete physical file (if local)
  const localPath = path.join(UPLOADS_DIR, file.filename);
  try { fs.unlinkSync(localPath); } catch(e) {}

  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  res.json({ message: '文件已删除' });
});

module.exports = router;
