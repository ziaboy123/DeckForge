import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { RateLimiter, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { PASSWORD_TOO_LONG, passwordFits } from "@/lib/password";

// Per-visitor sign-up limits: a cap on tries (each one can tell whether an email has an account) and on new accounts.
// Hiding that completely would need email verification: without it, a sign-up that works shows the email was free.
const signUpTriesPerIp = new RateLimiter(10, 60 * 60_000);
const signUpsPerIp = new RateLimiter(5, 60 * 60_000);

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).refine(passwordFits, PASSWORD_TOO_LONG),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const blocked = [signUpsPerIp.check(ip), signUpTriesPerIp.hit(ip)].find((r) => !r.ok);
  if (blocked) return tooManyRequests("Too many sign-up attempts. Try again later.", blocked.retryAfterMs);

  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Couldn't create an account with that email. If it's yours, sign in instead." },
        { status: 409 }
      );
    }

    // take this visitor's account slot now, with no await between the count and the check, so a burst of
    // sign-ups sent all at once can't all squeeze past the cap before any of them is counted
    const slot = signUpsPerIp.hit(ip);
    if (!slot.ok) return tooManyRequests("Too many sign-up attempts. Try again later.", slot.retryAfterMs);

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
