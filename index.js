const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);


const crypto = require('crypto');

function generateUniqueCode() {
    let code;
    do {
      code = crypto.randomBytes(4).toString('base64url'); // gives ~6 chars safely
    } while (urlStore[code]);
    return code;
  }


const urlStore = {};

app.get('/geturl',(req,res)=>{
    let url = req.query.url;
    if (!url) {
        return res.status(400).send('Missing URL parameter');
      }


      if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
        if (url.startsWith('ftp.')) {
          return res.status(400).send('Please include the correct protocol (e.g., ftp://ftp.server.com)');
        }
        // default to http if no protocol
        url = `http://${url}`;
      }

    
    try {
        new URL(url);
      } catch {
        return res.status(400).send('Invalid URL format');
      }

    
    const code = generateUniqueCode();
    urlStore[code] = url;
    res.send(`Your short URL: <a href="http://localhost:3000/${code}">http://localhost:3000/${code}</a>`);
    

});

app.get('/showall', (req, res) => {
    let output = '';
    for (let key in urlStore) {
      output += `${key} → ${urlStore[key]}<br>`;
    }
    res.send(output || 'No URLs stored yet');
  });


app.get('/:code',(req,res)=>{
    if(urlStore.hasOwnProperty(req.params.code)){
        res.redirect(urlStore[req.params.code]);
    }
    else{
        res.send('Invalid URL');
    }
});




  

server.listen(3000, ()=>{
    console.log('server is running on port 3000');
})