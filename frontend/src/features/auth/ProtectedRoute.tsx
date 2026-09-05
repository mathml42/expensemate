import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingScreen } from "../../components/LoadingScreen";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen label="Signing you in" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
