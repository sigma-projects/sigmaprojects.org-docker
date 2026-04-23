'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/contact', (req, res) => {
  res.render('contact/index', {
    htmltitle: 'Contact Us – SigmaProjects.org',
    success: req.query.success === '1',
    error: req.query.error === '1',
  });
});

router.post('/contact', (req, res) => {
  const { subject, name, email, company, message } = req.body;
  if (!name || !email || !message) return res.redirect('/contact?error=1');
  db.prepare(
    'INSERT INTO contact (subject, name, email, company, message) VALUES (?, ?, ?, ?, ?)'
  ).run(subject || '', name, email, company || '', message);
  res.redirect('/contact?success=1');
});

module.exports = router;
