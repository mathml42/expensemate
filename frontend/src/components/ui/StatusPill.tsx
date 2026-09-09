import { CheckCircle2, Circle, RotateCcw, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/cn";

export type TransactionStatusLike = "pending" | "approved" | "rejected" | "deleted";

const statusClasses: Record<TransactionStatusLike, string> = {
  pending: "bg-warning-100 text-warning-800 dark:bg-warning-400/10 dark:text-warning-400",
  approved: "bg-success-100 text-success-800 dark:bg-success-400/10 dark:text-success-400",
  rejected: "bg-danger-100 text-danger-800 dark:bg-danger-400/10 dark:text-danger-400",
  deleted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusIcons: Record<TransactionStatusLike, LucideIcon> = {
  pending: Circle,
  approved: CheckCircle2,
  rejected: XCircle,
  deleted: RotateCcw,
};

export function StatusPill({ status, className }: { status: TransactionStatusLike; className?: string }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold capitalize transition-colors duration-200",
        statusClasses[status],
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", status === "pending" && "fill-current")} />
      {status}
    </span>
  );
}
