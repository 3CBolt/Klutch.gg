import { prisma } from "../prisma";
import { Challenge, ChallengeStatus } from "@prisma/client";

export class InsufficientBalanceError extends Error {
  constructor(message: string = "Insufficient balance") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export async function lockFundsForChallenge(
  userId: string,
  challengeId: string,
  stake: number,
): Promise<void> {
  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Get user's current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.balance < stake) {
      throw new InsufficientBalanceError(
        `User needs ${stake} but only has ${user.balance}`,
      );
    }

    // Deduct stake from user's balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: stake } },
    });

    // Update challenge to record the locked funds
    await tx.challenge.update({
      where: { id: challengeId },
      data: {
        lockedFunds: {
          increment: stake,
        },
      },
    });
  });
}

export async function releaseFundsToWinner(
  challengeId: string,
  winnerId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.findUnique({
      where: { id: challengeId },
      select: {
        lockedFunds: true,
        status: true,
        winnerId: true,
        stake: true,
      },
    });

    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status !== ChallengeStatus.COMPLETED) {
      throw new Error("Challenge is not completed");
    }

    if (challenge.winnerId !== winnerId) {
      throw new Error("Invalid winner ID");
    }

    // Total prize is the locked funds (which should be stake * 2 if both players have locked funds)
    const totalPrize = challenge.lockedFunds;

    // Release funds to winner
    await tx.user.update({
      where: { id: winnerId },
      data: {
        balance: {
          increment: totalPrize,
        },
      },
    });

    // Mark challenge as paid and clear locked funds
    await tx.challenge.update({
      where: { id: challengeId },
      data: {
        status: ChallengeStatus.PAID,
        lockedFunds: 0,
      },
    });
  });
}
