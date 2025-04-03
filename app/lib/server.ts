import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: NetServer) => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Middleware for authentication
    io.use(async (socket, next) => {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return next(new Error('Unauthorized'));
      }
      socket.data.user = session.user;
      next();
    });

    // Handle connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.data.user?.id);

      // Join user's personal room
      socket.join(`user:${socket.data.user.id}`);

      // Handle club subscriptions
      socket.on('subscribe:club', (clubId: string) => {
        socket.join(`club:${clubId}`);
        console.log(`User ${socket.data.user.id} subscribed to club ${clubId}`);
      });

      // Handle club events
      socket.on('club:join', (data: { clubId: string; member: any }) => {
        io?.to(`club:${data.clubId}`).emit('club:update', {
          type: 'member_join',
          member: data.member,
        });
      });

      socket.on('club:leave', (data: { clubId: string; memberId: string }) => {
        io?.to(`club:${data.clubId}`).emit('club:update', {
          type: 'member_leave',
          memberId: data.memberId,
        });
      });

      socket.on('club:delete', (data: { clubId: string }) => {
        io?.to(`club:${data.clubId}`).emit('club:update', {
          type: 'club_deleted',
        });
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.data.user?.id);
      });
    });
  }
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper function to emit events to specific rooms
export const emitToRoom = (room: string, event: string, data: any) => {
  const socket = getIO();
  socket.to(room).emit(event, data);
};

// Helper function to emit events to all connected clients
export const emitToAll = (event: string, data: any) => {
  const socket = getIO();
  socket.emit(event, data);
}; 