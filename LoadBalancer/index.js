var http = require('http');
var httpProxy = require('http-proxy');

var PORT = process.env.PORT || 8000;

var servers = [
    {host: 'localhost', port: 8001},
    {host: 'localhost', port: 8002}
];

var proxies = servers.map(function (server) {
    return new httpProxy.createProxyServer({
        target: server,
        ws: true,
        xfwd: true
    });
});

var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function (req, res) {
    var proxy = proxies.shift();
    proxy.web(req, res);

    proxy.on('error', function (err) {
        console.log('Proxy error!');
        console.log(err);
    });

    proxies.push(proxy);
});

server.listen(PORT);

server.on('listening', function () {
    console.log(`LoadBalancer started at port ${PORT}.`);
});

server.on('error', function (err) {
    console.log(err);
    process.exit(1);
})