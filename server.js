/*jslint bitwise: true */
/*global console, process, require */
(function() {
    'use strict';
    var serverPort = 800,
        server = null,
        io = null,
        nSight = 0,
        gameEnd = 0,
        canvasWidth = 300,
        canvasHeight = 200,
        players = [],
        stack = [],
        target = null;

    function Circle(x, y, radius) {
        this.x = (x === undefined) ? 0 : x;
        this.y = (y === undefined) ? 0 : y;
        this.radius = (radius === undefined) ? 0 : radius;
    }
    Circle.prototype = {
        constructor: Circle,
        distance: function(circle) {
            if (circle !== undefined) {
                var dx = this.x - circle.x,
                    dy = this.y - circle.y;
                return (Math.sqrt(dx * dx + dy * dy) - (this.radius + circle.radius));
            }
        }
    };

    function random(max) {
        return ~~(Math.random() * max);
    }

    function act(player) {
        var now = Date.now();
        if (gameEnd - now < -1000) {
            gameEnd = now + 10000;
            io.sockets.emit('gameEnd', {
                time: gameEnd
            });
            target.x = random(canvasWidth / 10 - 1) * 10 + target.radius;
            target.y = random(canvasHeight / 10 - 1) * 10 + target.radius;
            io.sockets.emit('target', {
                x: target.x,
                y: target.y
            });
        } else if (gameEnd - now > 0) {
            if (players[player].distance(target) < 0) {
                io.sockets.emit('score', {
                    id: player,
                    score: 1
                });
                target.x = random(canvasWidth / 10 - 1) * 10 + target.radius;
                target.y = random(canvasHeight / 10 - 1) * 10 + target.radius;
                io.sockets.emit('target', {
                    x: target.x,
                    y: target.y
                });
            }
        }
    }

    function MyServer(request, response) {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        response.end('It\'s working!');
    }
    target = new Circle(100, 100, 10);
    server = require('http').createServer(MyServer);
    server.listen(serverPort, function() {
        console.log('Server is listening on port ' + serverPort);
    });
    io = require('socket.io').listen(server);
    io.sockets.on('connection', function(socket) {
        if (stack.length) {
            socket.player = stack.pop();
        } else {
            socket.player = nSight;
            nSight += 1;
        }
        players[socket.player] = new Circle(0, 0, 5);
        socket.emit('me', {
            id: socket.player
        });
        io.sockets.emit('sight', {
            id: socket.player,
            x: 0,
            y: 0
        });
        console.log(socket.id + ' connected as player' + socket.player);
        socket.on('mySight', function(sight) {
            players[socket.player].x = sight.x;
            players[socket.player].y = sight.y;
            if (sight.lastPress === 1) {
                act(socket.player);
            } //socket.broadcast.volatile.emit('sight', {id: socket.player, x: sight.x, y: sight.y, lastPress: sight.lastPress}); 
            io.sockets.emit('sight', {
                id: socket.player,
                x: sight.x,
                y: sight.y,
                lastPress: sight.lastPress
            });
        });
        socket.on('disconnect', function() {
            io.sockets.emit('sight', {
                id: socket.player,
                x: null,
                y: null
            });
            console.log('Player' + socket.player + ' disconnected.');
            if (io.sockets.clients().length <= 1) {
                stack.length = 0;
                nSight = 0;
                console.log('Sights were reset to zero.');
            } else {
                stack.push(socket.player);
            }
        });
    });
}()); 