import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Define validation schema
const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      logger.warn('[Registration Validation Failed]', errorMessage);
      return NextResponse.json(
        { error: "Validation failed", details: errorMessage },
        { status: 400 }
      );
    }

    const { email, name, password } = result.data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      logger.warn('[Registration Failed] Email already exists:', email);
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        displayName: name, // Set initial display name same as name
      },
      select: {
        id: true,
        name: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    logger.info('[Registration Success]', { userId: user.id, email: user.email });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    logger.error('[Registration Failed] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
