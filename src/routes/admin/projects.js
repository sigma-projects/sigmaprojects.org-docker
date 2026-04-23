'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../../db');
const auth = require('../../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const thumbnailsDir = path.join(UPLOADS_DIR, 'thumbnails');
const galleryDir = path.join(UPLOADS_DIR, 'gallery');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// List all projects
router.get('/', auth, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created DESC').all();
  projects.forEach(p => {
    p.imageCount = db.prepare('SELECT COUNT(*) as c FROM gallery WHERE projectid=?').get(p.projectid).c;
    p.fileCount = db.prepare('SELECT COUNT(*) as c FROM files WHERE projectid=?').get(p.projectid).c;
    p.updateCount = db.prepare('SELECT COUNT(*) as c FROM project_updates WHERE projectid=?').get(p.projectid).c;
  });
  res.render('admin/projects/index', {
    layout: 'admin/layout',
    htmltitle: 'Projects – Admin',
    projects,
  });
});

// Edit/New project form
router.get('/edit', auth, (req, res) => {
  const id = req.query.projectid ? parseInt(req.query.projectid) : null;
  let project = null;
  let gallery = [];
  let files = [];
  let updates = [];
  if (id) {
    project = db.prepare('SELECT * FROM projects WHERE projectid=?').get(id);
    gallery = db.prepare('SELECT * FROM gallery WHERE projectid=? ORDER BY sort_order ASC, id ASC').all(id);
    files = db.prepare('SELECT * FROM files WHERE projectid=? ORDER BY id ASC').all(id);
    updates = db.prepare('SELECT * FROM project_updates WHERE projectid=? ORDER BY created DESC').all(id);
  }
  res.render('admin/projects/edit', {
    layout: 'admin/layout',
    htmltitle: project ? `Edit: ${project.title}` : 'New Project',
    project,
    gallery,
    files,
    updates,
    saved: req.query.saved === '1',
  });
});

// Save (create or update) project
router.post('/save', auth, upload.single('thumbnail'), async (req, res) => {
  const {
    projectid, title, description, longdescription, public: isPublic,
    type, subtype, web_url, git_url, imageids, fileids, delete_project,
  } = req.body;

  const id = projectid ? parseInt(projectid) : null;

  if (delete_project === 'on' && id) {
    db.prepare('DELETE FROM projects WHERE projectid=?').run(id);
    return res.redirect('/admin/projects');
  }

  let ses_title = req.body.ses_title;
  if (!ses_title) {
    ses_title = title.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  // Ensure unique slug when creating
  if (!id) {
    let candidate = ses_title;
    let n = 2;
    while (db.prepare('SELECT projectid FROM projects WHERE ses_title=?').get(candidate)) {
      candidate = `${ses_title}-${n++}`;
    }
    ses_title = candidate;
  }

  let thumbnail_path = id
    ? (db.prepare('SELECT thumbnail_path FROM projects WHERE projectid=?').get(id) || {}).thumbnail_path || ''
    : '';

  if (req.file) {
    const fname = `${ses_title}.jpg`;
    const dest = path.join(thumbnailsDir, fname);
    await sharp(req.file.buffer)
      .resize(600, 338, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(dest);
    thumbnail_path = `/uploads/thumbnails/${fname}`;
  }

  if (id) {
    db.prepare(`UPDATE projects SET title=?, ses_title=?, description=?, longdescription=?,
      public=?, type=?, subtype=?, thumbnail_path=?, web_url=?, git_url=?,
      updated=datetime('now') WHERE projectid=?`).run(
      title, ses_title, description || '', longdescription || '',
      isPublic === '1' ? 1 : 0, type || 'product', subtype || '',
      thumbnail_path, web_url || '', git_url || '', id
    );
  } else {
    const info = db.prepare(`INSERT INTO projects
      (title, ses_title, description, longdescription, public, type, subtype, thumbnail_path, web_url, git_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      title, ses_title, description || '', longdescription || '',
      isPublic === '1' ? 1 : 0, type || 'product', subtype || '',
      thumbnail_path, web_url || '', git_url || ''
    );
    // redirect to edit so image/file uploads can be done after
    return res.redirect(`/admin/projects/edit?projectid=${info.lastInsertRowid}&saved=1`);
  }

  // Update gallery sort order from imageids
  if (imageids) {
    const ids = imageids.split(',').map(s => s.trim()).filter(Boolean);
    ids.forEach((gid, idx) => {
      db.prepare('UPDATE gallery SET sort_order=? WHERE id=?').run(idx, parseInt(gid));
    });
  }

  res.redirect(`/admin/projects/edit?projectid=${id}&saved=1`);
});

// Delete a project update
router.post('/updates/delete', auth, (req, res) => {
  const { id } = req.body;
  const row = db.prepare('SELECT projectid FROM project_updates WHERE id=?').get(parseInt(id));
  db.prepare('DELETE FROM project_updates WHERE id=?').run(parseInt(id));
  const projectid = row ? row.projectid : null;
  if (projectid) return res.redirect(`/admin/projects/edit?projectid=${projectid}`);
  res.redirect('/admin/projects');
});

// Save a project update
router.post('/updates/save', auth, (req, res) => {
  const { projectid, title, description } = req.body;
  db.prepare('INSERT INTO project_updates (projectid, title, description) VALUES (?, ?, ?)').run(
    parseInt(projectid), title || '', description || ''
  );
  res.redirect(`/admin/projects/edit?projectid=${projectid}`);
});

module.exports = router;
