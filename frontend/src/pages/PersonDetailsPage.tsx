import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";

type Transaction = {
  id: number;
  amount: number;
  note: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  is_deleted: boolean;
  deletion_reason: string | null;
  paid_by_id: number;
  paid_for_id: number;
  created_by_id: number;
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
      const url = `/transactions/with/${userId}${queryString ? `?${queryString}` : ""}`;
      const [personRes, transactionsRes] = await Promise.all([
        apiClient.get<User>(`/users/${userId}`),
        apiClient.get<Transaction[]>(url),
      ]);
      setPerson(personRes.data);
      setTransactions(transactionsRes.data);
      setError(null);
    } catch {
      setError("Failed to fetch data for this person.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, [userId, queryString]);

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
    await apiClient.patch(`/transactions/${editing.id}`, {
      amount: parseFloat(editForm.amount),
      note: editForm.note,
      date: editForm.date,
    });
    setEditing(null);
    await fetchData();
  }

  async function deleteTransaction(transaction: Transaction) {
    const reason = window.prompt("Reason for deleting this transaction:");
    if (!reason) return;
    await apiClient.delete(`/transactions/${transaction.id}`, { data: { reason } });
    await fetchData();
  }

  if (isLoading && !person) return <div className="px-6 py-8">Loading details...</div>;
  if (error || !person || !currentUser) {
    return <div className="px-6 py-8 text-red-600">{error ?? "Could not load details."}</div>;
  }

  const balance = transactions.reduce((acc, t) => {
    if (t.status !== "approved" || t.is_deleted) return acc;
    return t.paid_by_id === currentUser.id ? acc + t.amount : acc - t.amount;
  }, 0);
  const balanceColor = balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-slate-800";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{person.full_name ?? person.email}</h1>
        <p className="mt-1 text-lg">
          Current Balance: <span className={`font-semibold ${balanceColor}`}>{formatCurrency(balance)}</span>
        </p>
      </div>

      <div className="grid gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-5">
        <input placeholder="Search note" value={filters.note} onChange={(e) => setFilters({ ...filters, note: e.target.value })} className="rounded-md border px-3 py-2" />
        <input placeholder="Amount" type="number" value={filters.amount} onChange={(e) => setFilters({ ...filters, amount: e.target.value })} className="rounded-md border px-3 py-2" />
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="rounded-md border px-3 py-2" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="rounded-md border px-3 py-2" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-md border px-3 py-2">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="grid gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-4">
          <input type="number" min="0.01" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="rounded-md border px-3 py-2" />
          <input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className="rounded-md border px-3 py-2" />
          <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="rounded-md border px-3 py-2" />
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
          const amountColor = transaction.is_deleted ? "text-slate-400" : isOwed ? "text-red-600" : "text-green-600";
          const canManage = transaction.created_by_id === currentUser.id && !transaction.is_deleted;
          return (
            <div key={transaction.id} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-semibold ${amountColor}`}>{isOwed ? "-" : "+"} {formatCurrency(transaction.amount)}</p>
                  <p className="mt-1 text-sm text-slate-600">{transaction.note}</p>
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
          <div className="rounded-md border bg-white p-8 text-center text-slate-500">No transactions found.</div>
        ) : null}
      </div>
    </div>
  );
}
