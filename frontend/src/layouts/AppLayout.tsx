import type { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";

export function AppLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <NavLink to="/" className="text-lg font-semibold">
            ExpenseMate
          </NavLink>
          {isAuthenticated ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-slate-600 sm:inline">{user?.email}</span>
              <NavLink to="/pending-approvals" className="font-medium text-slate-700 hover:text-slate-950">
                Pending Approvals
              </NavLink>
              {user?.role === "admin" ? (
                <>
                  <NavLink to="/admin/users" className="font-medium text-slate-700 hover:text-slate-950">
                    Users
                  </NavLink>
                  <NavLink to="/admin/transactions" className="font-medium text-slate-700 hover:text-slate-950">
                    Transactions
                  </NavLink>
                  <NavLink to="/admin/activity" className="font-medium text-slate-700 hover:text-slate-950">
                    Activity
                  </NavLink>
                </>
              ) : null}
              <NavLink to="/change-password" className="font-medium text-slate-700 hover:text-slate-950">
                Change Password
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-2 font-medium hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              Login
            </NavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
