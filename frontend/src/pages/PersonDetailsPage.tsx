import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";
import {
  listTransactionsForUser,
  softDeleteTransaction,
  updateTransaction,
} from "../lib/firebase/transactions";
import { getUserById } from "../lib/firebase/users";

type Transaction = {
  id: string;
  amount: number;
  note: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  is_deleted: boolean;
  deletion_reason: string | null;
  paid_by_id: string;
  paid_for_id: string;
  created_by_id: string;
};

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

const statusColors: Record<Transaction["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function PersonDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [person, setPerson] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", note: "", date: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  async function fetchData() {
    if (!userId) return;
    try {
      setIsLoading(true);
      if (!currentUser) return;
      const [personData, transactionData] = await Promise.all([
        getUserById(userId),
        listTransactionsForUser(currentUser.id, {
          otherUserId: userId,
          note: filters.note || undefined,
          amount: filters.amount ? Number(filters.amount) : undefined,
          dateFrom: filters.date_from || undefined,
          dateTo: filters.date_to || undefined,
          status: filters.status as "pending" | "approved" | "rejected" | undefined,
        }),
      ]);
      setPerson(personData);
      setTransactions(transactionData);
      setError(null);
    } catch {
      setError("Failed to fetch data for this person.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, [userId, queryString, currentUser]);

  function startEdit(transaction: Transaction) {
    setEditing(transaction);
    setEditForm({
      amount: String(transaction.amount),
      note: transaction.note,
      date: transaction.date,
    });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    if (!currentUser) return;
    await updateTransaction(editing.id, {
      amount: parseFloat(editForm.amount),
      note: editForm.note,
      date: editForm.date,
    }, currentUser);
    setEditing(null);
    await fetchData();
  }

  async function deleteTransaction(transaction: Transaction) {
    const reason = window.prompt("Reason for deleting this transaction:");
    if (!reason) return;
    if (!currentUser) return;
    await softDeleteTransaction(transaction.id, reason, currentUser);
    await fetchData();
  }

  if (isLoading && !person) return <LoadingScreen label="Loading transaction history" />;
  if (error || !person || !currentUser) {
    return <div className="px-6 py-8 text-red-600">{error ?? "Could not load details."}</div>;
  }

  const balance = transactions.reduce((acc, t) => {
    if (t.status !== "approved" || t.is_deleted) return acc;
    return t.paid_by_id === currentUser.id ? acc + t.amount : acc - t.amount;
  }, 0);
  const balanceColor = balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-slate-800 dark:text-white";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">{person.full_name ?? person.email}</h1>
        <p className="mt-1 text-lg text-slate-700 dark:text-slate-300">
          Current Balance: <span className={`font-semibold ${balanceColor}`}>{formatCurrency(balance)}</span>
        </p>
      </div>

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

      {editing ? (
        <form onSubmit={saveEdit} className="grid gap-3 rounded-md border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-4">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            value={editForm.note}
            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex gap-2">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm font-medium">Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        {transactions.map((transaction) => {
          const isOwed = transaction.paid_for_id === currentUser.id;
          const amountColor = transaction.is_deleted ? "text-slate-400 dark:text-slate-400" : isOwed ? "text-red-600" : "text-green-600";
          const canManage = transaction.created_by_id === currentUser.id && !transaction.is_deleted;
          return (
            <div key={transaction.id} className="rounded-md border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={`font-semibold ${amountColor}`}>{isOwed ? "-" : "+"} {formatCurrency(transaction.amount)}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{transaction.note}</p>
                  {transaction.is_deleted ? <p className="mt-1 text-sm text-red-600">Deleted: {transaction.deletion_reason}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusColors[transaction.status]}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              {canManage ? (
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => startEdit(transaction)} className="rounded-md border px-3 py-1.5 text-sm font-medium">Edit</button>
                  <button onClick={() => void deleteTransaction(transaction)} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700">Delete</button>
                </div>
              ) : null}
            </div>
          );
        })}
        {transactions.length === 0 ? (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">No transactions found.</div>
        ) : null}
      </div>
    </div>
  );
}
