// https://www.webrtc-experiment.com/

// HTTPs server
const PORT = process.env.PORT || 3000;
const express = require('express');
const socketIO = require('socket.io');

var app = express().listen(PORT, () => console.log(`Listening on ${PORT}`));

// socket.io goes below

var io = socketIO(app);

// io.listen({
//     log: true,
//     origins: '*:*'
// });

// io.set('transports', [
//     // 'websocket',
//     'xhr-polling',
//     'jsonp-polling'
// ]);

var channels = {};

io.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !!channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel) {
            delete channels[initiatorChannel];
        }
    });
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            if (data.sender == sender) {
                if (!username) username = data.data.sender;

                socket.broadcast.emit('message', data.data);
            }
        });

        socket.on('disconnect', function () {
            if (username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}

// run app

// app.listen(process.env.PORT || 9559);

process.on('unhandledRejection', (reason, promise) => {
    process.exit(1);
});

// console.log('Please open SSL URL: https://localhost:' + (process.env.PORT || 9559) + '/');