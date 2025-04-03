"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";
import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500),
  kills: z.number().int().min(0),
  deaths: z.number().int().min(0),
  wins: z.number().int().min(0),
  gamesPlayed: z.number().int().min(0),
});

export async function updateProfile(formData: FormData) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const data = {
    displayName: (formData.get("displayName") as string) || "",
    bio: (formData.get("bio") as string) || "",
    kills: parseInt(formData.get("kills") as string) || 0,
    deaths: parseInt(formData.get("deaths") as string) || 0,
    wins: parseInt(formData.get("wins") as string) || 0,
    gamesPlayed: parseInt(formData.get("gamesPlayed") as string) || 0,
  };

  try {
    const validatedData = profileUpdateSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: validatedData.displayName,
        bio: validatedData.bio,
        gamingStats: {
          kills: validatedData.kills,
          deaths: validatedData.deaths,
          wins: validatedData.wins,
          gamesPlayed: validatedData.gamesPlayed,
          kdRatio:
            validatedData.deaths === 0
              ? validatedData.kills
              : Number((validatedData.kills / validatedData.deaths).toFixed(2)),
          winRate:
            validatedData.gamesPlayed === 0
              ? 0
              : Number(
                  (
                    (validatedData.wins / validatedData.gamesPlayed) *
                    100
                  ).toFixed(1),
                ),
        },
      },
    });

    redirect(`/profile/${session.user.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw new Error("Failed to update profile");
  }
}
