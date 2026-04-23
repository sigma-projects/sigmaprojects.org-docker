'use strict';
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('main/index', { htmltitle: 'SigmaProjects.org' });
});

router.get('/whoweare', (req, res) => {
  res.render('main/whoweare', { htmltitle: 'Who We Are – SigmaProjects.org' });
});

router.get('/privacy', (req, res) => {
  res.render('main/privacy', { htmltitle: 'Privacy Policy – SigmaProjects.org' });
});

module.exports = router;
