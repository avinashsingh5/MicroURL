const express = require('express');
const app = express();

const http = require('http');

const server = http.createServer(app);



const urlStore = {};

app.get('/geturl',(req,res)=>{
    const url = req.query.url;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    urlStore[code] = url;
    res.send(`Your shortUrl: http://localhost:3000/${code}`);
    

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