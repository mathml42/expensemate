import { useEffect, useState } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { User } from "../features/auth/types";
import { useAuth } from "../features/auth/AuthContext";
import {
  approveTransaction,
  listPendingApprovals,
  rejectTransaction,
} from "../lib/firebase/transactions";

type Transaction = {
  id: string;
  amount: number;
  note: string;
  date: string;
  created_by: User;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function ApprovalCard({ transaction, onUpdate, currentUser }: { transaction: Transaction, onUpdate: () => void, currentUser: User }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      await approveTransaction(transaction.id, currentUser);
      onUpdate();
    } catch (error) {
      alert("Failed to approve transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt("Please provide a reason for rejecting this transaction:");
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await rejectTransaction(transaction.id, reason, currentUser);
      onUpdate();
    } catch (error) {
      alert("Failed to reject transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p>
            <span className="font-semibold">{transaction.created_by.full_name ?? transaction.created_by.email}</span> wants your approval for a transaction.
          </p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(transaction.amount)}</p>
          <p className="mt-1 text-sm text-slate-600">{transaction.note}</p>
        </div>
        <div className="text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString()}</div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? "Processing..." : "Approve"}
        </button>
      </div>
    </div>
  );
}


export function PendingApprovalPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser, user } = useAuth();


  const fetchPendingTransactions = async () => {
    try {
      setIsLoading(true);
      if (!user) return;
      setTransactions(await listPendingApprovals(user.id));
    } catch (err) {
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
    return <div className="px-6 py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-normal">Pending Approvals</h1>
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {user
            ? transactions.map((tx) => (
                <ApprovalCard key={tx.id} transaction={tx} onUpdate={handleUpdate} currentUser={user} />
              ))
            : null}
        </div>
      ) : (
        <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <p>You have no transactions awaiting your approval.</p>
        </div>
      )}
    </div>
  );
}
