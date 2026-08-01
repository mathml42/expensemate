import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { Modal } from "../components/Modal";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";
import { AddTransactionForm } from "../features/transactions/AddTransactionForm";

// ... (rest of the types and components remain the same)
type UserBalance = {
  user: User;
  balance: number;
};

type DashboardData = {
  net_balance: number;
  total_to_receive: number;
  total_to_pay: number;
  user_balances: UserBalance[];
  recent_activity: {
    id: number;
    action: string;
    timestamp: string;
    performed_by: User;
  }[];
  pending_approval_count: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function BalanceCard({ title, amount, colorClass }: { title: string; amount: number; colorClass: string }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-semibold ${colorClass}`}>{formatCurrency(amount)}</p>
    </div>
  );
}

function UserBalanceRow({ user, balance }: { user: User; balance: number }) {
  const balanceColor = balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-slate-500";
  const balanceSign = balance > 0 ? "+" : "";

  return (
    <Link
      to={`/users/${user.id}`}
      className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
    >
      <div className="flex items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
          {user.full_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
        </div>
        <p className="ml-4 font-medium">{user.full_name ?? user.email}</p>
      </div>
      <p className={`font-semibold ${balanceColor}`}>
        {balanceSign}
        {formatCurrency(balance)}
      </p>
    </Link>
  );
}


export function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<DashboardData>("/dashboard/");
      setDashboardData(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  
  const handleTransactionSuccess = () => {
    setIsModalOpen(false);
    void fetchData();
  };

  if (isLoading && !dashboardData) { // Show initial loading state only on first load
    return <div className="px-6 py-8">Loading dashboard...</div>;
  }

  if (error || !dashboardData) {
    return <div className="px-6 py-8 text-red-600">{error ?? "Something went wrong."}</div>;
  }

  const { net_balance, total_to_receive, total_to_pay, user_balances } = dashboardData;
  const netBalanceColor = net_balance > 0 ? "text-green-600" : net_balance < 0 ? "text-red-600" : "text-slate-800";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        {user?.role !== 'admin' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Transaction
        </button>
        )}
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <BalanceCard title="Net Balance" amount={net_balance} colorClass={netBalanceColor} />
        <BalanceCard title="Total To Receive" amount={total_to_receive} colorClass="text-green-600" />
        <BalanceCard title="Total To Pay" amount={total_to_pay} colorClass="text-red-600" />
      </div>

      <Link
        to="/pending-approvals"
        className="block rounded-md border bg-white p-4 shadow-sm transition hover:border-blue-500"
      >
        <p className="text-sm text-slate-500">Pending Approval Count</p>
        <p className="mt-1 text-2xl font-semibold">{dashboardData.pending_approval_count}</p>
      </Link>

      {/* User Balances */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Balances</h2>
        {user_balances.length > 0 ? (
          <div className="space-y-3">
            {user_balances.map(({ user, balance }) => (
              <UserBalanceRow key={user.id} user={user} balance={balance} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm">
            <p>You have no balances with other users yet.</p>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        {dashboardData.recent_activity.length > 0 ? (
          <div className="overflow-hidden rounded-md border bg-white shadow-sm">
            {dashboardData.recent_activity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0">
                <div>
                  <p className="font-medium">{activity.action.split("_").join(" ").toLowerCase()}</p>
                  <p className="text-sm text-slate-500">
                    by {activity.performed_by.full_name ?? activity.performed_by.email}
                  </p>
                </div>
                <p className="text-sm text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm">
            <p>No recent activity yet.</p>
          </div>
        )}
      </div>


      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Transaction">
        <AddTransactionForm onSuccess={handleTransactionSuccess} />
      </Modal>
    </div>
  );
}
