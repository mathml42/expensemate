import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../features/auth/AuthContext";
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const statusColors: Record<TransactionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-normal">Transactions</h1>

      <div className="grid gap-3 rounded-md border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-5">
        <input
          placeholder="Search note"
          value={filters.note}
          onChange={(e) => setFilters({ ...filters, note: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          placeholder="Amount"
          type="number"
          value={filters.amount}
          onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Loading transactions...
          </div>
        ) : error ? (
          <div className="rounded-md border bg-white p-8 text-center text-red-600 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            No transactions found.
          </div>
        ) : (
          transactions.map((transaction) => {
            const iPaid = transaction.paid_by_id === currentUser.id;
            const counterparty = iPaid ? transaction.paid_for : transaction.paid_by;
            const amountColor = transaction.is_deleted
              ? "text-slate-400 dark:text-slate-400"
              : iPaid
                ? "text-green-600"
                : "text-red-600";

            return (
              <div key={transaction.id} className="rounded-md border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`font-semibold ${amountColor}`}>
                      {iPaid ? "+" : "-"} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {iPaid ? "You paid" : "Paid by"} {counterparty.full_name ?? counterparty.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{transaction.note}</p>
                    {transaction.is_deleted ? (
                      <p className="mt-1 text-sm text-red-600">Deleted: {transaction.deletion_reason}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString()}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusColors[transaction.status]}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
