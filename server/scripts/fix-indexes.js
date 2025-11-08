/**
 * Script to fix MongoDB indexes
 * Run this once to clean up old indexes: node server/scripts/fix-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('urls');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop old 'code' index if it exists
    try {
      await collection.dropIndex('code_1');
      console.log('✅ Dropped old code_1 index');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  code_1 index does not exist (that\'s okay)');
      } else {
        console.error('❌ Error dropping code_1 index:', err.message);
      }
    }

    // Check for documents with null or missing slugs
    const documentsWithNullSlug = await collection.countDocuments({ 
      $or: [{ slug: null }, { slug: { $exists: false } }] 
    });
    
    if (documentsWithNullSlug > 0) {
      console.log(`⚠️  Found ${documentsWithNullSlug} documents with null/missing slugs`);
      console.log('   Deleting documents with invalid slugs...');
      
      const deleteResult = await collection.deleteMany({ 
        $or: [{ slug: null }, { slug: { $exists: false } }] 
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} invalid documents`);
    }

    // Drop existing slug index if it exists (to recreate it cleanly)
    try {
      await collection.dropIndex('slug_1');
      console.log('✅ Dropped existing slug_1 index (will recreate)');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  slug_1 index does not exist (will create)');
      } else {
        console.log('ℹ️  Could not drop slug_1 index:', err.message);
      }
    }

    // Create slug index
    try {
      await collection.createIndex({ slug: 1 }, { unique: true, sparse: false });
      console.log('✅ Created slug_1 index');
    } catch (err) {
      console.error('❌ Error creating slug index:', err.message);
      console.log('   This might mean there are duplicate slugs. Please check your data.');
    }

    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n✅ Final indexes:', finalIndexes.map(idx => idx.name));

    console.log('\n✅ Index cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

fixIndexes();

