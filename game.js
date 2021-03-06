/*jslint es5: true */
/*global io */
(function(window, undefined) {
    'use strict';
    var socket = io.connect('http://localhost:800'),
        canvas = null,
        ctx = null,
        mousex = 0,
        mousey = 0,
        gameEnd = 0,
        me = 0,
        players = [],
        colors = ['#0f0', '#00f', '#ff0', '#f00'],
        target = null,
        spritesheet = new Image();

    function Circle(x, y, radius) {
        this.x = (x === undefined) ? 0 : x;
        this.y = (y === undefined) ? 0 : y;
        this.radius = (radius === undefined) ? 0 : radius;
        this.score = 0;
    }
    Circle.prototype = {
        constructor: Circle,
        stroke: function(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
            ctx.stroke();
        },
        drawImageArea: function(ctx, img, sx, sy, sw, sh) {
            if (img.width) {
                ctx.drawImage(img, sx, sy, sw, sh, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            } else {
                this.stroke(ctx);
            }
        }
    };

    function enableSockets() {
        socket.on('me', function(sight) {
            me = sight.id;
        });
        socket.on('sight', function(sight) {
            if (sight.lastPress === 1) {
                canvas.style.background = '#333';
            }
            if (sight.x === null && sight.y === null) {
                players[sight.id] = null;
            } else if (!players[sight.id]) {
                players[sight.id] = new Circle(sight.x, sight.y, 5);
            } else {
                players[sight.id].x = sight.x;
                players[sight.id].y = sight.y;
            }
        });
        socket.on('gameEnd', function(end) {
            var i = 0,
                l = 0; //gameEnd = end.time; 
            gameEnd = Date.now() + 10000;
            for (i = 0, l = players.length; i < l; i += 1) {
                if (players[i] !== null) {
                    players[i].score = 0;
                }
            }
            if (window.console) {
                window.console.log('Diff: ' + (gameEnd - end.time) / 1000);
            }
        });
        socket.on('score', function(sight) {
            players[sight.id].score += sight.score;
        });
        socket.on('target', function(t) {
            target.x = t.x;
            target.y = t.y;
        });
    }

    function emitSight(x, y, lastPress) {
        if (x < 0) {
            x = 0;
        }
        if (x > canvas.width) {
            x = canvas.width;
        }
        if (y < 0) {
            y = 0;
        }
        if (y > canvas.height) {
            y = canvas.height;
        }
        socket.emit('mySight', {
            x: x,
            y: y,
            lastPress: lastPress
        });
    }

    function enableInputs() {
        document.addEventListener('mousemove', function(evt) {
            mousex = evt.pageX - canvas.offsetLeft;
            mousey = evt.pageY - canvas.offsetTop;
            emitSight(mousex, mousey, 0);
        }, false);
        canvas.addEventListener('mousedown', function(evt) { //lastPress = evt.which; 
            emitSight(mousex, mousey, evt.which);
        }, false);
    }

    function paint(ctx) {
        var counter = 0,
            i = 0,
            l = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#f00';
        target.drawImageArea(ctx, spritesheet, 0, 0, 20, 20);
        ctx.strokeStyle = '#0f0';
        for (i = 0, l = players.length; i < l; i += 1) {
            if (players[i] !== null) {
                players[i].drawImageArea(ctx, spritesheet, 10 * (i % 4), 20, 10, 10);
                ctx.fillStyle = colors[i % 4];
                ctx.fillText('Score: ' + players[i].score, 0, 10 + i * 10);
            }
        }
        ctx.fillStyle = '#fff';
        counter = gameEnd - Date.now();
        if (counter > 0) {
            ctx.fillText('Time: ' + (counter / 1000).toFixed(1), 250, 10);
        } else {
            ctx.fillText('Time: 0.0', 250, 10);
        }
        if (counter < 0) {
            ctx.fillText('Your score: ' + players[me].score, 110, 100);
            if (counter < -1000) {
                ctx.fillText('CLICK TO START', 100, 120);
            }
        }
        canvas.style.background = '#000';
    }

    function run() {
        window.requestAnimationFrame(run);
        paint(ctx);
    }

    function init() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 200;
        target = new Circle(100, 100, 10);
        spritesheet.src = 'targetshoot.png';
        enableInputs();
        enableSockets();
        run();
    }
    window.addEventListener('load', init, false);
}(window));