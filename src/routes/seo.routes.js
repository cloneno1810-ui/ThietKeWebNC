const router = require('express').Router();
const { appOrigin } = require('../config/security');
function origin() {
  return appOrigin;
}
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /$\nDisallow: /api/\nDisallow: /guest/\nDisallow: /manager/\nDisallow: /receptionist/\nDisallow: /admin/\nDisallow: /login.html\nDisallow: /storage/\nSitemap: ${origin()}/sitemap.xml\n`);
});
router.get('/sitemap.xml', (req, res) => {
  const url = origin().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc></url></urlset>`);
});
module.exports = router;
