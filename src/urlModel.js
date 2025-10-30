const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  originalUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('url', urlSchema);
