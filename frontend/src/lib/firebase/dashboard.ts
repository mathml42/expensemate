import { getCountFromServer, getDocs, query, where, or, orderBy, limit, and } from "firebase/firestore";

import { auditLogsCollection, transactionsCollection } from "./collections";
import { getUserById } from "./users";
import type { AuditLogRead, DashboardData, TransactionDocument, UserRead } from "../../types/domain";

async function readRecentActivityForUser(userId: string): Promise<AuditLogRead[]> {
  const snapshot = await getDocs(query(
    auditLogsCollection,
    where("performed_by_id", "==", userId),
    orderBy("timestamp", "desc"),
    limit(5),
  ));

  return Promise.all(
    snapshot.docs.map(async (log) => {
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

export async function getPendingApprovalCount(userId: string): Promise<number> {
  const snapshot = await getCountFromServer(
    query(
      transactionsCollection,
      and(
        or(where("paid_by_id", "==", userId), where("paid_for_id", "==", userId)),
        where("created_by_id", "!=", userId),
        where("status", "==", "pending"),
        where("is_deleted", "==", false),
      ),
    ),
  );
  return snapshot.data().count;
}

export async function getDashboardData(user: UserRead): Promise<DashboardData> {
  const transactionsSnapshot = await getDocs(
    query(
      transactionsCollection,
      and(
        or(where("paid_by_id", "==", user.id), where("paid_for_id", "==", user.id)),
        where("status", "==", "approved"),
      ),
    ),
  );

  const transactions = new Map<string, TransactionDocument>();
  for (const item of transactionsSnapshot.docs) {
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
    getPendingApprovalCount(user.id),
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
