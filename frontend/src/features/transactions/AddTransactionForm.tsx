import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { User } from "../auth/types";

type AddTransactionFormProps = {
  onSuccess: () => void;
};

export function AddTransactionForm({ onSuccess }: AddTransactionFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [iPaid, setIPaid] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await apiClient.get<User[]>("/users/");
        setUsers(response.data);
      } catch {
        setError("Failed to load users.");
      }
    }
    void fetchUsers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.post("/transactions/", {
        paid_for_id: parseInt(selectedUserId, 10),
        amount: parseFloat(amount),
        note,
        date,
        i_paid: iPaid,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="user" className="block text-sm font-medium text-slate-700">
          User
        </label>
        <select
          id="user"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select a user
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name ?? user.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          step="0.01"
          min="0.01"
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <fieldset className="flex space-x-4">
        <legend className="sr-only">Transaction direction</legend>
        <div className="flex items-center">
          <input
            id="i-paid"
            name="direction"
            type="radio"
            checked={iPaid}
            onChange={() => setIPaid(true)}
            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="i-paid" className="ml-2 block text-sm text-slate-900">
            I paid for them
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="they-paid"
            name="direction"
            type="radio"
            checked={!iPaid}
            onChange={() => setIPaid(false)}
            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="they-paid" className="ml-2 block text-sm text-slate-900">
            They paid for me
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700">
          Note
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Transaction"}
        </button>
      </div>
    </form>
  );
}
