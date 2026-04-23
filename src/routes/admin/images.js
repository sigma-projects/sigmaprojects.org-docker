'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const db = require('../../db');
const auth = require('../../middleware/auth');

const GALLERY_DIR = path.join(__dirname, '../../../uploads/gallery');
const upload = multer({ storage: multer.memoryStorage() });

// Fine Uploader sends via XHR (application/octet-stream, filename in ?qqfile=)
// or via iframe fallback (multipart/form-data, field named qqfile).
// Multer only handles multipart — detect and handle both.
router.post('/upload', auth, async (req, res) => {
  let buf, originalname;
  const contentType = req.headers['content-type'] || '';

  try {
    if (contentType.includes('multipart') && contentType.includes('boundary=')) {
      // iframe fallback path — run multer manually
      await new Promise((resolve, reject) =>
        upload.single('qqfile')(req, res, err => err ? reject(err) : resolve())
      );
      if (!req.file) return res.json({ success: false, error: 'No file received' });
      buf = req.file.buffer;
      originalname = req.file.originalname;
    } else {
      // XHR path — raw binary body, filename in X-File-Name header (URL-encoded)
      const rawName = req.headers['x-file-name'] || req.query.qqfile || 'upload.jpg';
      originalname = decodeURIComponent(rawName);
      buf = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    if (!buf || buf.length === 0) return res.json({ success: false, error: 'No file received' });
  } catch (err) {
    console.error('Image upload read error:', err);
    return res.json({ success: false, error: err.message });
  }

  const projectid = parseInt(req.body.projectid || req.query.projectid) || null;

  try {
    const sizes = [
      { key: 'small',       w: 100,  h: 100,  fit: 'cover' },
      { key: 'medium',      w: 250,  h: 250,  fit: 'cover' },
      { key: 'medium_wide', w: 954,  h: 533,  fit: 'cover' },
      { key: 'large',       w: 450,  h: 450,  fit: 'cover' },
    ];

    if (!projectid) return res.json({ success: false, error: 'Missing projectid' });

    // Insert row first to get the real ID
    const info = db.prepare(`INSERT INTO gallery (projectid, name, sort_order) VALUES (?, ?, 9999)`)
      .run(projectid, originalname);
    const galleryId = info.lastInsertRowid;

    const paths = {};
    for (const sz of sizes) {
      const fname = `${galleryId}_${sz.key}.jpg`;
      await sharp(buf)
        .resize(sz.w, sz.h, { fit: sz.fit })
        .jpeg({ quality: 85 })
        .toFile(path.join(GALLERY_DIR, fname));
      paths[sz.key] = `/uploads/gallery/${fname}`;
    }
    // Save original
    const origFname = `${galleryId}_original.jpg`;
    await sharp(buf).jpeg({ quality: 90 }).toFile(path.join(GALLERY_DIR, origFname));
    paths.original = `/uploads/gallery/${origFname}`;

    const meta = await sharp(buf).metadata();

    db.prepare(`UPDATE gallery SET
      img_path=?, thumb_small_path=?, thumb_medium_path=?,
      thumb_medium_wide_path=?, thumb_large_path=?,
      width=?, height=?, name=?
      WHERE id=?`).run(
      paths.original, paths.small, paths.medium,
      paths.medium_wide, paths.large,
      meta.width || 0, meta.height || 0, originalname,
      galleryId
    );

    res.json({ success: true, id: galleryId });
  } catch (err) {
    console.error('Image upload error:', err);
    res.json({ success: false, error: err.message });
  }
});

// Delete a gallery image
router.post('/delete', auth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.json({ success: false });
  // Optionally delete files from disk here
  db.prepare('DELETE FROM gallery WHERE id=?').run(parseInt(id));
  res.json({ success: true });
});

// Serve gallery image by size
router.get('/serve/:size/:id', (req, res) => {
  const { size, id } = req.params;
  const row = db.prepare('SELECT * FROM gallery WHERE id=?').get(parseInt(id));
  if (!row) return res.status(404).send('Not found');
  const sizeMap = {
    small: 'thumb_small_path',
    medium: 'thumb_medium_path',
    medium_wide: 'thumb_medium_wide_path',
    large: 'thumb_large_path',
    original: 'img_path',
  };
  const col = sizeMap[size] || 'thumb_medium_wide_path';
  const filePath = path.join(__dirname, '../../../', row[col]);
  res.sendFile(filePath);
});

module.exports = router;
