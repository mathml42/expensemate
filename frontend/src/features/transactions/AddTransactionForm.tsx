import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { User } from "../auth/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { createTransaction } from "../../lib/firebase/transactions";
import { listUsers } from "../../lib/firebase/users";

type AddTransactionFormProps = {
  onSuccess: () => void;
  initialUserId?: string;
  initialAmount?: string;
  initialNote?: string;
  initialIPaid?: boolean;
};

export function AddTransactionForm({
  onSuccess,
  initialUserId = "",
  initialAmount = "",
  initialNote = "",
  initialIPaid = true,
}: AddTransactionFormProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [amount, setAmount] = useState(initialAmount);
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [iPaid, setIPaid] = useState(initialIPaid);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const allUsers = await listUsers();
        setUsers(
          allUsers.filter(
            (user) =>
              user.id !== currentUser?.id &&
              user.is_active &&
              user.role !== "admin"
          )
        );
      } catch {
        setError("Failed to load users.");
      }
    }
    void fetchUsers();
  }, [currentUser?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!currentUser) throw new Error("You must be signed in.");
      await createTransaction({
        paid_for_id: selectedUserId,
        amount: parseFloat(amount),
        note,
        date,
        i_paid: iPaid,
      }, currentUser);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="User" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required>
        <option value="" disabled>
          Select a user
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.full_name ?? user.email}
          </option>
        ))}
      </Select>

      <Input
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        step="0.01"
        min="0.01"
      />

      <fieldset className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
        <legend className="sr-only">Transaction direction</legend>
        <div className="flex items-center gap-2">
          <input
            id="i-paid"
            name="direction"
            type="radio"
            checked={iPaid}
            onChange={() => setIPaid(true)}
            className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-500"
          />
          <label htmlFor="i-paid" className="block text-sm text-slate-900 dark:text-slate-100">
            I paid for them
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="they-paid"
            name="direction"
            type="radio"
            checked={!iPaid}
            onChange={() => setIPaid(false)}
            className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-500"
          />
          <label htmlFor="they-paid" className="block text-sm text-slate-900 dark:text-slate-100">
            They paid for me
          </label>
        </div>
      </fieldset>

      <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} required rows={3} />

      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

      {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
}
