"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Swords, Eye, EyeOff, Layers, Shuffle, Zap, BarChart3, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: Layers,    text: "Build decks from 13,000+ cards with full search and filtering" },
  { icon: Shuffle,   text: "Test opening hands and identify consistency issues instantly" },
  { icon: Zap,       text: "Goldfish mode — move cards freely to visualise combo lines" },
  { icon: BarChart3, text: "Exact opening-hand probabilities via hypergeometric distribution" },
  { icon: Shield,    text: "Deck analysis: ratios, archetypes, levels, attributes, legality" },
];

export default function HomePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Left — login panel */}
      <div className="w-full max-w-sm flex flex-col justify-center px-10 py-12 border-r border-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center">
            <Swords className="w-4 h-4 text-brand-gold" />
          </div>
          <span className="font-bold text-xl text-primary">
            Deck<span className="text-brand-gold">Forge</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-primary mb-1">Sign in</h1>
        <p className="text-sm text-secondary mb-8">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-gold hover:underline font-medium">
            Register
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted hover:text-secondary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register("password")}
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-10 text-xs text-muted">
          Card data via{" "}
          <a
            href="https://ygoprodeck.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary transition-colors"
          >
            YGOPRODeck
          </a>
          . Yu-Gi-Oh! is a trademark of Konami.
        </p>
      </div>

      {/* Right — info panel */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12 bg-bg-card hidden sm:flex">
        <h2 className="text-3xl font-bold text-primary mb-3">
          Build smarter. Test faster.
        </h2>
        <p className="text-secondary text-base leading-relaxed mb-10 max-w-lg">
          DeckForge is a deck building and testing platform for Yu-Gi-Oh! players.
          Everything you need to build, test, and analyse your decks — in one place, for free.
        </p>

        <ul className="space-y-5">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-brand-gold" />
              </div>
              <span className="text-sm text-secondary leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
