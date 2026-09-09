import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { LoadingScreen } from "../components/LoadingScreen";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { StatusPill } from "../components/ui/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../components/ui/Table";
import { useToast } from "../components/ui/Toast";
import type { User } from "../features/auth/types";
import { useAuth } from "../features/auth/AuthContext";
import { formatCurrency, formatDate } from "../lib/format";
import { clearAllTransactions, listAllTransactions } from "../lib/firebase/transactions";
import { listUsers } from "../lib/firebase/users";

type Transaction = {
  id: string;
  amount: number;
  note: string;
  date: string;
  status: "pending" | "approved" | "rejected";
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

function AdminTransactionCard({ transaction }: { transaction: Transaction }) {
  return (
    <Card padding="sm" className={transaction.is_deleted ? "opacity-60" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold tabular-nums">{formatCurrency(transaction.amount)}</p>
        <StatusPill status={transaction.is_deleted ? "deleted" : transaction.status} />
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
        <span>{transaction.paid_by.full_name ?? transaction.paid_by.email}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>{transaction.paid_for.full_name ?? transaction.paid_for.email}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{transaction.note}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</p>
    </Card>
  );
}

export function AdminTransactionsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

    setIsClearing(true);
    try {
      setError(null);
      setSuccess(null);
      const deletedCount = await clearAllTransactions(currentUser);
      setTransactions([]);
      const message = `Deleted ${deletedCount} transactions.`;
      setSuccess(message);
      toast({ variant: "success", title: "Transactions cleared", description: message });
      setIsClearOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear transactions.";
      setError(message);
      toast({ variant: "error", title: "Failed to clear transactions", description: message });
    } finally {
      setIsClearing(false);
    }
  }

  if (isLoading && transactions.length === 0 && !error) {
    return <LoadingScreen label="Loading all transactions" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">All Transactions</h1>
        <Button variant="danger-ghost" onClick={() => setIsClearOpen(true)}>
          Clear All Transactions
        </Button>
      </div>

      {error ? <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p> : null}
      {success ? <p className="text-sm text-success-700 dark:text-success-400">{success}</p> : null}

      <Card padding="sm" className="grid gap-3 md:grid-cols-6">
        <Select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.full_name ?? user.email}</option>
          ))}
        </Select>
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

      {transactions.length === 0 && !isLoading ? (
        <EmptyState title="No transactions found." />
      ) : (
        <>
          {/* Table view — tablet and up */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell numeric>Amount</TableHeaderCell>
                  <TableHeaderCell>Paid By</TableHeaderCell>
                  <TableHeaderCell>Paid For</TableHeaderCell>
                  <TableHeaderCell>Note</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell className="text-slate-500 dark:text-slate-400" colSpan={6}>
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} muted={transaction.is_deleted}>
                      <TableCell className="text-xs">{formatDate(transaction.date)}</TableCell>
                      <TableCell numeric>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>{transaction.paid_by.full_name ?? transaction.paid_by.email}</TableCell>
                      <TableCell>{transaction.paid_for.full_name ?? transaction.paid_for.email}</TableCell>
                      <TableCell>{transaction.note}</TableCell>
                      <TableCell>
                        <StatusPill status={transaction.is_deleted ? "deleted" : transaction.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Card-stack view — mobile */}
          <div className="space-y-3 md:hidden">
            {isLoading ? (
              <Card className="text-sm text-slate-500 dark:text-slate-400">Loading transactions...</Card>
            ) : (
              transactions.map((transaction) => <AdminTransactionCard key={transaction.id} transaction={transaction} />)
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={() => void handleClearAll()}
        title="Clear all transactions"
        description="This permanently deletes every transaction for every user. This cannot be undone."
        confirmLabel="Delete everything"
        variant="danger"
        isLoading={isClearing}
        requireTypedConfirmation="CLEAR TRANSACTIONS"
      />
    </div>
  );
}
