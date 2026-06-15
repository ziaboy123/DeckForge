"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  label,
  disabled,
  className,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-xs font-medium text-secondary">{label}</span>}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-border",
            "bg-bg-card px-3 py-2 text-sm text-primary",
            "focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={<span className="text-muted">{placeholder}</span>} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-muted" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border",
              "bg-bg-card shadow-card",
              "data-[side=bottom]:animate-slide-up data-[side=top]:animate-slide-up"
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1 max-h-60 overflow-y-auto">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm text-primary",
                    "outline-none transition-colors",
                    "data-[highlighted]:bg-bg-elevated data-[highlighted]:text-primary",
                    "data-[state=checked]:text-brand-gold"
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
