import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Đổi theo config trong file .env hoặc env variables

export const socket = io(SOCKET_URL, {
    autoConnect: false, // Để khi nào cần mới chủ động connect
});
