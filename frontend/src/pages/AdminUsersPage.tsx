import { FormEvent, useEffect, useState } from "react";

import type { User } from "../features/auth/types";
import { createUser, listUsers, sendAdminPasswordReset, updateUser } from "../lib/firebase/users";

type CreateUserPayload = {
  email: string;
  full_name: string;
  password: string;
  role: "user" | "admin";
};

const initialForm: CreateUserPayload = {
  email: "",
  full_name: "",
  password: "",
  role: "user",
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<CreateUserPayload>(initialForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", full_name: "", role: "user", is_active: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      setIsLoading(true);
      setUsers(await listUsers());
    } catch {
      setError("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim() || null,
      };
      const createdUser = await createUser(payload);
      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setForm(initialForm);
      setSuccess("User created successfully.");
    } catch {
      setError("Unable to create user. Check the email and password, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(user: User) {
    setEditingUserId(user.id);
    setEditForm({
      email: user.email,
      full_name: user.full_name ?? "",
      role: user.role,
      is_active: user.is_active,
    });
  }

  async function saveEdit() {
    if (!editingUserId) return;

    try {
      const updatedUser = await updateUser(editingUserId, {
        ...editForm,
        full_name: editForm.full_name.trim() || null,
      });
      setUsers((current) => current.map((user) => (user.id === editingUserId ? updatedUser : user)));
      setEditingUserId(null);
    } catch (error) {
      console.error("Failed to save user:", error);
      setError("Failed to save user.");
    }
  }

  async function toggleActive(user: User) {
    try {
      const updatedUser = await updateUser(user.id, { is_active: !user.is_active });
      console.log("updatedUser", updatedUser);
      setUsers((current) => current.map((item) => (item.id === user.id ? updatedUser : item)));
      if (editingUserId === user.id) {
        setEditForm((current) => ({ ...current, is_active: updatedUser.is_active }));
      }
    } catch (error) {
      console.error("Failed to toggle user active status:", error);
      setError("Failed to update user status.");
    }
  }

  async function resetPassword(user: User) {
    await sendAdminPasswordReset(user.email);
    setSuccess(`Password reset email sent to ${user.email}.`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Users</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Full name</span>
          <input
            type="text"
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
            minLength={8}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
          <select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreateUserPayload["role"] }))}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="md:col-span-2">
          {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mb-3 text-sm text-green-700">{success}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isEditing = editingUserId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input value={editForm.full_name} onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))} className="w-full rounded-md border px-2 py-1" />
                      ) : (
                        user.full_name ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-md border px-2 py-1" />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {isEditing ? (
                        <select value={editForm.role} onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))} className="rounded-md border px-2 py-1">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        user.role
                      )}
                    </td>
                    <td className="px-4 py-3">{user.is_active ? "Active" : "Inactive"}</td>
                    <td className="space-x-2 px-4 py-3">
                      {isEditing ? (
                        <>
                          <button onClick={() => void saveEdit()} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">Save</button>
                          <button onClick={() => setEditingUserId(null)} className="rounded-md border px-3 py-1.5 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(user)} className="rounded-md border px-3 py-1.5 text-xs font-medium">Edit</button>
                          <button onClick={() => void toggleActive(user)} className="rounded-md border px-3 py-1.5 text-xs font-medium">
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => void resetPassword(user)} className="rounded-md border px-3 py-1.5 text-xs font-medium">Send Reset Email</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
