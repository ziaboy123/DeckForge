import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-lg border bg-bg-card px-3 py-2 text-sm text-primary placeholder:text-muted",
              "border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-red-500 focus:ring-red-500/50 focus:border-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-muted flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-bg-card px-3 py-2 text-sm text-primary placeholder:text-muted",
            "border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold",
            "transition-all duration-200 resize-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500/50 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
