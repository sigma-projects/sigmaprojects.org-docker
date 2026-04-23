'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /projects/search/:q?  or  /projects/search/
router.get('/projects/search/:q?', (req, res) => {
  const q = req.params.q || '';
  let projects;
  if (q) {
    projects = db.prepare(
      'SELECT * FROM projects WHERE public=1 AND type=? ORDER BY created DESC'
    ).all(q);
  } else {
    projects = db.prepare(
      'SELECT * FROM projects WHERE public=1 ORDER BY created DESC'
    ).all();
  }

  // Collect unique subtypes
  let allProjects;
  if (q) {
    allProjects = db.prepare('SELECT subtype FROM projects WHERE public=1 AND type=?').all(q);
  } else {
    allProjects = db.prepare('SELECT subtype FROM projects WHERE public=1').all();
  }
  const subtypeSet = new Set();
  allProjects.forEach(p => {
    if (p.subtype) p.subtype.split(',').forEach(s => subtypeSet.add(s.trim()));
  });
  const subtypes = [...subtypeSet].filter(Boolean);

  res.render('projects/search', {
    htmltitle: 'Design Solutions – SigmaProjects.org',
    projects,
    subtypes,
    q,
  });
});

// Short URL  /p/:slug
router.get('/p/:slug', (req, res) => _renderProject(req, res));

// Long URL  /projects/view/:slug
router.get('/projects/view/:slug', (req, res) => _renderProject(req, res));

function _renderProject(req, res) {
  const slug = req.params.slug;
  const project = db.prepare(
    'SELECT * FROM projects WHERE ses_title=? AND public=1'
  ).get(slug);
  if (!project) return res.status(404).render('main/404', { htmltitle: '404 – SigmaProjects.org' });

  const gallery = db.prepare(
    'SELECT * FROM gallery WHERE projectid=? ORDER BY sort_order ASC, id ASC'
  ).all(project.projectid);

  const files = db.prepare(
    'SELECT * FROM files WHERE projectid=? ORDER BY id ASC'
  ).all(project.projectid);

  const updates = db.prepare(
    'SELECT * FROM project_updates WHERE projectid=? ORDER BY created DESC'
  ).all(project.projectid);

  res.render('projects/view', {
    htmltitle: `${project.title} – SigmaProjects.org`,
    project,
    gallery,
    files,
    updates,
  });
}

module.exports = router;
