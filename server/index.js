const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('MongoDB connected');
  
  // Clean up old indexes and invalid documents on startup
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('urls');
    
    // Check and drop old 'code' index if it exists
    const indexes = await collection.indexes();
    const codeIndex = indexes.find(idx => idx.name === 'code_1');
    
    if (codeIndex) {
      console.log('Found old code_1 index, dropping it...');
      try {
        await collection.dropIndex('code_1');
        console.log('✅ Successfully dropped old code_1 index');
      } catch (err) {
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
          console.error('Warning: Could not drop old index:', err.message);
        }
      }
    }
    
    // Clean up documents with null/missing slugs
    const invalidDocs = await collection.countDocuments({ 
      $or: [{ slug: null }, { slug: { $exists: false } }] 
    });
    
    if (invalidDocs > 0) {
      console.log(`⚠️  Found ${invalidDocs} documents with invalid slugs, cleaning up...`);
      const deleteResult = await collection.deleteMany({ 
        $or: [{ slug: null }, { slug: { $exists: false } }] 
      });
      console.log(`✅ Cleaned up ${deleteResult.deletedCount} invalid documents`);
    }
  } catch (err) {
    // Collection might not exist yet, that's okay
    if (err.codeName !== 'NamespaceNotFound') {
      console.log('Index cleanup skipped:', err.message);
    }
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Health check (must be before redirect route)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', require('./api/auth'));
app.use('/api', require('./api/url'));

// Redirect route (must be after API routes to avoid conflicts)
app.use('/', require('./api/redirect'));




// For serverless deployment (Vercel/Netlify)
if (process.env.VERCEL || process.env.NETLIFY) {
  module.exports = app;
} else {
  // Local development
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    

  });
}



