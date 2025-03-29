import 'next-auth';
import { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      balance?: number;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    balance?: number;
  }
} 