import { Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card padding="lg" className="max-w-sm animate-fade-in-up text-center">
        <p className="font-mono text-sm text-slate-400">404</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="primary">Go home</Button>
        </Link>
      </Card>
    </div>
  );
}
