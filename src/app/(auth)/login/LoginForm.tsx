"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Swords, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
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
          <h1 className="mt-6 text-2xl font-bold text-primary">Welcome back</h1>
          <p className="mt-1.5 text-sm text-secondary">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
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
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-gold font-medium hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
