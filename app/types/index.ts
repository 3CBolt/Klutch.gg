export type User = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  balance: number;
};

export type Challenge = {
  id: string;
  creatorId: string;
  creator: {
    name: string | null;
    email: string;
  };
  opponentId?: string | null;
  stake: number;
  type: 'KillRace' | 'OverUnder' | 'Survival';
  status: 'Open' | 'InProgress' | 'Completed' | 'Disputed';
  winnerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}; 