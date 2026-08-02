import { FormEvent, useState } from "react";

import { changeCurrentUserPassword } from "../lib/firebase/users";

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await changeCurrentUserPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch {
      setError("Unable to change password. Check your current password and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">Change Password</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </label>
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}
