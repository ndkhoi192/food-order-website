require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const connectDB = require('./src/config/db');
const socketIO = require('./src/socket');

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();
    const server = http.createServer(app);

    socketIO.init(server);

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

start();
