"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Swords, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});
type FormData = z.infer<typeof schema>;

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch("password") ?? "";

  const onSubmit = async (data: FormData) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Registration failed");
      return;
    }

    toast.success("Account created! Signing you in…");

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center group-hover:bg-brand-gold/30 transition-colors">
              <Swords className="w-5 h-5 text-brand-gold" />
            </div>
            <span className="font-bold text-2xl text-primary">
              Deck<span className="text-brand-gold">Forge</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-primary">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-secondary">
            Free forever. No credit card required.
          </p>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="name"
              type="text"
              label="Display name"
              placeholder="Your name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="space-y-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Create a password"
                autoComplete="new-password"
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

              {password && (
                <div className="space-y-1 pt-1">
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          rule.test(password)
                            ? "bg-emerald-500/20 border border-emerald-500/40"
                            : "bg-bg-elevated border border-border"
                        }`}
                      >
                        {rule.test(password) && (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          rule.test(password) ? "text-emerald-400" : "text-muted"
                        }`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Already have an account?{" "}
            <Link href="/" className="text-brand-gold font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
