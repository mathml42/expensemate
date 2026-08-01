import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-normal">Page not found</h1>
      <Link to="/" className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800">
        Go home
      </Link>
    </section>
  );
}
