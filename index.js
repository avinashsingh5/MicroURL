const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const url = require('./urlModel');
const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');
const he = require('he');
const helmet = require('helmet');
app.use(helmet());



console.log(process.env.Mongo_Uri);

mongoose.connect(process.env.Mongo_Uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));


// Function to generate a unique code
async function generateUniqueCode() {
  let code, exists;
  do {
    code = crypto.randomBytes(4).toString('base64url'); // gives ~6 chars safely
    exists = await url.exists({ code }); // check in MongoDB
  } while (exists);
  return code;
}


// Generate short URL
app.get('/geturl', async (req, res) => {
  let inputUrl = req.query.url;
  if (!inputUrl) {
    return res.status(400).send('Missing URL parameter');
  }

  // validate protocol
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(inputUrl)) {
    if (inputUrl.startsWith('ftp.')) {
      return res.status(400).send('Please include the correct protocol (e.g., ftp://ftp.server.com)');
    }
    inputUrl = `http://${inputUrl}`;
  }

  try {
    new URL(inputUrl);
  } catch {
    return res.status(400).send('Invalid URL format');
  }

  // generate and store in MongoDB
  const code = await generateUniqueCode();
  const newUrl = new url({ code, originalUrl: inputUrl });
  await newUrl.save();

  res.send(`Your short URL: <a href="http://localhost:3000/${code}">http://localhost:3000/${code}</a>`);
});


// Show all URLs
app.get('/showall', async (req, res) => {
  const urls = await url.find();
  const safeOutput = urls.map(u => `${he.encode(u.code)} → ${he.encode(u.originalUrl)}`).join('<br>');
  res.send(safeOutput || 'No URLs stored yet');
});


// Redirect short code to original URL
app.get('/:code', async (req, res) => {
  const found = await url.findOne({ code: req.params.code });
  if (found) res.redirect(found.originalUrl);
  else res.send('Invalid URL');
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
