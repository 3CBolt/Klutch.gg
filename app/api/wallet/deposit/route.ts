import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { handleError, Errors } from "@/lib/errors";
import { z } from "zod";

const DepositSchema = z.object({
  amount: z.number()
    .min(1, "Minimum deposit amount is $1")
    .max(10000, "Maximum deposit amount is $10,000"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw Errors.Unauthorized;
    }

    const body = await request.json();
    const result = DepositSchema.safeParse(body);
    
    if (!result.success) {
      throw Errors.ValidationError(result.error.errors[0].message);
    }

    const { amount } = result.data;

    // Get the origin from the request headers with fallback
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wallet Deposit",
              description: `Add $${amount} to your gaming wallet`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/wallet?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/wallet?status=canceled`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        type: "wallet_deposit",
        amount: amount.toString(),
      },
    });

    if (!checkoutSession.url) {
      throw Errors.BadRequest("Failed to create checkout session");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleError(error, "WalletDeposit");
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
