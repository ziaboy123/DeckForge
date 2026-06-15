"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Layers,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  TestTube,
  BarChart3,
  Swords,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

interface DeckSummary {
  id: string;
  name: string;
  description: string | null;
  format: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  cards: { id: string; quantity: number; zone: string }[];
}

interface Props {
  initialDecks: DeckSummary[];
  userName: string;
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  format: z.enum(["ADVANCED", "TRADITIONAL", "SPEED_DUEL", "RUSH_DUEL"]),
});
type CreateForm = z.infer<typeof createSchema>;

const FORMAT_LABELS: Record<string, string> = {
  ADVANCED: "Advanced",
  TRADITIONAL: "Traditional",
  SPEED_DUEL: "Speed Duel",
  RUSH_DUEL: "Rush Duel",
};

function getDeckCounts(cards: DeckSummary["cards"]) {
  const main = cards.filter((c) => c.zone === "MAIN").reduce((s, c) => s + c.quantity, 0);
  const extra = cards.filter((c) => c.zone === "EXTRA").reduce((s, c) => s + c.quantity, 0);
  const side = cards.filter((c) => c.zone === "SIDE").reduce((s, c) => s + c.quantity, 0);
  return { main, extra, side };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DashboardClient({ initialDecks, userName }: Props) {
  const router = useRouter();
  const [decks, setDecks] = useState(initialDecks);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeckSummary | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { format: "ADVANCED" },
  });

  const onCreateDeck = async (data: CreateForm) => {
    const res = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }

    toast.success("Deck created!");
    setCreateOpen(false);
    reset();
    router.push(`/deck/${json.deck.id}/build`);
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/decks/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setDecks((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" deleted`);
    } else {
      toast.error("Failed to delete deck");
    }
    setDeleteTarget(null);
  };

  const onDuplicate = async (deck: DeckSummary) => {
    const res = await fetch(`/api/decks/${deck.id}/duplicate`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      toast.success(`"${deck.name}" duplicated`);
      router.refresh();
    } else {
      toast.error(json.error ?? "Failed to duplicate");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Welcome back, {userName.split(" ")[0]}
          </h1>
          <p className="text-secondary text-sm mt-1">
            {decks.length} deck{decks.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New deck
        </Button>
      </div>

      {/* Decks grid */}
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">No decks yet</h3>
          <p className="text-secondary text-sm mb-6 max-w-xs">
            Create your first deck to start building and testing.
          </p>
          <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create your first deck
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {decks.map((deck) => {
            const counts = getDeckCounts(deck.cards);
            return (
              <div
                key={deck.id}
                className="group relative bg-bg-card border border-border rounded-xl p-5 hover:border-border-strong hover:bg-bg-elevated transition-all duration-200"
              >
                {/* Menu */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="absolute top-3 right-3 p-1.5 rounded-md text-muted hover:text-primary hover:bg-bg-hover opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-border">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[160px] rounded-xl border border-border bg-bg-card p-1 shadow-card animate-fade-in"
                      sideOffset={4}
                      align="end"
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href={`/deck/${deck.id}/build`}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary cursor-pointer hover:bg-bg-elevated outline-none"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted" /> Edit
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href={`/deck/${deck.id}/test`}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary cursor-pointer hover:bg-bg-elevated outline-none"
                        >
                          <TestTube className="w-3.5 h-3.5 text-muted" /> Test hand
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary cursor-pointer hover:bg-bg-elevated outline-none"
                        onSelect={() => onDuplicate(deck)}
                      >
                        <Copy className="w-3.5 h-3.5 text-muted" /> Duplicate
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 cursor-pointer hover:bg-red-900/20 outline-none"
                        onSelect={() => setDeleteTarget(deck)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* Card content */}
                <Link href={`/deck/${deck.id}/build`} className="block">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-primary truncate pr-6">
                        {deck.name}
                      </h3>
                      <Badge variant="default" className="mt-1">
                        {FORMAT_LABELS[deck.format] ?? deck.format}
                      </Badge>
                    </div>
                  </div>

                  {deck.description && (
                    <p className="text-xs text-secondary mb-3 line-clamp-2">{deck.description}</p>
                  )}

                  {/* Card counts */}
                  <div className="flex gap-3 text-xs text-secondary mb-4">
                    <span className="flex items-center gap-1">
                      <span className="text-primary font-semibold">{counts.main}</span> Main
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-primary font-semibold">{counts.extra}</span> Extra
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-primary font-semibold">{counts.side}</span> Side
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="w-3 h-3" />
                    {timeAgo(deck.updatedAt)}
                  </div>
                </Link>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button variant="secondary" size="sm" className="flex-1" asChild>
                    <Link href={`/deck/${deck.id}/test`}>
                      <TestTube className="w-3.5 h-3.5" />
                      Test
                    </Link>
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" asChild>
                    <Link href={`/deck/${deck.id}/analyze`}>
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analyze
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create deck modal */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create new deck"
        description="Give your deck a name and choose a format."
      >
        <form onSubmit={handleSubmit(onCreateDeck)} className="space-y-4">
          <Input
            id="deck-name"
            label="Deck name"
            placeholder="My Awesome Deck"
            error={errors.name?.message}
            {...register("name")}
          />
          <Textarea
            id="deck-desc"
            label="Description (optional)"
            placeholder="Brief description of your strategy…"
            className="h-20"
            {...register("description")}
          />
          <Select
            label="Format"
            options={[
              { value: "ADVANCED", label: "Advanced Format" },
              { value: "TRADITIONAL", label: "Traditional Format" },
              { value: "SPEED_DUEL", label: "Speed Duel" },
              { value: "RUSH_DUEL", label: "Rush Duel" },
            ]}
            value={watch("format")}
            onValueChange={(v) => setValue("format", v as CreateForm["format"])}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Create deck
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete deck?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        size="sm"
      >
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
