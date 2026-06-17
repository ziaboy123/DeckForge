"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Layers, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  user: { id: string; name: string; email: string; memberSince: string };
  deckCount: number;
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfileClient({ user, deckCount }: Props) {
  const { update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSaveProfile = async (data: ProfileForm) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/user/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name }),
    });
    if (res.ok) {
      await updateSession({ name: data.name });
      toast.success("Profile updated!");
    } else {
      toast.error("Failed to update profile");
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/user/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });
    if (res.ok) {
      toast.success("Password changed!");
      passwordForm.reset();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Failed to change password");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Profile</h1>
        <p className="text-secondary text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{deckCount}</div>
            <div className="text-xs text-muted">Decks saved</div>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary">
              {new Date(user.memberSince).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-muted">Member since</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        {(["profile", "security"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-brand-gold text-brand-gold"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-gold/20 border-2 border-brand-gold/30 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-brand-gold" />
            </div>
            <div>
              <p className="font-semibold text-primary">{user.name || user.email}</p>
              <p className="text-sm text-secondary">{user.email}</p>
            </div>
          </div>

          <Input
            id="profile-name"
            label="Display name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name")}
          />
          <Input id="profile-email" label="Email address" value={user.email} disabled />

          <Button
            type="submit"
            isLoading={profileForm.formState.isSubmitting}
          >
            Save changes
          </Button>
        </form>
      )}

      {activeTab === "security" && (
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-5">
          <Input
            id="current-password"
            type="password"
            label="Current password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <Input
            id="new-password"
            type="password"
            label="New password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
          <Input
            id="confirm-password"
            type="password"
            label="Confirm new password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />
          <Button
            type="submit"
            isLoading={passwordForm.formState.isSubmitting}
          >
            Change password
          </Button>
        </form>
      )}
    </div>
  );
}
