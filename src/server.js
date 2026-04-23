'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ensure necessary upload directories exist (essential for Docker volume mounts)
const uploadDirs = ['thumbnails', 'gallery', 'files'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const app = require('./app');

const PORT = process.env.PORT || 8384;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SigmaProjects.org running on http://0.0.0.0:${PORT}`);
});
