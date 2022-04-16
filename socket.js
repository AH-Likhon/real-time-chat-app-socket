const io = require('socket.io')(8000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let users = [];

const addUser = (userId, socketId, userInfo) => {
    const checkUser = users.some(user => user.userId === userId);

    if (checkUser === false) {
        users.push({
            userId,
            socketId,
            userInfo
        })
    }
}

const removeUser = socketId => {
    users = users.filter(user => user.socketId !== socketId);
}

const findUser = id => {
    const result = users.find(user => user.userId === id);
    return result;
}

io.on('connection', socket => {
    console.log('Socket is running....');

    socket.on('addUser', (userId, userInfo) => {
        addUser(userId, socket.id, userInfo);
        io.emit('getUser', users);
    });

    socket.on('sendMessage', data => {
        const user = findUser(data.receiverId);

        // console.log(user);

        if (user !== undefined) {
            socket.to(user.socketId).emit('getMessage', {
                senderId: data.senderId,
                senderName: data.senderName,
                receiverId: data.receiverId,
                createAt: data.time,
                message: {
                    text: data.message,
                    image: data.image
                }
            })
        }
        // console.log('get', data);
    })

    socket.on('typing', data => {
        const user = findUser(data.receiverId);

        if (user !== undefined) {
            socket.to(user.socketId).emit('getTyping', {
                senderId: data.senderId,
                receiverId: data.receiverId,
                message: data.message
            })
        }
    })

    socket.on('disconnect', () => {
        removeUser(socket.id);
        io.emit('getUser', users);
    })
})