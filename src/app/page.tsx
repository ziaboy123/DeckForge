import Link from "next/link";
import {
  Swords,
  Shuffle,
  BarChart3,
  Layers,
  Zap,
  Shield,
  Star,
  ChevronRight,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Layers,
    title: "Advanced Deck Builder",
    description:
      "Search 13,000+ cards with instant filtering by type, attribute, archetype, and banlist status. Build your main, extra, and side decks with a professional interface.",
    color: "#f0c040",
  },
  {
    icon: Shuffle,
    title: "Hand Testing",
    description:
      "Rapidly test opening hands. Draw 5 or 6, redraw, shuffle, and iterate in seconds. Identify consistency issues and fine-tune your ratios.",
    color: "#3b82f6",
  },
  {
    icon: Zap,
    title: "Goldfish Mode",
    description:
      "Visualize your combo lines without a full duel simulator. Move cards freely between deck, hand, field, graveyard, and banished zones.",
    color: "#22c55e",
  },
  {
    icon: BarChart3,
    title: "Probability Engine",
    description:
      "Calculate exact opening-hand probabilities using hypergeometric distribution. Know your chances of opening any combination of cards.",
    color: "#a78bfa",
  },
  {
    icon: Shield,
    title: "Deck Analysis",
    description:
      "Instant stats: monster/spell/trap ratios, archetype breakdown, level distribution, attribute spread, and deck legality checking.",
    color: "#f472b6",
  },
  {
    icon: Star,
    title: "Deck Management",
    description:
      "Save unlimited decks, duplicate builds, import and export in standard deck-list format, and keep your collection organized.",
    color: "#fb923c",
  },
];

const stats = [
  { value: "13,000+", label: "Cards available" },
  { value: "∞", label: "Decks you can save" },
  { value: "<50ms", label: "Hand draw speed" },
  { value: "100%", label: "Free to use" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/40">
              <Swords className="w-4 h-4 text-brand-gold" />
            </div>
            <span className="font-bold text-lg text-primary">
              Deck<span className="text-brand-gold">Forge</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-gold/5 blur-3xl" />
          <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-sm text-brand-gold mb-8">
            <Zap className="w-3.5 h-3.5" />
            Yu-Gi-Oh! deck building, reinvented
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-primary mb-6 leading-[1.05]">
            Build smarter.
            <br />
            <span className="gradient-text">Test faster.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-secondary mb-10 leading-relaxed">
            DeckForge is a professional-grade deck building and testing platform for competitive Yu-Gi-Oh! players.
            Build decks, simulate opening hands, and analyze consistency — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Start building for free
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">Sign in to your account</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-gold">
                  {stat.value}
                </div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Everything you need to build winning decks
          </h2>
          <p className="text-secondary text-lg max-w-xl mx-auto">
            From initial brew to final refinement — DeckForge has every tool competitive players need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-border bg-bg-card hover:border-border-strong hover:bg-bg-elevated transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="text-base font-semibold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 pb-24">
        <div className="relative rounded-2xl border border-brand-gold/20 bg-bg-card overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-gradient-radial from-brand-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Ready to forge your perfect deck?
            </h2>
            <p className="text-secondary mb-8 max-w-md mx-auto">
              Join thousands of players using DeckForge to build, test, and perfect their Yu-Gi-Oh! strategies.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Create a free account
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-brand-gold" />
            <span className="font-semibold text-primary">
              Deck<span className="text-brand-gold">Forge</span>
            </span>
          </div>
          <p className="text-xs text-muted">
            Card data provided by{" "}
            <a
              href="https://ygoprodeck.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-brand-gold transition-colors"
            >
              YGOPRODeck
            </a>
            . Yu-Gi-Oh! is a trademark of Konami.
          </p>
        </div>
      </footer>
    </div>
  );
}
