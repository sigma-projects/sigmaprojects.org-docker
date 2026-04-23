'use strict';
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 8384;
app.listen(PORT, () => {
  console.log(`SigmaProjects.org running on http://localhost:${PORT}`);
});
