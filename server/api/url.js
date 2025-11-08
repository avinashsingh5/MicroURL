const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
require('dotenv').config();
const OpenAI = require('openai');
const QRCode = require('qrcode');
const Url = require('../models/Url');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { qrCodeUserRateLimiter, qrCodeIPRateLimiter } = require('../middleware/rateLimiter');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ AI Slug Generator
async function generateAISlug(originalUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate a short, memorable, and relevant slug (3–8 characters, alphanumeric only, no spaces or special characters) for this URL: ${originalUrl}. Return only the slug, nothing else.`;

    const result = await model.generateContent(prompt);
    let aiSlug = result.response.text().trim();

    // Clean slug: keep only alphanumeric
    aiSlug = aiSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // Ensure slug is 3–8 chars long
    if (aiSlug.length < 3) {
      aiSlug = aiSlug + nanoid(3 - aiSlug.length);
    } else if (aiSlug.length > 8) {
      aiSlug = aiSlug.substring(0, 8);
    }

    return aiSlug;
  } catch (error) {
    console.error('Gemini API error:', error);
    return nanoid(6); 
  }
}


function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Create short URL (optional auth - works for both logged in and anonymous users)
router.post('/shorten', optionalAuth, async (req, res) => {
  try {
    const { url, customSlug, useAISlug, expirationHours, expirationDays } = req.body;

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    let slug;
    
    // Determine slug
    if (customSlug && customSlug.trim()) {
      // Use custom slug (case-sensitive)
      slug = customSlug.trim();
      
      // Check if slug already exists
      const existing = await Url.findOne({ slug });
      if (existing) {
        return res.status(409).json({ error: 'Slug already exists. Please choose a different one.' });
      }
    } else if (useAISlug) {
      // Generate AI slug
      slug = await generateAISlug(url);
      
      // Ensure uniqueness
      let attempts = 0;
      while (await Url.findOne({ slug }) && attempts < 5) {
        slug = await generateAISlug(url);
        attempts++;
      }
      
      // Final fallback if still not unique
      if (await Url.findOne({ slug })) {
        slug = nanoid(8);
      }
    } else {
      // Generate random slug
      slug = nanoid(8);
      
      // Ensure uniqueness
      while (await Url.findOne({ slug })) {
        slug = nanoid(8);
      }
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expirationHours || expirationDays) {
      const hours = (expirationDays || 0) * 24 + (expirationHours || 0);
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Create URL document
    const urlDoc = new Url({
      originalUrl: url,
      slug,
      expiresAt,
      user: req.user ? req.user._id : null, // Associate with user if logged in
    });

    try {
      await urlDoc.save();
    } catch (saveError) {
      // Handle duplicate key errors more gracefully
      if (saveError.code === 11000) {
        // Check if it's the slug that's duplicate
        if (saveError.keyPattern && saveError.keyPattern.slug) {
          return res.status(409).json({ error: 'Slug already exists. Please try again or choose a different slug.' });
        }
        // Handle old 'code' index error
        if (saveError.keyPattern && saveError.keyPattern.code) {
          console.error('Old code index detected. Please run: node server/scripts/fix-indexes.js');
          return res.status(500).json({ 
            error: 'Database configuration error. Please contact support or run index fix script.' 
          });
        }
      }
      throw saveError;
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${slug}`;

    res.json({
      success: true,
      shortUrl,
      slug,
      originalUrl: url,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics (requires authentication - only for user's own URLs)
router.get('/analytics/:slug', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find URL and ensure it belongs to the authenticated user
    const urlDoc = await Url.findOne({ slug, user: req.user._id });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found or access denied. You can only view analytics for URLs you created while logged in.' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.json({
      slug: urlDoc.slug,
      originalUrl: urlDoc.originalUrl,
      shortUrl: `${baseUrl}/${urlDoc.slug}`,
      clicks: urlDoc.clicks,
      createdAt: urlDoc.createdAt,
      expiresAt: urlDoc.expiresAt,
      isExpired: urlDoc.expiresAt ? new Date() > urlDoc.expiresAt : false,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's links (requires authentication)
router.get('/my-links', authenticate, async (req, res) => {
  try {
    const links = await Url.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    const linksWithShortUrl = links.map(link => ({
      ...link.toObject(),
      shortUrl: `${baseUrl}/${link.slug}`,
      isExpired: link.expiresAt ? new Date() > link.expiresAt : false,
    }));

    res.json({
      success: true,
      count: links.length,
      links: linksWithShortUrl,
    });
  } catch (error) {
    console.error('Error fetching user links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics for user's specific link (requires authentication)
router.get('/my-links/:slug/analytics', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const urlDoc = await Url.findOne({ slug, user: req.user._id });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found or access denied' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.json({
      slug: urlDoc.slug,
      originalUrl: urlDoc.originalUrl,
      shortUrl: `${baseUrl}/${urlDoc.slug}`,
      clicks: urlDoc.clicks,
      createdAt: urlDoc.createdAt,
      expiresAt: urlDoc.expiresAt,
      isExpired: urlDoc.expiresAt ? new Date() > urlDoc.expiresAt : false,
    });
  } catch (error) {
    console.error('Error fetching link analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate QR code for a link (requires authentication, rate limited)
router.get('/my-links/:slug/qrcode', authenticate, qrCodeIPRateLimiter, qrCodeUserRateLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Verify the link belongs to the user
    const urlDoc = await Url.findOne({ slug, user: req.user._id });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found or access denied' });
    }

    // Check if expired
    if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
      return res.status(410).json({ error: 'This link has expired' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${slug}`;

    // Generate QR code as data URL
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.json({
        success: true,
        qrCode: qrCodeDataUrl,
        shortUrl: shortUrl,
      });
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate QR code for analytics endpoint (requires authentication, rate limited)
router.get('/analytics/:slug/qrcode', authenticate, qrCodeIPRateLimiter, qrCodeUserRateLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Verify the link belongs to the user
    const urlDoc = await Url.findOne({ slug, user: req.user._id });
    
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found or access denied' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${slug}`;

    // Generate QR code as data URL
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.json({
        success: true,
        qrCode: qrCodeDataUrl,
        shortUrl: shortUrl,
      });
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

