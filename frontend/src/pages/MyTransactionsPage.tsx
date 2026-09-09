import { useEffect, useMemo, useState } from "react";

import { LoadingScreen } from "../components/LoadingScreen";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { SkeletonRow } from "../components/ui/Skeleton";
import { StatusPill } from "../components/ui/StatusPill";
import { useAuth } from "../features/auth/AuthContext";
import { cn } from "../lib/cn";
import { formatCurrency, formatDate } from "../lib/format";
import { listTransactionsForUser } from "../lib/firebase/transactions";
import type { TransactionRead, TransactionStatus } from "../types/domain";

type Filters = {
  note: string;
  amount: string;
  date_from: string;
  date_to: string;
  status: string;
};

const emptyFilters: Filters = {
  note: "",
  amount: "",
  date_from: "",
  date_to: "",
  status: "",
};

export function MyTransactionsPage() {
  const { user: currentUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRead[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        setTransactions(
          await listTransactionsForUser(currentUser.id, {
            note: filters.note || undefined,
            amount: filters.amount ? Number(filters.amount) : undefined,
            dateFrom: filters.date_from || undefined,
            dateTo: filters.date_to || undefined,
            status: (filters.status || undefined) as TransactionStatus | undefined,
          }),
        );
        setError(null);
      } catch {
        setError("Failed to fetch your transactions.");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, [currentUser, queryString, filters]);

  if (!currentUser) return null;

  if (isLoading && transactions.length === 0 && !error) {
    return <LoadingScreen label="Loading your transactions" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>

      <Card padding="sm" className="grid gap-3 md:grid-cols-5">
        <Input placeholder="Search note" value={filters.note} onChange={(e) => setFilters({ ...filters, note: e.target.value })} />
        <Input placeholder="Amount" type="number" value={filters.amount} onChange={(e) => setFilters({ ...filters, amount: e.target.value })} />
        <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <Card padding="none">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </Card>
        ) : error ? (
          <Card className="text-center text-danger-600 dark:text-danger-400">{error}</Card>
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions found." />
        ) : (
          transactions.map((transaction) => {
            const iPaid = transaction.paid_by_id === currentUser.id;
            const counterparty = iPaid ? transaction.paid_for : transaction.paid_by;
            const amountColor = transaction.is_deleted
              ? "text-slate-400"
              : iPaid
                ? "text-success-600 dark:text-success-400"
                : "text-danger-600 dark:text-danger-400";

            return (
              <Card key={transaction.id} padding="sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={cn("text-base font-semibold tabular-nums", amountColor)}>
                      {iPaid ? "+" : "-"} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {iPaid ? "You paid" : "Paid by"} {counterparty.full_name ?? counterparty.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{transaction.note}</p>
                    {transaction.is_deleted ? (
                      <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                        Deleted: {transaction.deletion_reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</p>
                    <StatusPill status={transaction.is_deleted ? "deleted" : transaction.status} className="mt-1" />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
