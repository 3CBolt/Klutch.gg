import { NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { initSocketServer } from '@/app/lib/server';

export async function GET(req: Request) {
  try {
    const res = new NextResponse();
    const httpServer = (res as any).socket?.server;
    
    if (!httpServer) {
      return NextResponse.json({ error: 'HTTP server not found' }, { status: 500 });
    }

    const io = initSocketServer(httpServer);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize Socket.IO' }, { status: 500 });
  }
} 