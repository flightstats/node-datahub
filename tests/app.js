import express from 'express';
// import bodyParser from 'body-parser';

const app = module.exports = express();


app.get('/', function(req, res) {
  res.send("ok", {'Content-Type': 'text/html'}, 200);
});
 
// Only start listening on 8080 when this file is run directly i.e.: node app.js 
if (!module.parent) {
  app.listen(8080);
}
