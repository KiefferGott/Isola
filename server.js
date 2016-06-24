var http    = require('http');
var url     = require('url');
var fs      = require('fs');

var server = http.createServer(function(req, res) {
    var page = url.parse(req.url).pathname;
    if (page === '/') {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(fs.readFileSync('views/index.html'));
        res.end();
    }
    else if (/\/public\//.test(page)) {
        try {
            res.write(fs.readFileSync('.' + page));
            res.end();
        } catch(e) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write('Bonsoir.');
            res.end();
            console.log(e);
        }
    }
});

var io = require('socket.io').listen(server);
var red = true;
var blue = true;
var player = {red: null, blue: null};
var turn;
io.sockets.on('connection', function (socket) {
    var side = red ? 'Red' : blue ? 'Blue' : false;
    socket.side = side;
    if (side === 'Red') {
        player.red = socket.id;
        red = false;
        socket.emit('player');
    }
    else if (side === 'Blue') {
        player.blue = socket.id;
        blue = false;
        socket.emit('player');
    }
    socket.emit('side', side);
    if (!red && !blue) {
        turn = 'Red';
        io.sockets.connected[player.red].emit('yourTurn');
    }
    socket.on('play', function (data) {
        data.id = socket.side;
        socket.broadcast.emit('playerMoved', data);
        socket.on('cellDelete', function (data) {
            socket.broadcast.emit('cellDeleted', data);
            if (socket.side === 'Red') {
                io.sockets.connected[player.blue].emit('yourTurn');
            }
            else {
                io.sockets.connected[player.red].emit('yourTurn');
            }
        })
    });
    socket.on('disconnect', function() {
        if (socket.side === 'Red') {
            red = true;
        }
        else if (socket.side === 'Blue') {
            blue = true;
        }
        if (socket.side) {
            socket.broadcast.emit('message', socket.side + ' side has left.')
        }
    });
});

server.listen(8080);