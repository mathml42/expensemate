import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { User } from "../auth/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { createGroupTransaction } from "../../lib/firebase/transactions";
import { listUsers } from "../../lib/firebase/users";
import { formatCurrency } from "../../lib/format";
import { computeGroupSettlement, type GroupPayment } from "./settleGroup";

type SplitGroupFormProps = {
  onSuccess: () => void;
};

export function SplitGroupForm({ onSuccess }: SplitGroupFormProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [yourPaidInput, setYourPaidInput] = useState("");
  const [friendPaid, setFriendPaid] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const allUsers = await listUsers();
        setUsers(
          allUsers.filter(
            (user) => user.id !== currentUser?.id && user.is_active && user.role !== "admin",
          ),
        );
      } catch {
        setError("Failed to load users.");
      }
    }
    void fetchUsers();
  }, [currentUser?.id]);

  function toggleUser(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  const participants = users.filter((user) => selectedIds.includes(user.id));
  const totalPeople = participants.length + 1;
  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    if (currentUser) map.set(currentUser.id, currentUser);
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users, currentUser]);

  const payments: GroupPayment[] = useMemo(() => {
    if (!currentUser) return [];
    return [
      { userId: currentUser.id, amountPaid: parseFloat(yourPaidInput) || 0 },
      ...participants.map((p) => ({ userId: p.id, amountPaid: parseFloat(friendPaid[p.id]) || 0 })),
    ];
  }, [currentUser, yourPaidInput, participants, friendPaid]);

  const total = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const hasValidSplit = currentUser && total > 0 && participants.length > 0;
  const edges = useMemo(() => {
    if (!hasValidSplit) return [];
    return computeGroupSettlement(payments);
  }, [hasValidSplit, payments]);

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (participants.length === 0) {
      setError("Select at least one friend to split with.");
      return;
    }
    if (total <= 0) {
      setError("Enter how much at least one person paid.");
      return;
    }
    if (!note.trim()) {
      setError("Add a note.");
      return;
    }
    if (edges.length === 0) {
      setError("Everyone already paid their equal share — nothing to settle.");
      return;
    }

    setStep("preview");
  }

  async function handleConfirm() {
    setError("");
    setIsSubmitting(true);
    try {
      if (!currentUser) throw new Error("You must be signed in.");
      for (const edge of edges) {
        await createGroupTransaction(
          {
            paidById: edge.toUserId,
            paidForId: edge.fromUserId,
            amount: edge.amount,
            note: note.trim(),
            date,
          },
          currentUser,
        );
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create split transactions.");
      setIsSubmitting(false);
    }
  }

  function nameFor(userId: string) {
    if (userId === currentUser?.id) return "You";
    return usersById.get(userId)?.full_name ?? usersById.get(userId)?.email ?? "Someone";
  }

  if (step === "preview") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold">{formatCurrency(total)}</span> total for{" "}
          <span className="font-semibold">{note}</span>, split {totalPeople} ways. Here's who pays whom to settle
          it:
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {edges.map((edge, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-slate-700"
            >
              <span className="text-sm">
                <span className="font-medium">{nameFor(edge.fromUserId)}</span>
                <span className="text-slate-500 dark:text-slate-400"> owes </span>
                <span className="font-medium">{nameFor(edge.toUserId)}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-danger-600 dark:text-danger-400">
                {formatCurrency(edge.amount)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Each of these will be sent as a pending transaction request awaiting approval from the person who owes
          money.
        </p>

        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setStep("form")} disabled={isSubmitting}>
            Back
          </Button>
          <Button variant="primary" onClick={() => void handleConfirm()} isLoading={isSubmitting}>
            {isSubmitting ? "Sending..." : `Send ${edges.length} request${edges.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Split with</label>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-2 dark:border-slate-600">
          {users.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-slate-500">No other users found.</p>
          ) : (
            users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-500"
                />
                {user.full_name ?? user.email}
              </label>
            ))
          )}
        </div>
      </div>

      {participants.length > 0 ? (
        <div className="space-y-2 rounded-md border border-slate-300 p-3 dark:border-slate-600">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">How much did each person pay?</p>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">You</span>
            <Input
              type="number"
              value={yourPaidInput}
              onChange={(e) => setYourPaidInput(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0"
              size="sm"
              className="w-28 text-right"
            />
          </div>

          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{participant.full_name ?? participant.email}</span>
              <Input
                type="number"
                value={friendPaid[participant.id] ?? ""}
                onChange={(e) => setFriendPaid((current) => ({ ...current, [participant.id]: e.target.value }))}
                step="0.01"
                min="0"
                placeholder="0"
                size="sm"
                className="w-28 text-right"
              />
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
            <span className="font-medium">Total</span>
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>
          {total > 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Split {totalPeople} ways — {formatCurrency(total / totalPeople)} each
            </p>
          ) : null}
        </div>
      ) : null}

      <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} required rows={3} />

      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

      {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary">
          Review Split
        </Button>
      </div>
    </form>
  );
}
