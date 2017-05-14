var http = require('http');
var httpProxy = require('http-proxy');
var request = require('request');

var PORT = process.env.PORT || 8000;

/**
 *
 * Configure servers here
 *
 */
var servers = [
    {host: 'localhost', port: 8001},
    {host: 'localhost', port: 8002}
];


/**
	DO NOT TOUCH ANYWHERE UNDER HERE
*/


var proxies = servers.map(function (server) {
    return new httpProxy.createProxyServer({
        target: server,
        ws: true,
        xfwd: true
    });
});

var selectProxyServer = function(req, res) {

    var index = -1;

    if (req.headers && req.headers.cookie && req.headers.cookie.length > 1) {
        var cookies = req.headers.cookie.split('; ');

        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].indexOf('server=') === 0) {
                var value = cookies[i].substring(7, cookies[i].length);
                if (value && value !== '') {
                    index = value;
                    break;
                }
            }
        }
    }

    if (index < 0 || !proxies[index]) {
        index = Math.floor(Math.random() * proxies.length);
    }

    if (proxies[index].options.down) {
        index = -1;

        var tries = 0;

        while (tries < 5 && index < 0) {
            var randomIndex = Math.floor(Math.random() * proxies.length);
            if (!proxies[randomIndex].options.down) {
                index = randomIndex;
            }

            tries++;
        }
    }

    index = (index >= 0) ? index : 0;

    if (res) {
        res.setHeader('Set-Cookie', 'server=' + index + '; path=/')
    }

    return index;
};

var failoverTimer = [];

var proxyFailCallback = function(index) {
    if (failoverTimer[index]) {
        return;
    }

    failoverTimer[index] = setTimeout(function() {
        request({
            url: 'http://' + proxies[index].options.target.host + ':' + proxies[index].options.target.port,
            method: 'HEAD',
            timeout: 10000
        }, function(err, res, body) {
            failoverTimer[index] = null;

            if (res && res.statusCode === 200) {
                proxies[index].options.down = false;
                console.log('Server ' + index + ' back up.');
            } else {
                proxies[index].options.down = true;
                proxyFailCallback(index);
                console.log('Server ' + index + ' is down.');
            }
        })
    }, 10000);
};

var server = http.createServer(function (req, res) {
    var proxyIndex = selectProxyServer(req, res);
    var proxy = proxies[proxyIndex];

    proxy.web(req, res);

    proxy.on('error', function (err) {
        console.log('Proxy error!');
        proxyFailCallback(proxyIndex);
    });
});

server.listen(PORT);

server.on('listening', function () {
    console.log(`LoadBalancer started at port ${PORT}.`);
});

server.on('error', function (err) {
    console.log(err);
    process.exit(1);
});

server.on('upgrade', (req, socket, head) => {
    var proxyIndex = selectProxyServer(req);
    var proxy = proxies[proxyIndex];

    proxy.ws(req, socket, head);

    proxy.on('error', function(err, req, socket) {
        socket.end();
        proxyFailCallback(proxyIndex);
    });
});