import { addDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from "firebase/firestore";

import { auditLogsCollection } from "./collections";
import { getUserById } from "./users";
import type { AuditAction, AuditDetails, AuditLogRead, UserRead } from "../../types/domain";

export async function createAuditLog(input: {
  action: AuditAction;
  performedBy: UserRead;
  reason?: string | null;
  details?: AuditDetails | null;
}) {
  await addDoc(auditLogsCollection, {
    action: input.action,
    performed_by_id: input.performedBy.id,
    reason: input.reason ?? null,
    details: input.details ?? null,
    timestamp: serverTimestamp(),
  });
}

export async function listAuditLogs(userId: string, options: { limitCount?: number } = {}): Promise<AuditLogRead[]> {
  const snapshot = await getDocs(
    query(
        auditLogsCollection,
        where("performed_by_id", "==", userId),
        orderBy("timestamp", "desc"),
        limit(options.limitCount ?? 100)
    ),
  );

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
