'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../db');
const auth = require('../../middleware/auth');

const FILES_DIR = path.join(__dirname, '../../../uploads/files');

const upload = multer({
  storage: multer.diskStorage({
    destination: FILES_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
});

router.post('/upload', auth, async (req, res) => {
  let originalname, filename, filepath, filesize;
  const contentType = req.headers['content-type'] || '';

  try {
    if (contentType.includes('multipart') && contentType.includes('boundary=')) {
      await new Promise((resolve, reject) =>
        upload.single('qqfile')(req, res, err => err ? reject(err) : resolve())
      );
      if (!req.file) return res.json({ success: false, error: 'No file received' });
      originalname = req.file.originalname;
      filename = req.file.filename;
      filepath = `/uploads/files/${filename}`;
      filesize = req.file.size;
    } else {
      const rawName = req.headers['x-file-name'] || req.query.qqfile || 'upload';
      originalname = decodeURIComponent(rawName);
      filename = `${Date.now()}_${originalname}`;
      const dest = path.join(FILES_DIR, filename);
      const buf = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
      fs.writeFileSync(dest, buf);
      filepath = `/uploads/files/${filename}`;
      filesize = buf.length;
    }
  } catch (err) {
    console.error('File upload error:', err);
    return res.json({ success: false, error: err.message });
  }

  const projectid = parseInt(req.body.projectid || req.query.projectid) || null;
  if (!projectid) return res.json({ success: false, error: 'Save project before uploading files' });
  const info = db.prepare(
    'INSERT INTO files (projectid, name, title, size, file_path) VALUES (?, ?, ?, ?, ?)'
  ).run(projectid, originalname, originalname, filesize, filepath);
  res.json({ success: true, id: info.lastInsertRowid, label: originalname });
});

router.post('/delete', auth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.json({ success: false });
  db.prepare('DELETE FROM files WHERE id=?').run(parseInt(id));
  res.json({ success: true });
});

module.exports = router;
