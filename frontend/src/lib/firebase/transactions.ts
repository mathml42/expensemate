import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { createAuditLog } from "./auditLogs";
import { transactionDoc, transactionsCollection } from "./collections";
import { getUserById } from "./users";
import { assertValidReason, assertValidTransactionInput } from "./validation";
import type {
  TransactionDocument,
  TransactionCreate,
  TransactionRead,
  TransactionStatus,
  TransactionUpdate,
  UserRead,
} from "../../types/domain";

async function hydrateTransaction(id: string, data: TransactionDocument): Promise<TransactionRead> {
  const [paidBy, paidFor, createdBy] = await Promise.all([
    getUserById(data.paid_by_id),
    getUserById(data.paid_for_id),
    getUserById(data.created_by_id),
  ]);

  if (!paidBy || !paidFor || !createdBy) {
    throw new Error(`Transaction ${id} references a missing user.`);
  }

  return {
    id,
    amount: data.amount,
    note: data.note,
    date: data.date,
    status: data.status,
    rejection_reason: data.rejection_reason,
    is_deleted: data.is_deleted,
    deletion_reason: data.deletion_reason,
    paid_by_id: data.paid_by_id,
    paid_for_id: data.paid_for_id,
    created_by_id: data.created_by_id,
    created_at: data.created_at?.toDate() ?? null,
    updated_at: data.updated_at?.toDate() ?? null,
    paid_by: paidBy,
    paid_for: paidFor,
    created_by: createdBy,
  };
}

export async function createTransaction(input: TransactionCreate, user: UserRead) {
  assertValidTransactionInput(input);

  if (user.id === input.paid_for_id) {
    throw new Error("Users cannot create transactions with themselves.");
  }

  const paidById = input.i_paid ? user.id : input.paid_for_id;
  const paidForId = input.i_paid ? input.paid_for_id : user.id;

  const ref = await addDoc(transactionsCollection, {
    amount: input.amount,
    note: input.note.trim(),
    date: input.date,
    status: "pending",
    rejection_reason: null,
    is_deleted: false,
    deletion_reason: null,
    paid_by_id: paidById,
    paid_for_id: paidForId,
    created_by_id: user.id,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await createAuditLog({
    action: "CREATE_TRANSACTION",
    performedBy: user,
    details: {
      transaction_id: ref.id,
      amount: input.amount,
      paid_by_id: paidById,
      paid_for_id: paidForId,
    },
  });

  const created = await getTransactionById(ref.id);
  if (!created) {
    throw new Error("Transaction was created but could not be read back.");
  }
  return created;
}

export async function getTransactionById(transactionId: string): Promise<TransactionRead | null> {
  const snapshot = await getDoc(transactionDoc(transactionId));
  return snapshot.exists() ? hydrateTransaction(snapshot.id, snapshot.data()) : null;
}

export async function listTransactionsForUser(
  userId: string,
  filters: {
    otherUserId?: string;
    note?: string;
    amount?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: TransactionStatus;
  } = {},
): Promise<TransactionRead[]> {
  const [paidBySnapshot, paidForSnapshot] = await Promise.all([
    getDocs(query(transactionsCollection, where("paid_by_id", "==", userId))),
    getDocs(query(transactionsCollection, where("paid_for_id", "==", userId))),
  ]);

  const unique = new Map<string, Awaited<ReturnType<typeof hydrateTransaction>>>();
  const hydrated = await Promise.all(
    [...paidBySnapshot.docs, ...paidForSnapshot.docs].map((item) =>
      hydrateTransaction(item.id, item.data()),
    ),
  );

  for (const transaction of hydrated) {
    unique.set(transaction.id, transaction);
  }

  return [...unique.values()]
    .filter((transaction) => {
      const matchesOtherUser =
        !filters.otherUserId ||
        transaction.paid_by_id === filters.otherUserId ||
        transaction.paid_for_id === filters.otherUserId;
      const matchesNote =
        !filters.note || transaction.note.toLowerCase().includes(filters.note.toLowerCase());
      const matchesAmount = filters.amount === undefined || transaction.amount === filters.amount;
      const matchesDateFrom = !filters.dateFrom || transaction.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || transaction.date <= filters.dateTo;
      const matchesStatus = !filters.status || transaction.status === filters.status;
      return (
        matchesOtherUser &&
        matchesNote &&
        matchesAmount &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesStatus
      );
    })
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
}

export async function listAllTransactions(
  filters: {
    userId?: string;
    note?: string;
    amount?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: TransactionStatus;
  } = {},
): Promise<TransactionRead[]> {
  const snapshot = await getDocs(query(transactionsCollection, orderBy("date", "desc")));
  const transactions = await Promise.all(
    snapshot.docs.map((item) => hydrateTransaction(item.id, item.data())),
  );

  return transactions.filter((transaction) => {
    const matchesUser =
      !filters.userId ||
      transaction.paid_by_id === filters.userId ||
      transaction.paid_for_id === filters.userId ||
      transaction.created_by_id === filters.userId;
    const matchesNote =
      !filters.note || transaction.note.toLowerCase().includes(filters.note.toLowerCase());
    const matchesAmount = filters.amount === undefined || transaction.amount === filters.amount;
    const matchesDateFrom = !filters.dateFrom || transaction.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || transaction.date <= filters.dateTo;
    const matchesStatus = !filters.status || transaction.status === filters.status;
    return (
      matchesUser &&
      matchesNote &&
      matchesAmount &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesStatus
    );
  });
}

export async function listPendingApprovals(userId: string): Promise<TransactionRead[]> {
  const snapshot = await getDocs(
    query(
      transactionsCollection,
      where("paid_for_id", "==", userId),
      where("status", "==", "pending"),
      where("is_deleted", "==", false),
    ),
  );
  const transactions = await Promise.all(
    snapshot.docs.map((item) => hydrateTransaction(item.id, item.data())),
  );
  return transactions.sort((left, right) => right.date.localeCompare(left.date));
}

export async function updateTransaction(
  transactionId: string,
  input: TransactionUpdate,
  user: UserRead,
) {
  assertValidTransactionInput(input);

  const current = await getDoc(doc(transactionsCollection, transactionId));
  if (!current.exists()) {
    throw new Error("Transaction not found.");
  }

  const data = current.data();
  const shouldResetApproval = data.status === "approved";
  const updatedFields = Object.keys(input);

  await updateDoc(transactionDoc(transactionId), {
    ...input,
    ...(input.note ? { note: input.note.trim() } : {}),
    ...(shouldResetApproval ? { status: "pending", rejection_reason: null } : {}),
    updated_at: serverTimestamp(),
  });

  await createAuditLog({
    action: "UPDATE_TRANSACTION",
    performedBy: user,
    details: { transaction_id: transactionId, updated_fields: updatedFields },
  });

  const updated = await getTransactionById(transactionId);
  if (!updated) {
    throw new Error("Transaction was updated but could not be read back.");
  }
  return updated;
}

export async function approveTransaction(transactionId: string, user: UserRead) {
  await updateDoc(transactionDoc(transactionId), {
    status: "approved",
    rejection_reason: null,
    updated_at: serverTimestamp(),
  });
  await createAuditLog({
    action: "APPROVE_TRANSACTION",
    performedBy: user,
    details: { transaction_id: transactionId },
  });
  return getTransactionById(transactionId);
}

export async function rejectTransaction(transactionId: string, reason: string, user: UserRead) {
  assertValidReason(reason);
  await updateDoc(transactionDoc(transactionId), {
    status: "rejected",
    rejection_reason: reason.trim(),
    updated_at: serverTimestamp(),
  });
  await createAuditLog({
    action: "REJECT_TRANSACTION",
    performedBy: user,
    reason: reason.trim(),
    details: { transaction_id: transactionId },
  });
  return getTransactionById(transactionId);
}

export async function softDeleteTransaction(transactionId: string, reason: string, user: UserRead) {
  assertValidReason(reason);
  await updateDoc(transactionDoc(transactionId), {
    is_deleted: true,
    deletion_reason: reason.trim(),
    updated_at: serverTimestamp(),
  });
  await createAuditLog({
    action: "DELETE_TRANSACTION",
    performedBy: user,
    reason: reason.trim(),
    details: { transaction_id: transactionId },
  });
  return getTransactionById(transactionId);
}

export async function clearAllTransactions(user: UserRead): Promise<number> {
  if (user.role !== "admin") {
    throw new Error("Only admins can clear all transactions.");
  }

  const snapshot = await getDocs(transactionsCollection);
  await Promise.all(snapshot.docs.map((item) => deleteDoc(transactionDoc(item.id))));

  await createAuditLog({
    action: "CLEAR_ALL_TRANSACTIONS",
    performedBy: user,
    details: { deleted_count: snapshot.size },
  });

  return snapshot.size;
}
