import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import { db } from "./app";
import type { AuditLogDocument, TransactionDocument, UserDocument } from "../../types/domain";

function converter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T) {
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
      return snapshot.data(options) as T;
    },
  };
}

export const usersCollection = collection(db, "users").withConverter(
  converter<UserDocument>(),
) as CollectionReference<UserDocument>;

export const transactionsCollection = collection(db, "transactions").withConverter(
  converter<TransactionDocument>(),
) as CollectionReference<TransactionDocument>;

export const auditLogsCollection = collection(db, "audit_logs").withConverter(
  converter<AuditLogDocument>(),
) as CollectionReference<AuditLogDocument>;

export const userDoc = (id: string) => doc(usersCollection, id);
export const transactionDoc = (id: string) => doc(transactionsCollection, id);
