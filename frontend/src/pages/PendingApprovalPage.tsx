import { useEffect, useState } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/Toast";
import { User } from "../features/auth/types";
import { useAuth } from "../features/auth/AuthContext";
import { formatCurrency, formatDate } from "../lib/format";
import {
  approveTransaction,
  listPendingApprovals,
  rejectTransaction,
} from "../lib/firebase/transactions";
import type { TransactionRead } from "../types/domain";

function ApprovalCard({
  transaction,
  onUpdate,
  currentUser,
}: {
  transaction: TransactionRead;
  onUpdate: () => void;
  currentUser: User;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const youOwe = transaction.paid_for_id === currentUser.id;
  const counterparty = youOwe ? transaction.paid_by : transaction.paid_for;
  const isCrossTransaction = transaction.created_by_id !== transaction.paid_by_id
    && transaction.created_by_id !== transaction.paid_for_id;

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      await approveTransaction(transaction.id, currentUser);
      onUpdate();
    } catch {
      toast({ variant: "error", title: "Failed to approve transaction." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await rejectTransaction(transaction.id, reason, currentUser);
      setIsRejectOpen(false);
      setReason("");
      onUpdate();
    } catch {
      toast({ variant: "error", title: "Failed to reject transaction." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm">
            {youOwe ? (
              <>
                You owe{" "}
                <span className="font-semibold">{counterparty.full_name ?? counterparty.email}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">{counterparty.full_name ?? counterparty.email}</span> owes you
              </>
            )}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(transaction.amount)}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{transaction.note}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Requested by {transaction.created_by.full_name ?? transaction.created_by.email}
            {isCrossTransaction ? " as part of a group split — the other person also needs to confirm." : ""}
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setIsRejectOpen(true)} disabled={isSubmitting}>
          Reject
        </Button>
        <Button variant="success" onClick={() => void handleApprove()} isLoading={isSubmitting}>
          {isSubmitting ? "Processing..." : "Approve"}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setReason("");
        }}
        onConfirm={() => void handleReject()}
        title="Reject transaction"
        description="Let them know why you're rejecting this so it's clear when they look back at it."
        confirmLabel="Reject transaction"
        variant="danger"
        isLoading={isSubmitting}
        confirmDisabled={!reason.trim()}
      >
        <Textarea
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          autoFocus
          placeholder="e.g. This amount looks wrong"
        />
      </ConfirmDialog>
    </Card>
  );
}


export function PendingApprovalPage() {
  const [transactions, setTransactions] = useState<TransactionRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser, user } = useAuth();


  const fetchPendingTransactions = async () => {
    try {
      setIsLoading(true);
      if (!user) return;
      setTransactions(await listPendingApprovals(user.id));
    } catch {
      setError("Failed to fetch pending approvals.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPendingTransactions();
  }, [user]);

  const handleUpdate = () => {
    void fetchPendingTransactions();
    void refreshUser(); // Refresh user to update dashboard balances
  };

  if (isLoading) {
    return <LoadingScreen label="Loading pending approvals" />;
  }

  if (error) {
    return <div className="px-6 py-8 text-danger-600 dark:text-danger-400">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Pending Approvals</h1>
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {user
            ? transactions.map((tx) => (
                <ApprovalCard key={tx.id} transaction={tx} onUpdate={handleUpdate} currentUser={user} />
              ))
            : null}
        </div>
      ) : (
        <EmptyState title="You have no transactions awaiting your approval." />
      )}
    </div>
  );
}
