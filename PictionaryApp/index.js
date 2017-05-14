var http = require('http');
var IO = require('socket.io');
var express = require('express');
var redis = require('redis');

var PORT = process.env.PORT || 8000;

var app = express();

app.use(express.static('client/dist'));

const DRAWABLES = [
  'cat',
  'dog',
  'palmtree',
  'car',
  'house',
  'airplane',
  'sunflower',
  'eagle',
];

var sockets = [];
var timeouts = {};

var rclient = redis.createClient();
var pub = redis.createClient();
var sub = redis.createClient();
sub.subscribe('global');

// Set players to false:
rclient.smembers('players', (err, members) => {
  members.forEach((member) => {
    const m = JSON.parse(member);
    m.logged = false;
  });
});

app.get('/drawable', (req, res) => {
  var index = Math.floor(Math.random() * DRAWABLES.length);

  rclient.set('drawable', DRAWABLES[index]);

  res.status(200).json({ drawable: DRAWABLES[index] });
});

app.use(function (req, res) {
  res.status(404).json({
    url: req.originalUrl,
    error: 'Not found.'
  });
});

var server = http.createServer(app);

var io = IO(server);

sub.on('message', (channel, data) => {
  var data = JSON.parse(data);
  var type = data.type;
  var msg = data.msg;

  if (type) sockets.forEach(socket => socket.emit(type, msg));
  else sockets.forEach(socket => socket.emit(msg));
});

var checkedPlayers = false;

var checkPlayers = function() {
  rclient.smembers('players', (err, members) => {
    const onlineMembers = members.filter(member => JSON.parse(member).logged);

    onlineMembers.forEach((member) => {
      const player = JSON.parse(member);

      const msg2 = {
        type: 'alive',
        msg: player.player
      };

      const pData = {
        player: player.player,
        logged: true
      };

      timeouts[player.player] = setTimeout(() => {
        console.log('Dead player. Log off.');
        rclient.srem('players', JSON.stringify(pData));
        pData.logged = false;
        rclient.sadd('players', JSON.stringify(pData));

        var msg3 = {
          type: 'player-leave',
          msg: player.player
        };
        pub.publish('global', JSON.stringify(msg3));
      }, 10000);

      pub.publish('global', JSON.stringify(msg2));
    });

    checkedPlayers = true;        
  });
};

io.on('connection', (socket) => {
  sockets.push(socket);

  console.log('user connected to the server');

  socket.on('player-join', (data) => {
    console.log('join');

    var msg = {
      type: 'player-join',
      msg: data
    };

    var playerData = {
      player: data,
      logged: true
    };

    if (!checkedPlayers) {
      checkPlayers();
    }

    const promise = new Promise((resolve, reject) => {
      rclient.sismember('players', JSON.stringify(playerData), (err, belongs) => {
        if (belongs === 1) {
          console.log('already logged in.');

          socket.emit('player-exists');
          checkPlayers();

          reject();
        } else {
          playerData.logged = false;
          rclient.sismember('players', JSON.stringify(playerData), (err, belongs) => {
            if (belongs === 1) {
              console.log('user found but not logged in.');
              rclient.srem('players', JSON.stringify(playerData));
              playerData.logged = true;
              rclient.sadd('players', JSON.stringify(playerData), () => {
                resolve();
              });
              pub.publish('global', JSON.stringify(msg));
            } else {
              playerData.logged = true;
              rclient.sadd('players', JSON.stringify(playerData), () => {
                resolve();
              });
              pub.publish('global', JSON.stringify(msg));
            }
          });
        }
      });
    });

    promise.then(() => {
      // If two or more players set drawer:
      rclient.smembers('players', (err, members) => {
        const onlineMembers = members.filter(member => JSON.parse(member).logged);

        if (onlineMembers.length > 1) {
          rclient.get('drawer', (err, value) => {
            console.log(value);
            if (value === null) {
              const player = JSON.parse(onlineMembers[0]);
              rclient.set('drawer', player.player);
              const msg = {
                type: 'drawing-player',
                msg: player.player
              }
              pub.publish('global', JSON.stringify(msg));
            } else {
              socket.emit('drawing-player', value);
            }
          })
        } else {
          console.log('No enough players.');
          rclient.del('drawer');
          const msg = {
              type: 'drawing-player'
            };
          pub.publish('global', JSON.stringify(msg));
        }
      });
    })
    .catch(() => {
      console.log('Cannot login.');
    });
  });

  socket.on('alive', (data) => {
    const timer = timeouts[data];

    if (timer) {
      console.log(data + ' is alive');
      clearTimeout(timer);
      delete timeouts[data];
    }
  });

  socket.on('guess', (data) => {
    console.log('New Guess!');
    console.log(data);

    rclient.get('drawable', (err, value) => {
      if (value && value === data.value) {
        // Guess was correct
        const msg = {
          type: 'guess-message',
          msg: data.player + ' guessed right! The answer was ' + value + '.'
        }

        pub.publish('global', JSON.stringify(msg));

        // Select new drawer:
        rclient.smembers('players', (err, members) => {
          const onlineMembers = members.filter(member => JSON.parse(member).logged);

          if (onlineMembers.length > 1) {
            // At least two players
            rclient.get('drawer', (err, value) => {
              console.log('Previous drawer: ' + value);

              let drawer;

              if (value === null) {
                drawer = JSON.parse(onlineMembers[0]);
              } else {
                const oldDrawer = onlineMembers.find(m => JSON.parse(m).player === value);
                const index = onlineMembers.indexOf(oldDrawer);

                drawer = (index < onlineMembers.length - 1) ? JSON.parse(onlineMembers[index+1]) : JSON.parse(onlineMembers[0]);

              }
              rclient.set('drawer', drawer.player);
              const msg = {
                type: 'drawing-player',
                msg: drawer.player
              }
              pub.publish('global', JSON.stringify(msg));
            })
          } else {
            console.log('No enough players.');
            rclient.del('drawer');
            const msg = {
              type: 'drawing-player'
            };
            pub.publish('global', JSON.stringify(msg));
          }
        });
      } else if (value && value !== data.value) {
        // Guess was not correct.
        const msg = {
          type: 'guess-message',
          msg: data.player + ' guessed ' + data.value + '.'
        }

        pub.publish('global', JSON.stringify(msg));

      } else {
        // No drawable found. Terminate.
        console.log('Should not happen!');
      }
    });
  });

  socket.on('player-leave', (data) => {
    console.log('Bye ' + data + '!');
    var msg = {
      type: 'player-leave',
      msg: data
    };

    var playerData = {
      player: data,
      logged: true
    };

    rclient.smembers('players', (err, members) => {
      const onlineMembers = members.filter(member => JSON.parse(member).logged);

      if (onlineMembers.length > 2) {
        // At least two players + leaving player.

        rclient.get('drawer', (err, value) => {
          if (value == data) {
            // Drawer is leaving player.

            const leavingPlayer = onlineMembers.find(m => JSON.parse(m).player === data);
            const index = onlineMembers.indexOf(leavingPlayer);

            console.log('Leaving player index: ' + index);

            const newDrawer = (index < onlineMembers.length - 1) ? JSON.parse(onlineMembers[index+1]) : JSON.parse(onlineMembers[0]);

            rclient.set('drawer', newDrawer.player);

            const msg2 = {
              type: 'drawing-player',
              msg: newDrawer.player
            };

            pub.publish('global', JSON.stringify(msg2));
          } else {
            // Drawer is not leaving player.
          }

          rclient.srem('players', JSON.stringify(playerData));
          playerData.logged = false;
          rclient.sadd('players', JSON.stringify(playerData));

          pub.publish('global', JSON.stringify(msg));
        });
        
      } else {
        // Only two players.
        console.log('No enough players.');
        const msg2 = {
          type: 'drawing-player'
        };
        pub.publish('global', JSON.stringify(msg2));

        rclient.srem('players', JSON.stringify(playerData));
        playerData.logged = false;
        rclient.sadd('players', JSON.stringify(playerData));

        pub.publish('global', JSON.stringify(msg));
      }
    });
  });

  socket.on('get-players', () => {
    rclient.smembers('players', (err, members) => {
      members.forEach((member) => {
        const playerData = JSON.parse(member);

        console.log(playerData);

        if (playerData.logged) {
          socket.emit('player-join', playerData.player);
        }
      });
    });
  });

  socket.on('strokes', (data) => {

    const msg = {
      type: 'strokes',
      msg: data
    };

    pub.publish('global', JSON.stringify(msg));
  });

  socket.on('disconnect', () => {
    var index = sockets.indexOf(socket);

    if (index >= 0) sockets.splice(index, 1);
  });
});

server.listen(PORT);
server.on('listening', function () {
  console.log(`App Server started at port ${PORT}.`);
});
server.on('error', function (err) {
  console.log(err);
  process.exit(1);
});

