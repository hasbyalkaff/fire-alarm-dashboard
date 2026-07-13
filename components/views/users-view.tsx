"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/data/states";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, type Role, type UserDTO } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const ROLES: Role[] = ["administrator", "safety_officer", "viewer"];

export function UsersView() {
  const qc = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<{ data: UserDTO[] }> => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const [editing, setEditing] = useState<UserDTO | "new" | null>(null);
  const [confirm, setConfirm] = useState<UserDTO | null>(null);

  const toggleActive = useMutation({
    mutationFn: async (u: UserDTO) => {
      const res = await fetch(`/api/users/${u.id}`, {
        method: u.isActive ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: u.isActive ? undefined : JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setConfirm(null);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden /> Add User
        </Button>
      </div>

      {isPending ? (
        <Card className="p-5"><Skeleton className="h-40 w-full" /></Card>
      ) : isError ? (
        <Card><ErrorState message="Couldn't load users." onRetry={() => refetch()} /></Card>
      ) : !data || data.data.length === 0 ? (
        <Card><EmptyState title="No users yet" /></Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Tablet and up: table. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  <th scope="col" className="px-4 py-3">Username</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Last login</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-fg">{u.username}</td>
                    <td className="px-4 py-3 text-fg-muted">{u.email}</td>
                    <td className="px-4 py-3 text-fg-muted">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={u.isActive} />
                    </td>
                    <td className="tnum px-4 py-3 text-fg-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "–"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <UserActions
                          user={u}
                          onEdit={() => setEditing(u)}
                          onToggle={() => (u.isActive ? setConfirm(u) : toggleActive.mutate(u))}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: one card per user. */}
          <ul className="divide-y divide-border md:hidden">
            {data.data.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{u.username}</p>
                    <p className="truncate text-sm text-fg-muted">{u.email}</p>
                  </div>
                  <ActiveBadge active={u.isActive} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">Role</dt>
                    <dd className="text-sm text-fg-muted">{ROLE_LABEL[u.role]}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">Last login</dt>
                    <dd className="tnum text-sm text-fg-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "–"}</dd>
                  </div>
                </dl>
                <div className="flex items-center gap-1">
                  <UserActions
                    user={u}
                    onEdit={() => setEditing(u)}
                    onToggle={() => (u.isActive ? setConfirm(u) : toggleActive.mutate(u))}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {editing && <UserFormDialog user={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["users"] }); }} />}

      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={`Deactivate ${confirm?.username ?? ""}?`}
        description="They will lose access immediately. You can reactivate them later."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => confirm && toggleActive.mutate(confirm)} disabled={toggleActive.isPending}>
            Deactivate
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  const key = active ? "normal" : "offline";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: `var(--status-${key}-fg)`, backgroundColor: `var(--status-${key}-bg)` }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserActions({ user, onEdit, onToggle }: { user: UserDTO; onEdit: () => void; onToggle: () => void }) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${user.username}`}>
        <Pencil size={15} aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        aria-label={user.isActive ? `Deactivate ${user.username}` : `Reactivate ${user.username}`}
      >
        {user.isActive ? <UserX size={15} aria-hidden /> : <UserCheck size={15} aria-hidden />}
      </Button>
    </>
  );
}

function UserFormDialog({ user, onClose, onSaved }: { user: UserDTO | null; onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "viewer");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const res = user
        ? await fetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role, ...(password ? { password } : {}) }),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, role, password }),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save user.");
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open onClose={onClose} title={user ? `Edit ${user.username}` : "Add User"}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        {!user && (
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" spellCheck={false} required />
        )}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </Select>
        <Input
          label={user ? "New password (optional)" : "Password"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
          autoComplete="new-password"
          required={!user}
        />
        {error && <p className="text-sm" style={{ color: "var(--status-fault-fg)" }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{user ? "Save Changes" : "Create User"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
