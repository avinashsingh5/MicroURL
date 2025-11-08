const express = require('express');
const router = express.Router();
const Url = require('../models/Url');

// Redirect to original URL
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const urlDoc = await Url.findOne({ slug });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check if expired
    if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
      return res.status(410).json({ error: 'This link has expired' });
    }

   
    urlDoc.clicks += 1;
    await urlDoc.save();

    // Redirect to original URL
    res.redirect(urlDoc.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

