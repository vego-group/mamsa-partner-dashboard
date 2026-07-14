"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { forwardRef } from "react";

/* ---------------- Button ---------------- */
type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; full?: boolean }
>(({ className, variant = "primary", full, ...props }, ref) => {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/40",
    outline: "border border-line bg-white text-ink hover:bg-cream disabled:opacity-50",
    ghost: "text-ink hover:bg-cream disabled:opacity-50",
    danger: "bg-status-rejected text-white hover:brightness-95 disabled:opacity-50",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-field px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        full && "w-full",
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

/* ---------------- Card ---------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-white shadow-card", className)}
      {...props}
    />
  );
}

/* ---------------- Input ---------------- */
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-field border border-line bg-cream/40 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:bg-white",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/* ---------------- Field ---------------- */
export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-status-rejected">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-status-rejected">{error}</span>}
    </label>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn("w-full rounded-card bg-white shadow-modal", width)}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between border-b border-line px-6 py-4">
            <div>
              {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-ink-muted hover:bg-cream" aria-label="close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
