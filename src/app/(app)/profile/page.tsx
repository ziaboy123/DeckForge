import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  // pages render alongside the layout, so its sign-in redirect doesn't stop this from running: check here too
  // (a signed-out visitor or a login ended by a password change has no session)
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const deckCount = await prisma.deck.count({
    where: { userId: session.user.id },
  });

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name ?? "",
        email: user.email,
        memberSince: user.createdAt.toISOString(),
      }}
      deckCount={deckCount}
    />
  );
}
