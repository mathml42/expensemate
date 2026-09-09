import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { StatusPill } from "../components/ui/StatusPill";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";
import { formatCurrency, formatDate } from "../lib/format";
import { cn } from "../lib/cn";
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

export function PersonDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [person, setPerson] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", note: "", date: "" });
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function confirmDelete() {
    if (!deletingTransaction || !currentUser || !deleteReason.trim()) return;
    setIsDeleting(true);
    try {
      await softDeleteTransaction(deletingTransaction.id, deleteReason, currentUser);
      setDeletingTransaction(null);
      setDeleteReason("");
      await fetchData();
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading && !person) return <LoadingScreen label="Loading transaction history" />;
  if (error || !person || !currentUser) {
    return <div className="px-6 py-8 text-danger-600 dark:text-danger-400">{error ?? "Could not load details."}</div>;
  }

  const balance = transactions.reduce((acc, t) => {
    if (t.status !== "approved" || t.is_deleted) return acc;
    return t.paid_by_id === currentUser.id ? acc + t.amount : acc - t.amount;
  }, 0);
  const balanceColor =
    balance > 0
      ? "text-success-600 dark:text-success-400"
      : balance < 0
        ? "text-danger-600 dark:text-danger-400"
        : "text-slate-800 dark:text-white";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          {person.full_name ?? person.email}
        </h1>
        <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
          Current Balance:{" "}
          <span className={cn("font-semibold tabular-nums", balanceColor)}>{formatCurrency(balance)}</span>
        </p>
      </div>

      <Card padding="sm" className="grid gap-3 md:grid-cols-5">
        <Input
          placeholder="Search note"
          value={filters.note}
          onChange={(e) => setFilters({ ...filters, note: e.target.value })}
        />
        <Input
          placeholder="Amount"
          type="number"
          value={filters.amount}
          onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
        />
        <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Card>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:grid-cols-4"
        >
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
          />
          <Input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Transaction History</h2>
        {transactions.map((transaction) => {
          const isOwed = transaction.paid_for_id === currentUser.id;
          const amountColor = transaction.is_deleted
            ? "text-slate-400"
            : isOwed
              ? "text-danger-600 dark:text-danger-400"
              : "text-success-600 dark:text-success-400";
          const canManage = transaction.created_by_id === currentUser.id && !transaction.is_deleted;
          return (
            <Card key={transaction.id} padding="sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={cn("text-base font-semibold tabular-nums", amountColor)}>
                    {isOwed ? "-" : "+"} {formatCurrency(transaction.amount)}
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
                  <StatusPill
                    status={transaction.is_deleted ? "deleted" : transaction.status}
                    className="mt-1"
                  />
                </div>
              </div>
              {canManage ? (
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(transaction)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger-ghost" onClick={() => setDeletingTransaction(transaction)}>
                    Delete
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
        {transactions.length === 0 ? <EmptyState title="No transactions found." /> : null}
      </div>

      <ConfirmDialog
        isOpen={deletingTransaction !== null}
        onClose={() => {
          setDeletingTransaction(null);
          setDeleteReason("");
        }}
        onConfirm={() => void confirmDelete()}
        title="Delete transaction"
        description="This transaction will be marked deleted and excluded from balances."
        confirmLabel="Delete transaction"
        variant="danger"
        isLoading={isDeleting}
        confirmDisabled={!deleteReason.trim()}
      >
        <Textarea
          label="Reason"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          rows={3}
          placeholder="e.g. Duplicate entry"
        />
      </ConfirmDialog>
    </div>
  );
}
