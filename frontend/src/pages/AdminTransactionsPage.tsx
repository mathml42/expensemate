import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client";
import type { User } from "../features/auth/types";

type Transaction = {
  id: number;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    async function fetchUsers() {
      const response = await apiClient.get<User[]>("/users/");
      setUsers(response.data);
    }
    void fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      const response = await apiClient.get<Transaction[]>(`/transactions/all${queryString ? `?${queryString}` : ""}`);
      setTransactions(response.data);
      setIsLoading(false);
    }
    void fetchTransactions();
  }, [queryString]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-normal">All Transactions</h1>

      <div className="grid gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-6">
        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} className="rounded-md border px-3 py-2">
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.full_name ?? user.email}</option>
          ))}
        </select>
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

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
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
              <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>No transactions found.</td></tr>
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
