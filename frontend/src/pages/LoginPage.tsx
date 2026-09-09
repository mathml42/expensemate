import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../features/auth/AuthContext";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Firebase rejected those credentials. Check the email and password in Firebase Authentication.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled in Firebase Authentication.";
      case "auth/network-request-failed":
        return "Could not reach Firebase. Check your network connection.";
      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
        return "Firebase API key is invalid. Check frontend/.env.";
      default:
        return `Firebase login failed: ${error.code}`;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "unavailable"
  ) {
    return "Firebase signed in, but Firestore is unavailable. Check internet, Firestore setup, and Firebase project settings.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sign in.";
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      setError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md animate-fade-in-up" padding="lg">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Sign in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {error ? <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p> : null}
        <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
