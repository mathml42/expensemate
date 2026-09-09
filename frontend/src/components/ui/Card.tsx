import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  padding = "md",
  interactive = false,
  title,
  description,
  actions,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-card transition-colors duration-150 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        paddingClasses[padding],
        interactive &&
          "cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-emphasized hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-elevated dark:hover:border-slate-600",
        className,
      )}
      {...props}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
