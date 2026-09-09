import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({ icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400",
        compact ? "gap-1 py-6" : "gap-2 rounded-lg border border-dashed border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      {icon && <div className="mb-1 text-slate-400 dark:text-slate-600">{icon}</div>}
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
