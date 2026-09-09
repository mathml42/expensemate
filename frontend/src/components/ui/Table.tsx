import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export function Table({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        className,
      )}
      {...props}
    >
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-slate-100/70 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300", className)}
      {...props}
    />
  );
}

export function TableHeaderCell({
  numeric,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wide",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100 dark:divide-slate-800", className)} {...props} />;
}

export function TableRow({
  muted,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { muted?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40",
        muted && "text-slate-400 dark:text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  numeric,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn("px-4 py-3", numeric && "text-right tabular-nums", className)}
      {...props}
    />
  );
}
