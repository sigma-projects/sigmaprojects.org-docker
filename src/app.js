'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');

const app = express();

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// --- Static files ---
app.use(express.static(path.join(__dirname, '../public')));
// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Body parsers ---
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// --- Sessions ---
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, '../data') }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// --- Pass session user to all views ---
app.use((req, res, next) => {
  res.locals.adminUser = req.session.adminUser || null;
  next();
});

// --- Image serving routes (match original URL patterns) ---
// Compatibility alias for old /index.cfm/image/... paths used in editproject.js
app.get('/index.cfm/image/:size/:id', (req, res) => {
  res.redirect(`/image/${req.params.size}/${req.params.id}`);
});

const db = require('./db');
app.get('/image/:size/:id', (req, res) => {
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
  res.sendFile(path.join(__dirname, '../', row[col]));
});

app.get('/projectthumb/:id', (req, res) => {
  const row = db.prepare('SELECT thumbnail_path FROM projects WHERE projectid=?').get(parseInt(req.params.id));
  if (!row || !row.thumbnail_path) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, '../', row.thumbnail_path));
});

// --- Routes ---
app.use('/', require('./routes/main'));
app.use('/', require('./routes/projects'));
app.use('/', require('./routes/contact'));

// Admin
app.use('/admin', require('./routes/admin/index'));
app.use('/admin/projects', require('./routes/admin/projects'));
app.use('/admin/images', require('./routes/admin/images'));
app.use('/admin/files', require('./routes/admin/files'));

// /admin root redirect
app.get('/admin', (req, res) => res.redirect('/admin/projects'));

// 404
app.use((req, res) => {
  res.status(404).render('main/404', { htmltitle: '404 – SigmaProjects.org' });
});

module.exports = app;
