import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "../components/Modal";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";
import { AddTransactionForm } from "../features/transactions/AddTransactionForm";
import { getDashboardData } from "../lib/firebase/dashboard";

type UserBalance = {
  user: User;
  balance: number;
};

type ActivityDetails = {
  amount?: number;
};

type DashboardData = {
  net_balance: number;
  total_to_receive: number;
  total_to_pay: number;
  user_balances: UserBalance[];
  recent_activity: {
    id: string;
    action: string;
    details: ActivityDetails | null;
    timestamp: Date | null;
    performed_by: User;
  }[];
  pending_approval_count: number;
};

type SettleTarget = {
  userId: string;
  amount: string;
  iPaid: boolean;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function describeActivity(activity: DashboardData["recent_activity"][number]) {
  const name = activity.performed_by.full_name ?? activity.performed_by.email;
  const amount = activity.details?.amount;
  const amountText = typeof amount === "number" ? ` a ${formatCurrency(amount)}` : " a";

  switch (activity.action) {
    case "CREATE_TRANSACTION":
      return `${name} added${amountText} transaction`;
    case "UPDATE_TRANSACTION":
      return `${name} updated a transaction`;
    case "APPROVE_TRANSACTION":
      return `${name} approved a transaction`;
    case "REJECT_TRANSACTION":
      return `${name} rejected a transaction`;
    case "DELETE_TRANSACTION":
      return `${name} deleted a transaction`;
    default:
      return `${name} ${activity.action.split("_").join(" ").toLowerCase()}`;
  }
}

function UserBalanceRow({
  user,
  balance,
  onSettleUp,
}: {
  user: User;
  balance: number;
  onSettleUp: (user: User, balance: number) => void;
}) {
  const balanceColor = balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-slate-500";
  const balanceSign = balance > 0 ? "+" : "";

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <Link to={`/users/${user.id}`} className="flex flex-1 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
          {user.full_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
        </div>
        <p className="font-medium">{user.full_name ?? user.email}</p>
      </Link>
      <div className="flex items-center gap-3">
        <p className={`font-semibold ${balanceColor}`}>
          {balanceSign}
          {formatCurrency(balance)}
        </p>
        {balance !== 0 ? (
          <button
            type="button"
            onClick={() => onSettleUp(user, balance)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Settle Up
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null);
  const [showSettled, setShowSettled] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsDataLoading(true);
    setError(null);
    try {
      setDashboardData(await getDashboardData(user));
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      setError("Failed to fetch dashboard data.");
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleTransactionSuccess = () => {
    setIsModalOpen(false);
    setSettleTarget(null);
    void fetchData();
  };

  function openAddTransaction() {
    setSettleTarget(null);
    setIsModalOpen(true);
  }

  function openSettleUp(targetUser: User, balance: number) {
    setSettleTarget({
      userId: targetUser.id,
      amount: Math.abs(balance).toFixed(2),
      iPaid: balance < 0,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSettleTarget(null);
  }

  if (isAuthLoading || (isDataLoading && !dashboardData)) {
    return <div className="px-6 py-8">Loading dashboard...</div>;
  }

  if (error || !dashboardData) {
    return <div className="px-6 py-8 text-red-600">{error ?? "Something went wrong."}</div>;
  }

  const { net_balance, total_to_receive, total_to_pay, user_balances } = dashboardData;
  const netBalanceColor = net_balance > 0 ? "text-green-600" : net_balance < 0 ? "text-red-600" : "text-slate-800 dark:text-white";
  const activeBalances = user_balances.filter(({ balance }) => balance !== 0);
  const settledBalances = user_balances.filter(({ balance }) => balance === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-normal">
          {user ? `Welcome, ${user.full_name || user.email}` : "Welcome"}
        </h1>
        {user?.role !== 'admin' && (
        <button
          onClick={openAddTransaction}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add Transaction
        </button>
        )}
      </div>

      {/* Net Balance - hero */}
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-300">Net Balance</p>
        <p className={`mt-2 text-4xl font-bold ${netBalanceColor}`}>{formatCurrency(net_balance)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-300">Total To Receive</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">{formatCurrency(total_to_receive)}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-300">Total To Pay</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{formatCurrency(total_to_pay)}</p>
        </div>
      </div>

      {/* User Balances */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Balances</h2>
        {activeBalances.length > 0 ? (
          <div className="space-y-3">
            {activeBalances.map(({ user: balanceUser, balance }) => (
              <UserBalanceRow key={balanceUser.id} user={balanceUser} balance={balance} onSettleUp={openSettleUp} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p>You have no outstanding balances with other users.</p>
          </div>
        )}

        {settledBalances.length > 0 ? (
          <div className="rounded-md border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setShowSettled((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Settled up ({settledBalances.length})
              <span aria-hidden="true">{showSettled ? "▲" : "▼"}</span>
            </button>
            {showSettled ? (
              <div className="space-y-3 border-t p-4 dark:border-slate-700">
                {settledBalances.map(({ user: balanceUser, balance }) => (
                  <UserBalanceRow key={balanceUser.id} user={balanceUser} balance={balance} onSettleUp={openSettleUp} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        {dashboardData.recent_activity.length > 0 ? (
          <div className="overflow-hidden rounded-md border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {dashboardData.recent_activity.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{describeActivity(activity)}</p>
                <p className="text-sm text-slate-500">
                  {activity.timestamp ? activity.timestamp.toLocaleString() : "-"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p>No recent activity yet.</p>
          </div>
        )}
      </div>


      <Modal isOpen={isModalOpen} onClose={closeModal} title={settleTarget ? "Settle Up" : "Add New Transaction"}>
        <AddTransactionForm
          onSuccess={handleTransactionSuccess}
          initialUserId={settleTarget?.userId}
          initialAmount={settleTarget?.amount}
          initialIPaid={settleTarget?.iPaid}
          initialNote={settleTarget ? "Settlement" : undefined}
        />
      </Modal>
    </div>
  );
}
