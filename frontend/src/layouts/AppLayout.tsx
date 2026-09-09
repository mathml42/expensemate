import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BellRing, KeyRound, LogOut, Menu, Moon, Receipt, ScrollText, Sun, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DropdownMenu } from "../components/ui/DropdownMenu";
import { useAuth } from "../features/auth/AuthContext";
import { usePendingApprovalCount } from "../hooks/usePendingApprovalCount";
import { cn } from "../lib/cn";
import smallLogo from "../assets/EM_logo_small.png";
import fullLogo from "../assets/EM_logo_full_name.png";

function navLinkClasses(isActive: boolean) {
  return cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-emphasized",
    isActive
      ? "bg-primary-600/10 text-primary-700 dark:bg-primary-400/10 dark:text-primary-400"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  );
}

function ThemeToggleButton({
  theme,
  systemTheme,
  handleToggleTheme,
}: {
  theme: "light" | "dark" | "system";
  systemTheme: "light" | "dark";
  handleToggleTheme: () => void;
}) {
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const Icon = effectiveTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function PendingApprovalBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="ml-auto inline-flex h-5 min-w-5 animate-scale-in items-center justify-center rounded-full bg-danger-600 px-1.5 text-xs font-semibold leading-none text-white dark:bg-danger-500"
      title={`${count} transaction${count === 1 ? "" : "s"} awaiting your approval`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

type NavItem = { to: string; label: string; icon: LucideIcon };

export function AppLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, logout, user } = useAuth();
  const pendingApprovalCount = usePendingApprovalCount();
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

  const navItems: NavItem[] = [{ to: "/pending-approvals", label: "Pending Approvals", icon: BellRing }];
  if (user?.role !== "admin") {
    navItems.push({ to: "/transactions", label: "Transactions", icon: Receipt });
  } else {
    navItems.push({ to: "/admin/users", label: "Users", icon: Users });
    navItems.push({ to: "/admin/transactions", label: "Transactions", icon: Receipt });
    navItems.push({ to: "/admin/activity", label: "Activity", icon: ScrollText });
  }

  function renderNavLinks(onNavigate?: () => void) {
    return navItems.map((item) => (
      <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClasses(isActive)} onClick={onNavigate}>
        <item.icon className="h-4 w-4" />
        {item.label}
        {item.to === "/pending-approvals" ? <PendingApprovalBadge count={pendingApprovalCount} /> : null}
      </NavLink>
    ));
  }

  const initial = user?.full_name?.charAt(0).toUpperCase() ?? user?.email.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-[#10161De6]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-80">
            <img src={smallLogo} alt="ExpenseMate Logo" className="block h-7 sm:hidden" />
            <img src={fullLogo} alt="ExpenseMate" className="hidden h-7 sm:block" />
          </NavLink>

          {isAuthenticated ? (
            <>
              <nav className="hidden items-center gap-1 sm:flex">{renderNavLinks()}</nav>

              <div className="hidden items-center gap-2 sm:flex">
                <ThemeToggleButton theme={theme} systemTheme={systemTheme} handleToggleTheme={handleToggleTheme} />
                <DropdownMenu
                  trigger={
                    <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600/15 text-xs font-semibold text-primary-700 dark:bg-primary-400/15 dark:text-primary-400">
                        {initial}
                      </span>
                      {user?.full_name ?? user?.email}
                    </span>
                  }
                >
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {user?.full_name ?? "Account"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/change-password"
                    className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger-600 transition-colors duration-150 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </DropdownMenu>
              </div>

              <button
                type="button"
                onClick={() => setShowMenu((current) => !current)}
                aria-label={showMenu ? "Close menu" : "Open menu"}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:hidden"
              >
                {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                {!showMenu && pendingApprovalCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger-600 ring-2 ring-white dark:bg-danger-500 dark:ring-slate-950"
                  />
                ) : null}
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
            >
              Login
            </NavLink>
          )}
        </div>

        {isAuthenticated ? (
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-emphasized sm:hidden",
              showMenu ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <nav className="flex flex-col gap-1 px-4 pb-3">
                {renderNavLinks(() => setShowMenu(false))}
                <NavLink
                  to="/change-password"
                  className={({ isActive }) => navLinkClasses(isActive)}
                  onClick={() => setShowMenu(false)}
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </NavLink>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Theme</span>
                  <ThemeToggleButton theme={theme} systemTheme={systemTheme} handleToggleTheme={handleToggleTheme} />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-danger-600 transition-colors duration-150 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
