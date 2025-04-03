import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/app/lib/prisma";
import ChallengePageClient from "./ChallengePageClient";

async function getChallengeDetails(id: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
      opponent: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
      winner: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          email: true,
        },
      },
    },
  });

  if (!challenge) {
    notFound();
  }

  return challenge;
}

export default async function ChallengePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const challenge = await getChallengeDetails(params.id);

  const isCreator = session.user.email === challenge.creator.email;
  const isOpponent = challenge.opponent?.email === session.user.email;
  const canEdit = isCreator && challenge.status === "OPEN";
  const canDelete = isCreator && challenge.status === "OPEN";
  const canJoin = !isCreator && !isOpponent && challenge.status === "OPEN";

  const isParticipant = Boolean(
    session?.user?.email &&
      (challenge.creatorId === session.user.id ||
        challenge.opponentId === session.user.id),
  );

  return (
    <ChallengePageClient
      challenge={challenge}
      isCreator={isCreator}
      isOpponent={isOpponent}
      canEdit={canEdit}
      canDelete={canDelete}
      canJoin={canJoin}
      isParticipant={isParticipant}
    />
  );
}
