import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Plus } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingScreen } from "../components/LoadingScreen";
import { Modal } from "../components/Modal";
import { useAuth } from "../features/auth/AuthContext";
import { User } from "../features/auth/types";
import { AddTransactionForm } from "../features/transactions/AddTransactionForm";
import { SplitGroupForm } from "../features/transactions/SplitGroupForm";
import { getDashboardData } from "../lib/firebase/dashboard";
import { cn } from "../lib/cn";
import { formatCurrency, formatDate } from "../lib/format";

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
  const balanceColor =
    balance > 0
      ? "text-success-600 dark:text-success-400"
      : balance < 0
        ? "text-danger-600 dark:text-danger-400"
        : "text-slate-500 dark:text-slate-400";
  const balanceSign = balance > 0 ? "+" : "";
  const balanceLabel = balance > 0 ? "owes you" : balance < 0 ? "you owe" : "settled";

  return (
    <Card interactive padding="sm" className="flex items-center justify-between gap-3">
      <Link to={`/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
          {user.full_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{user.full_name ?? user.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{balanceLabel}</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <p className={cn("text-sm font-semibold tabular-nums", balanceColor)}>
          {balanceSign}
          {formatCurrency(balance)}
        </p>
        {balance !== 0 ? (
          <Button size="sm" variant="secondary" onClick={() => onSettleUp(user, balance)}>
            Settle Up
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null);
  const [addMode, setAddMode] = useState<"single" | "group">("single");
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
    setAddMode("single");
    setIsModalOpen(true);
  }

  function openSettleUp(targetUser: User, balance: number) {
    setSettleTarget({
      userId: targetUser.id,
      amount: Math.abs(balance).toFixed(2),
      iPaid: balance < 0,
    });
    setAddMode("single");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSettleTarget(null);
  }

  if (isAuthLoading || (isDataLoading && !dashboardData)) {
    return <LoadingScreen label="Loading your dashboard" />;
  }

  if (error || !dashboardData) {
    return <div className="px-6 py-8 text-danger-600 dark:text-danger-400">{error ?? "Something went wrong."}</div>;
  }

  const { net_balance, total_to_receive, total_to_pay, user_balances } = dashboardData;
  const isPositive = net_balance > 0;
  const isNegative = net_balance < 0;
  const netBalanceColor = isPositive
    ? "text-success-600 dark:text-success-400"
    : isNegative
      ? "text-danger-600 dark:text-danger-400"
      : "text-slate-900 dark:text-white";
  const netBalanceAccent = isPositive
    ? "before:bg-success-600 dark:before:bg-success-400"
    : isNegative
      ? "before:bg-danger-600 dark:before:bg-danger-400"
      : "before:bg-slate-300 dark:before:bg-slate-700";
  const netBalanceSubtext = isPositive
    ? `You will receive ${formatCurrency(net_balance)}`
    : isNegative
      ? `You owe ${formatCurrency(Math.abs(net_balance))}`
      : "You're all settled up";
  const activeBalances = user_balances.filter(({ balance }) => balance !== 0);
  const settledBalances = user_balances.filter(({ balance }) => balance === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {user ? `Welcome, ${user.full_name || user.email}` : "Welcome"}
        </h1>
        {user?.role !== "admin" && (
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAddTransaction}>
            Add Transaction
          </Button>
        )}
      </div>

      <Card
        padding="lg"
        className={cn(
          "relative animate-fade-in-up overflow-hidden pl-7 before:absolute before:inset-y-0 before:left-0 before:w-1.5",
          netBalanceAccent,
        )}
      >
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Net Balance</p>
        <p className={cn("mt-2 text-4xl font-bold tabular-nums sm:text-5xl", netBalanceColor)}>
          {isPositive ? "+" : ""}
          {formatCurrency(net_balance)}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{netBalanceSubtext}</p>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="animate-fade-in-up border-success-200 dark:border-success-900/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total To Receive
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-400/10 dark:text-success-400">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-success-600 dark:text-success-400">
            {formatCurrency(total_to_receive)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Money coming to you</p>
        </Card>
        <Card className="animate-fade-in-up border-danger-200 dark:border-danger-900/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total To Pay
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-100 text-danger-700 dark:bg-danger-400/10 dark:text-danger-400">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-danger-600 dark:text-danger-400">
            {formatCurrency(total_to_pay)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Money you need to pay</p>
        </Card>
      </div>

      {/* User Balances */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Your Balances</h2>
        {activeBalances.length > 0 ? (
          <div className="space-y-2">
            {activeBalances.map(({ user: balanceUser, balance }) => (
              <UserBalanceRow key={balanceUser.id} user={balanceUser} balance={balance} onSettleUp={openSettleUp} />
            ))}
          </div>
        ) : (
          <EmptyState title="You have no outstanding balances with other users." />
        )}

        {settledBalances.length > 0 ? (
          <Card padding="none">
            <button
              type="button"
              onClick={() => setShowSettled((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Settled up ({settledBalances.length})
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200 ease-emphasized", showSettled && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-emphasized",
                showSettled ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="space-y-2 border-t border-slate-100 p-3 dark:border-slate-800">
                  {settledBalances.map(({ user: balanceUser, balance }) => (
                    <UserBalanceRow key={balanceUser.id} user={balanceUser} balance={balance} onSettleUp={openSettleUp} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Recent Activity</h2>
        {dashboardData.recent_activity.length > 0 ? (
          <Card padding="none">
            {dashboardData.recent_activity.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm">{describeActivity(activity)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.timestamp ? formatDate(activity.timestamp, "datetime") : "-"}
                </p>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState title="No recent activity yet." />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={settleTarget ? "Settle Up" : addMode === "group" ? "Split with Group" : "Add New Transaction"}
      >
        {!settleTarget ? (
          <div className="mb-4 flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setAddMode("single")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                addMode === "single"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              Pay Someone
            </button>
            <button
              type="button"
              onClick={() => setAddMode("group")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                addMode === "group"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              Split with Group
            </button>
          </div>
        ) : null}

        {addMode === "group" && !settleTarget ? (
          <SplitGroupForm onSuccess={handleTransactionSuccess} />
        ) : (
          <AddTransactionForm
            onSuccess={handleTransactionSuccess}
            initialUserId={settleTarget?.userId}
            initialAmount={settleTarget?.amount}
            initialIPaid={settleTarget?.iPaid}
            initialNote={settleTarget ? "Settlement" : undefined}
          />
        )}
      </Modal>
    </div>
  );
}
