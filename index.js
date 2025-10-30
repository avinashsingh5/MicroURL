const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const url = require('./src/urlModel');
const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');
const he = require('he');
const helmet = require('helmet');
app.use(helmet());


const path = require('path');
const cors = require('cors');
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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
app.get('/api/geturl', async (req, res) => {
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

  // generate and store in MongoDB and sendto frontend
  try{
    const code = await generateUniqueCode();
    const newUrl = new url({code, originalUrl: inputUrl});
    await newUrl.save();

    //send json 
    const host = req.get('host');
    res.json({shortUrl: `http://${host}/${code}`,code: `${code}`});
  }catch(err){
    console.error(err);
    res.status(500).json('Server error');
  }
});


// Show all URLs
app.get('/api/showall', async (req, res) => {
  try{
    const urls = await url.find({});
    res.json(urls);
  }catch(err){
    res.status(500).json({error: 'Server error'});
  }
});


// Redirect short code to original URL
app.get('/:code', async (req, res) => {
  const found = await url.findOne({ code: req.params.code });
  if (found) res.redirect(found.originalUrl);
  else res.send('Invalid URL');
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
