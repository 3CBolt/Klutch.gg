import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { logger } from "@/lib/logger";

// Define types for socket events
interface ServerToClientEvents {
  "club:update": (data: ClubUpdateData) => void;
}

interface ClientToServerEvents {
  "connect": () => void;
  "subscribe_to_club": (clubId: string) => void;
  "club:join": (data: { clubId: string; member: any }) => void;
  "club:leave": (data: { clubId: string; memberId: string }) => void;
  "club:delete": (data: { clubId: string }) => void;
  "disconnect": () => void;
}

interface ClubUpdateData {
  type: "member_join" | "member_leave" | "club_deleted";
  member?: any;
  memberId?: string;
}

type NextAuthSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: {
    user?: {
      id: string;
      [key: string]: any;
    };
  };
};

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) return io;

  io = new SocketIOServer(httpServer);

  // Auth middleware
  io.use(async (socket: NextAuthSocket, next: (err?: Error) => void) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      next(new Error("Unauthorized"));
      return;
    }
    socket.data.user = session.user;
    next();
  });

  // Handle connections
  io.on("connection", (socket: NextAuthSocket) => {
    socket.on("connect", () => {
      if (!socket.data.user) return;
      logger.info(`[Socket] User connected: ${socket.data.user.id}`);
    });

    // Join user's personal room
    if (socket.data.user) {
      socket.join(`user:${socket.data.user.id}`);
    }

    // Handle club subscriptions
    socket.on("subscribe_to_club", (clubId: string) => {
      if (!socket.data.user) return;
      socket.join(`club:${clubId}`);
      logger.info(`[Socket] User ${socket.data.user.id} subscribed to club ${clubId}`);
    });

    // Handle club events
    socket.on("club:join", (data: { clubId: string; member: any }) => {
      io?.to(`club:${data.clubId}`).emit("club:update", {
        type: "member_join",
        member: data.member,
      });
    });

    socket.on("club:leave", (data: { clubId: string; memberId: string }) => {
      io?.to(`club:${data.clubId}`).emit("club:update", {
        type: "member_leave",
        memberId: data.memberId,
      });
    });

    socket.on("club:delete", (data: { clubId: string }) => {
      io?.to(`club:${data.clubId}`).emit("club:update", {
        type: "club_deleted",
      });
    });

    // Handle disconnections
    socket.on("disconnect", () => {
      if (!socket.data.user) return;
      logger.info(`[Socket] User disconnected: ${socket.data.user.id}`);
    });
  });

  return io;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
};

// Helper function to emit events to specific rooms
export const emitToRoom = (room: string, event: keyof ServerToClientEvents, data: any) => {
  const socket = getSocketServer();
  socket.to(room).emit(event, data);
};

// Helper function to emit events to all connected clients
export const emitToAll = (event: keyof ServerToClientEvents, data: any) => {
  const socket = getSocketServer();
  socket.emit(event, data);
};
