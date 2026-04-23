'use strict';
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../db');

router.get('/login', (req, res) => {
  if (req.session.adminUser) return res.redirect('/admin/projects');
  res.render('admin/login', {
    layout: 'admin/layout',
    htmltitle: 'Admin Login – SigmaProjects.org',
    error: req.query.error === '1',
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.redirect('/admin/login?error=1');
  }
  req.session.adminUser = { email: email || 'admin@example.com', name: 'Admin' };
  res.redirect('/admin/projects');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
