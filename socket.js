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

io.on('connection', socket => {
    console.log('Socket is running....');

    socket.on('addUser', (userId, userInfo) => {
        addUser(userId, socket.id, userInfo);
        io.emit('getUser', users);
    })

    socket.on('disconnect', () => {
        removeUser(socket.id);
        io.emit('getUser', users);
    })
})