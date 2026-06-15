import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const deckCount = await prisma.deck.count({
    where: { userId: session!.user.id },
  });

  return (
    <ProfileClient
      user={{
        id: user!.id,
        name: user!.name ?? "",
        email: user!.email,
        memberSince: user!.createdAt.toISOString(),
      }}
      deckCount={deckCount}
    />
  );
}
