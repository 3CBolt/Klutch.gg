import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";
import { releaseFundsToWinner } from "@/app/lib/actions/transactions";
import { ChallengeStatus } from "@prisma/client";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const SubmitResultSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  winnerId: z.string().min(1, "Winner ID is required"),
  notes: z.string().optional(),
  screenshotUrl: z.string().optional(),
  disputeReason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    let body: z.infer<typeof SubmitResultSchema>;

    // Check if the request is multipart form data
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        challengeId: formData.get("challengeId") as string,
        winnerId: formData.get("winnerId") as string,
        notes: (formData.get("notes") as string) || undefined,
        disputeReason: (formData.get("disputeReason") as string) || undefined,
        // Handle screenshot file upload here in the future
        screenshotUrl: undefined,
      };
    } else {
      body = await request.json();
    }

    const result = SubmitResultSchema.safeParse(body);
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { challengeId, winnerId, notes, screenshotUrl, disputeReason } = result.data;

    // Get the challenge and verify the user is a participant
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        opponentId: true,
        creatorSubmittedWinnerId: true,
        opponentSubmittedWinnerId: true,
        resultNotes: true,
        screenshotUrl: true,
        disputeReason: true,
        winnerId: true,
      },
    });

    if (!challenge) {
      throw Errors.NotFound;
    }

    // Verify user is a participant
    if (
      session.user.id !== challenge.creatorId &&
      session.user.id !== challenge.opponentId
    ) {
      throw Errors.Forbidden;
    }

    // Verify challenge is in progress
    if (challenge.status !== ChallengeStatus.IN_PROGRESS) {
      throw Errors.BadRequest("Challenge is not in progress");
    }

    // Determine if user is creator or opponent
    const isCreator = session.user.id === challenge.creatorId;

    // Update the challenge with the result submission
    const updateData: any = {
      ...(isCreator
        ? { creatorSubmittedWinnerId: winnerId }
        : { opponentSubmittedWinnerId: winnerId }),
      ...(notes && { resultNotes: notes }),
      ...(screenshotUrl && { screenshotUrl }),
      ...(disputeReason && { disputeReason }),
    };

    await prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "SubmitResult");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
