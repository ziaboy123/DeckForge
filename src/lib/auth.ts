import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { RateLimiter, TOO_MANY_ATTEMPTS, clientIp, shared } from "@/lib/rateLimit";

// Sign-in limits (accounts are shared with Millennium Arena, so guessing here would work there too).
// Every try counts against the visitor (each one costs a bcrypt run) and against the email; signing in clears the email's count.
const signInTriesPerIp = shared("signInTriesPerIp", () => new RateLimiter(20, 15 * 60_000));
const signInTriesPerEmail = shared("signInTriesPerEmail", () => new RateLimiter(8, 15 * 60_000));

// checked against when an email has no account, so a wrong email takes as long as a wrong password (cost 12, like real ones)
const DUMMY_HASH = bcrypt.hash(randomUUID(), 12);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  logger: {
    // a login ended by a password change (see the jwt callback) is expected, not an error worth logging
    error(code, metadata) {
      if (code === "JWT_SESSION_ERROR" && (metadata as { message?: string })?.message === "Session revoked") return;
      console.error(`[next-auth][error][${code}]`, metadata);
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase();

        // throwing (rather than returning null) sends this code back to the login form
        if (!signInTriesPerIp.hit(clientIp(req?.headers)).ok) throw new Error(TOO_MANY_ATTEMPTS);
        if (email.length > 254) return null;
        if (!signInTriesPerEmail.hit(email).ok) throw new Error(TOO_MANY_ATTEMPTS);

        const user = await prisma.user.findUnique({ where: { email } }).catch((err) => {
          // a thrown message goes back to the browser, so keep database details in the log
          console.error("[auth] user lookup failed:", err instanceof Error ? err.message : err);
          throw new Error("SignInUnavailable");
        });

        // same bcrypt work and same answer whether the email or the password was wrong
        const isValid = await bcrypt.compare(String(credentials.password), user?.password ?? (await DUMMY_HASH));
        if (!user?.password || !isValid) return null;
        signInTriesPerEmail.reset(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.sv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        return token;
      }
      // Logins are signed tokens the server can't take back, so each one carries the account's session version:
      // once the password changes (or the account is deleted) the versions no longer match, and throwing here
      // makes NextAuth clear the session.
      const account = await prisma.user.findUnique({ where: { id: token.id as string }, select: { sessionVersion: true } });
      if (!account || account.sessionVersion !== ((token.sv as number | undefined) ?? 0)) throw new Error("Session revoked");
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string | null,
        };
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
