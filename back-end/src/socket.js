const { Server } = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            },
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('joinStaffRoom', () => {
                socket.join('staff');
                console.log(`Socket ${socket.id} joined room: staff`);
            });

            socket.on('joinTableRoom', (tableId) => {
                socket.join(`table_${tableId}`);
                console.log(`Socket ${socket.id} joined room: table_${tableId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io is not initialized!');
        }
        return io;
    },
};
