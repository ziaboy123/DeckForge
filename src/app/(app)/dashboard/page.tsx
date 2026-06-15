import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const decks = await prisma.deck.findMany({
    where: { userId: session!.user.id },
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
      userName={session!.user.name ?? session!.user.email ?? "Duelist"}
    />
  );
}
