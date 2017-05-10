var http = require('http');
var ws = require('ws');
var express = require('express');

var PORT = process.env.PORT || 8000;

var app = express();

app.use(express.static('client/dist'));

app.use(function (req, res) {
  res.status(404).json({
    url: req.originalUrl,
    error: 'Not found.'
  });
});

var server = http.createServer(app);

var wss = new ws.Server({ server });

wss.on('connection', function (ws) {

});

server.listen(PORT);
server.on('listening', function () {
  console.log(`App Server started at port ${PORT}.`);
});
server.on('error', function (err) {
  console.log(err);
  process.exit(1);
});

