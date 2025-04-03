import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const subscribeToChallenge = (challengeId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:challenge', challengeId);
    }
  };

  const subscribeToClub = (clubId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:club', clubId);
    }
  };

  const onChallengeUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('challenge:update', callback);
      return () => {
        socketRef.current?.off('challenge:update', callback);
      };
    }
  };

  const onClubUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('club:update', callback);
      return () => {
        socketRef.current?.off('club:update', callback);
      };
    }
  };

  return {
    socket: socketRef.current,
    subscribeToChallenge,
    subscribeToClub,
    onChallengeUpdate,
    onClubUpdate,
  };
}; 