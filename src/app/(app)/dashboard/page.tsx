import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  // pages render alongside the layout, so its sign-in redirect doesn't stop this from running: check here too
  // (a signed-out visitor or a login ended by a password change has no session)
  if (!session) redirect("/login");

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      cards: {
        select: { id: true, quantity: true, zone: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = decks.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      initialDecks={serialized}
      userName={session.user.name ?? session.user.email ?? "Duelist"}
    />
  );
}
