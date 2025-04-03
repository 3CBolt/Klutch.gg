import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { handleError, Errors } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });

    if (!user) {
      throw Errors.NotFound;
    }

    return NextResponse.json({ balance: user.balance || 0 });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "GetBalance");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
