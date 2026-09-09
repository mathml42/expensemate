import { useEffect, useState } from "react";
import { getDocs, query, where, orderBy, limit } from "firebase/firestore";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../components/ui/Table";
import { useAuth } from "../features/auth/AuthContext";
import { formatDate } from "../lib/format";
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
      <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Reason</TableHeaderCell>
            <TableHeaderCell>Details</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell className="text-slate-500 dark:text-slate-400" colSpan={5}>
                Loading activity...
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell className="text-slate-500 dark:text-slate-400" colSpan={5}>
                No activity found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                  {log.timestamp ? formatDate(log.timestamp, "datetime") : "-"}
                </TableCell>
                <TableCell className="capitalize">{log.action.split("_").join(" ").toLowerCase()}</TableCell>
                <TableCell>{log.performed_by.full_name ?? log.performed_by.email}</TableCell>
                <TableCell>{log.reason ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{log.details ? JSON.stringify(log.details) : "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
