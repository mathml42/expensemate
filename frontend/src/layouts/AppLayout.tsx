import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import smallLogo from "../assets/EM_logo_small.png";
import fullLogo from "../assets/EM_logo_full_name.png";

const navLinkClasses =
  "block rounded-md px-3 py-2 font-medium text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white";

function ThemeToggleButton({
  theme,
  systemTheme,
  handleToggleTheme,
}: {
  theme: "light" | "dark" | "system";
  systemTheme: "light" | "dark";
  handleToggleTheme: () => void;
}) {
  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      className="flex items-center justify-center rounded-md w-10 h-10 text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
      title="Toggle theme"
    >
      {theme === "system" ? (
        systemTheme === "dark" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )
      ) : theme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export function AppLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const remembered = window.localStorage.getItem("theme");
    if (remembered === "light" || remembered === "dark") {
      setTheme(remembered);
      return;
    }

    setTheme("system");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event?: MediaQueryListEvent) => {
      const isDark = event ? event.matches : mediaQuery.matches;
      setSystemTheme(isDark ? "dark" : "light");
    };

    updateSystemTheme();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateSystemTheme);
    } else {
      mediaQuery.addListener(updateSystemTheme);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateSystemTheme);
      } else {
        mediaQuery.removeListener(updateSystemTheme);
      }
    };
  }, []);

  useEffect(() => {
    const activeTheme = theme === "system" ? systemTheme : theme;
    document.documentElement.classList.toggle("dark", activeTheme === "dark");

    if (theme === "system") {
      window.localStorage.removeItem("theme");
    } else {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme, systemTheme]);

  function handleToggleTheme() {
    if (theme === "system") {
      setTheme(systemTheme === "dark" ? "light" : "dark");
      return;
    }

    setTheme(theme === "dark" ? "light" : "dark");
  }

  function handleLogout() {
    logout();
    setShowMenu(false);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <nav className="mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            <NavLink to="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
              <img
                src={smallLogo}
                alt="ExpenseMate Logo"
                className="block h-8 sm:hidden"
              />
              <img
                src={fullLogo}
                alt="ExpenseMate Full Logo"
                className="hidden h-8 sm:block"
              />
            </NavLink>
            <div className="flex items-center gap-2">

              <div className="sm:hidden">
                <ThemeToggleButton theme={theme} systemTheme={systemTheme} handleToggleTheme={handleToggleTheme} />
              </div>
              <button
                type="button"
                onClick={() => setShowMenu((current) => !current)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:hidden"
              >
                Menu
                <span aria-hidden="true">{showMenu ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>

          <div className={`w-full flex-col gap-3 ${showMenu ? "flex" : "hidden"} sm:flex sm:w-auto sm:flex-row sm:items-center`}>
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">

                <NavLink to="/pending-approvals" className={navLinkClasses} onClick={() => setShowMenu(false)}>
                  Pending Approvals
                </NavLink>
                {user?.role === "admin" ? (
                  <>
                    <NavLink to="/admin/users" className={navLinkClasses} onClick={() => setShowMenu(false)}>
                      Users
                    </NavLink>
                    <NavLink to="/admin/transactions" className={navLinkClasses} onClick={() => setShowMenu(false)}>
                      Transactions
                    </NavLink>
                    <NavLink to="/admin/activity" className={navLinkClasses} onClick={() => setShowMenu(false)}>
                      Activity
                    </NavLink>
                  </>
                ) : null}
                <NavLink to="/change-password" className={navLinkClasses} onClick={() => setShowMenu(false)}>
                  Change Password
                </NavLink>
                <ThemeToggleButton theme={theme} systemTheme={systemTheme} handleToggleTheme={handleToggleTheme} />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white" onClick={() => setShowMenu(false)}>
                Login
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
