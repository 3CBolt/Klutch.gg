import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { stripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const VerifySessionSchema = z.object({
  session_id: z.string().min(1, "Session ID is required"),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    // Get and validate the session ID from the URL
    const { searchParams } = new URL(request.url);
    const result = VerifySessionSchema.safeParse({
      session_id: searchParams.get("session_id"),
    });

    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { session_id } = result.data;

    // Retrieve the Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

    // Verify that this session belongs to the current user
    if (stripeSession.client_reference_id !== session.user.id) {
      throw Errors.Forbidden;
    }

    // Check if payment was successful
    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({
        success: false,
        status: stripeSession.payment_status,
      });
    }

    // Get the amount from the session
    const amount = stripeSession.amount_total
      ? stripeSession.amount_total / 100
      : 0;

    // Update user's wallet balance
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      amount,
      status: stripeSession.payment_status,
    });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "VerifySession");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
