import { useEffect, useState } from "react";
import { getDocs, query, where, orderBy, limit } from "firebase/firestore";

import { useAuth } from "../features/auth/AuthContext";
import type { User } from "../features/auth/types";
import { auditLogsCollection } from "../lib/firebase/collections";
import type { AuditLogRead, AuditLogDocument } from "../types/domain";

export function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchLogs() {
      if (!user) {
        return;
      }
      setIsLoading(true);
      try {
        const snapshot = await getDocs(
          query(
            auditLogsCollection,
            where("performed_by_id", "==", user.id),
            orderBy("timestamp", "desc"),
            limit(100),
          ),
        );

        const fetchedLogs: AuditLogRead[] = snapshot.docs.map((log) => {
          const data = log.data() as AuditLogDocument;
          return {
            id: log.id,
            action: data.action,
            reason: data.reason,
            details: data.details,
            timestamp: data.timestamp?.toDate() ?? null,
            performed_by: user, // Use user from context
          };
        });
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchLogs();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-normal">Activity Log</h1>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td className="px-4 py-4 text-slate-500 dark:text-slate-300" colSpan={5}>Loading activity...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td className="px-4 py-4 text-slate-500 dark:text-slate-300" colSpan={5}>No activity found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.timestamp ? log.timestamp.toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 capitalize">{log.action.split("_").join(" ").toLowerCase()}</td>
                  <td className="px-4 py-3">{log.performed_by.full_name ?? log.performed_by.email}</td>
                  <td className="px-4 py-3">{log.reason ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.details ? JSON.stringify(log.details) : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
