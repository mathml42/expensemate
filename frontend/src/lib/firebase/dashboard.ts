import { getCountFromServer, getDocs, query, where } from "firebase/firestore";

import { auditLogsCollection, transactionsCollection } from "./collections";
import { getUserById } from "./users";
import type { AuditLogRead, DashboardData, TransactionDocument, UserRead } from "../../types/domain";

async function readRecentActivityForUser(userId: string): Promise<AuditLogRead[]> {
  const snapshot = await getDocs(auditLogsCollection);
  const relevant = snapshot.docs
    .filter((log) => {
      const details = log.data().details;
      return (
        log.data().performed_by_id === userId ||
        details?.paid_by_id === userId ||
        details?.paid_for_id === userId
      );
    })
    .sort((left, right) => {
      const leftTime = left.data().timestamp?.toMillis() ?? 0;
      const rightTime = right.data().timestamp?.toMillis() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 5);

  return Promise.all(
    relevant.map(async (log) => {
      const data = log.data();
      const performedBy = await getUserById(data.performed_by_id);
      if (!performedBy) {
        throw new Error(`Missing audit-log user ${data.performed_by_id}.`);
      }

      return {
        id: log.id,
        action: data.action,
        reason: data.reason,
        details: data.details,
        timestamp: data.timestamp?.toDate() ?? null,
        performed_by: performedBy,
      };
    }),
  );
}

export async function getDashboardData(user: UserRead): Promise<DashboardData> {
  const [paidBySnapshot, paidForSnapshot] = await Promise.all([
    getDocs(
      query(
        transactionsCollection,
        where("paid_by_id", "==", user.id),
        where("status", "==", "approved"),
        where("is_deleted", "==", false),
      ),
    ),
    getDocs(
      query(
        transactionsCollection,
        where("paid_for_id", "==", user.id),
        where("status", "==", "approved"),
        where("is_deleted", "==", false),
      ),
    ),
  ]);

  const transactions = new Map<string, TransactionDocument>();
  for (const item of [...paidBySnapshot.docs, ...paidForSnapshot.docs]) {
    transactions.set(item.id, item.data());
  }

  let totalToReceive = 0;
  let totalToPay = 0;
  const balances = new Map<string, number>();

  for (const transaction of transactions.values()) {
    if (transaction.paid_by_id === user.id) {
      balances.set(
        transaction.paid_for_id,
        (balances.get(transaction.paid_for_id) ?? 0) + transaction.amount,
      );
      totalToReceive += transaction.amount;
    } else {
      balances.set(
        transaction.paid_by_id,
        (balances.get(transaction.paid_by_id) ?? 0) - transaction.amount,
      );
      totalToPay += transaction.amount;
    }
  }

  const [userBalances, recentActivity, pendingApprovalCount] = await Promise.all([
    Promise.all(
      [...balances.entries()].map(async ([userId, balance]) => {
        const balanceUser = await getUserById(userId);
        if (!balanceUser) {
          throw new Error(`Missing balance user ${userId}.`);
        }
        return { user: balanceUser, balance };
      }),
    ),
    readRecentActivityForUser(user.id),
    getCountFromServer(
      query(
        transactionsCollection,
        where("status", "==", "pending"),
        where("paid_for_id", "==", user.id),
        where("is_deleted", "==", false),
      ),
    ).then((count) => count.data().count),
  ]);

  return {
    net_balance: totalToReceive - totalToPay,
    total_to_receive: totalToReceive,
    total_to_pay: totalToPay,
    user_balances: userBalances,
    recent_activity: recentActivity,
    pending_approval_count: pendingApprovalCount,
  };
}
