import { useEffect, useState } from "react";

import { useAuth } from "../features/auth/AuthContext";
import { getPendingApprovalCount } from "../lib/firebase/dashboard";

const REFRESH_INTERVAL_MS = 30_000;

export function usePendingApprovalCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const value = await getPendingApprovalCount(user.id);
        if (!cancelled) {
          setCount(value);
        }
      } catch {
        // Keep the last known count if a refresh fails.
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, [user]);

  return count;
}
