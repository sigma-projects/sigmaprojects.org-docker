'use strict';
module.exports = (req, res, next) => {
  if (!req.session.adminUser) return res.redirect('/admin/login');
  next();
};
