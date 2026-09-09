import { FormEvent, useEffect, useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../components/ui/Table";
import { cn } from "../lib/cn";
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
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Full name"
            type="text"
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
            minLength={8}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreateUserPayload["role"] }))}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>

          <div className="md:col-span-2">
            {error ? <p className="mb-3 text-sm text-danger-700 dark:text-danger-400">{error}</p> : null}
            {success ? <p className="mb-3 text-sm text-success-700 dark:text-success-400">{success}</p> : null}
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Card>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell className="text-slate-500 dark:text-slate-400" colSpan={5}>
                Loading users...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell className="text-slate-500 dark:text-slate-400" colSpan={5}>
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const isEditing = editingUserId === user.id;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={editForm.full_name}
                        onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
                      />
                    ) : (
                      user.full_name ?? "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        size="sm"
                        type="email"
                        value={editForm.email}
                        onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                      />
                    ) : (
                      user.email
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {isEditing ? (
                      <Select
                        size="sm"
                        value={editForm.role}
                        onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      user.role
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold",
                        user.is_active
                          ? "bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="primary" onClick={() => void saveEdit()}>
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingUserId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(user)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void toggleActive(user)}>
                            {user.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void resetPassword(user)}>
                            Send Reset Email
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
