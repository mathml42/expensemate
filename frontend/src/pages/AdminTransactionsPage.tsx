import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import type { User } from "../features/auth/types";
import { useAuth } from "../features/auth/AuthContext";
import { clearAllTransactions, listAllTransactions } from "../lib/firebase/transactions";
import { listUsers } from "../lib/firebase/users";

type Transaction = {
  id: string;
  amount: number;
  note: string;
  date: string;
  status: string;
  is_deleted: boolean;
  paid_by: User;
  paid_for: User;
  created_by: User;
};

const emptyFilters = {
  user_id: "",
  note: "",
  amount: "",
  date_from: "",
  date_to: "",
  status: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

export function AdminTransactionsPage() {
  const { user: currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    async function fetchUsers() {
      setUsers(await listUsers());
    }
    void fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setTransactions(
          await listAllTransactions({
            userId: filters.user_id || undefined,
            note: filters.note || undefined,
            amount: filters.amount ? Number(filters.amount) : undefined,
            dateFrom: filters.date_from || undefined,
            dateTo: filters.date_to || undefined,
            status: filters.status as "pending" | "approved" | "rejected" | undefined,
          }),
        );
        setError(null);
      } catch {
        setError("Failed to load transactions.");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchTransactions();
  }, [queryString, filters]);

  async function handleClearAll() {
    if (!currentUser) return;

    const confirmation = window.prompt(
      "This permanently deletes every transaction. Type CLEAR TRANSACTIONS to continue.",
    );
    if (confirmation !== "CLEAR TRANSACTIONS") return;

    try {
      setError(null);
      setSuccess(null);
      const deletedCount = await clearAllTransactions(currentUser);
      setTransactions([]);
      setSuccess(`Deleted ${deletedCount} transactions.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear transactions.");
    }
  }

  if (isLoading && transactions.length === 0 && !error) {
    return <LoadingScreen label="Loading all transactions" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-normal">All Transactions</h1>
        <button
          type="button"
          onClick={() => void handleClearAll()}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Clear All Transactions
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <div className="grid gap-3 rounded-md border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-6">
        <select
          value={filters.user_id}
          onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.full_name ?? user.email}</option>
          ))}
        </select>
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

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Paid By</th>
              <th className="px-4 py-3 font-medium">Paid For</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td className="px-4 py-4 text-slate-500 dark:text-slate-300" colSpan={6}>Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td className="px-4 py-4 text-slate-500 dark:text-slate-300" colSpan={6}>No transactions found.</td></tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className={transaction.is_deleted ? "text-slate-400" : ""}>
                  <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(transaction.amount)}</td>
                  <td className="px-4 py-3">{transaction.paid_by.full_name ?? transaction.paid_by.email}</td>
                  <td className="px-4 py-3">{transaction.paid_for.full_name ?? transaction.paid_for.email}</td>
                  <td className="px-4 py-3">{transaction.note}</td>
                  <td className="px-4 py-3 capitalize">{transaction.is_deleted ? "deleted" : transaction.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
