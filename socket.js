const io = require('socket.io')(8000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let users = [];

const addUser = (userId, socketId, userInfo) => {
    const checkUser = users.some(user => user.userId === userId);

    if (!checkUser) {
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
};

const userLogout = userId => {
    users = users.filter(user => user.userId !== userId);
};

// const tokenDecode = (token) => {
//     const tokenDecoded = deCodeToken(token);
//     console.log(tokenDecoded);
//     const expTime = new Date(tokenDecoded.exp * 1000);
//     if (new Date() > expTime) {
//         return null;
//     }
//     return tokenDecoded;
// }

io.on('connection', socket => {
    // console.log('Socket is running....');

    socket.on('addUser', (userId, userInfo) => {
        addUser(userId, socket.id, userInfo);
        io.emit('getUser', users);

        const restUsers = users.filter(user => user.userId !== userId);
        const newRes = 'add_new_user';
        for (let i = 0; i < restUsers.length; i++) {
            socket.to(restUsers[i].socketId).emit('add_new_user', newRes)
        };
    });

    socket.on('sendMessage', data => {
        const user = findUser(data.receiverId);

        // console.log(data);

        if (user !== undefined) {
            socket.to(user.socketId).emit('getMessage', {
                uid: data.uid,
                senderId: data.senderId,
                senderName: data.senderName,
                receiverId: data.receiverId,
                receiverName: data.receiverName,
                createdAt: data.time,
                status: data.status,
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

        // console.log(data);

        if (user !== undefined) {
            socket.to(user.socketId).emit('getTyping', {
                senderId: data.senderId,
                receiverId: data.receiverId,
                message: data.message
            })
        }
    });

    socket.on('seenSMS', sms => {
        console.log('seen', sms);
        const user = findUser(sms.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('seenSmsRes', {
                ...sms,
                status: 'seen'
            })
        }
    });

    socket.on('deliveredSMS', sms => {
        console.log('delivered', sms);
        const user = findUser(sms.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('deliveredSmsRes', {
                ...sms,
                status: 'delivered'
            })
        }
    });

    socket.on('updateSeenSMS', sms => {
        console.log('updateSeenSMS', sms);
        const user = findUser(sms.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('updateSeenSMSRes', {
                ...sms,
                status: 'seen'
            })
        }
    });

    socket.on('logout', userInfo => {
        // console.log('Logout', userInfo);
        // console.log('Logout Id', userInfo.id);
        // const user = findUser(userInfo.id);
        // if (user !== undefined) {
        //     socket.to(userInfo.id).emit('logoutUser', userInfo);
        // }
        userLogout(userInfo.id);
    })

    socket.on('disconnect', () => {
        removeUser(socket.id);
        io.emit('getUser', users);
    })
})