import { createHashRouter } from "react-router-dom";

import { App } from "../App";
import { AdminRoute } from "../features/auth/AdminRoute";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { ActivityLogPage } from "../pages/ActivityLogPage";
import { AdminTransactionsPage } from "../pages/AdminTransactionsPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { ChangePasswordPage } from "../pages/ChangePasswordPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PendingApprovalPage } from "../pages/PendingApprovalPage";
import { PersonDetailsPage } from "../pages/PersonDetailsPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "pending-approvals",
            element: <PendingApprovalPage />,
          },
          {
            path: "users/:userId",
            element: <PersonDetailsPage />,
          },
          {
            path: "change-password",
            element: <ChangePasswordPage />,
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: "admin/users",
                element: <AdminUsersPage />,
              },
              {
                path: "admin/transactions",
                element: <AdminTransactionsPage />,
              },
              {
                path: "admin/activity",
                element: <ActivityLogPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
