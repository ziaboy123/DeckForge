"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-5xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            "bg-bg-card border border-border rounded-xl shadow-card",
            "data-[state=open]:animate-slide-up",
            "p-6 focus:outline-none",
            sizeMap[size],
            className
          )}
        >
          {(title || description) && (
            <div className="mb-5">
              {title && (
                <Dialog.Title className="text-lg font-semibold text-primary">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-1 text-sm text-secondary">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}
          {children}
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted hover:text-primary hover:bg-bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
