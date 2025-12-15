import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: config.corsOrigin,
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
