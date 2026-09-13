import { apiFetch } from "./client";
import type { User } from "../types/user";

export function listUsersRequest() {
  return apiFetch<{ users: User[] }>("/users");
}

export function adminDeleteUserRequest(id: number) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export function adminSetUserStatusRequest(id: number, status: "active" | "suspended") {
  return apiFetch<{ user: User }>(`/users/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function adminSetUserPasswordRequest(id: number, newPassword: string) {
  return apiFetch<void>(`/users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

export function adminSetUserRoleRequest(id: number) {
  return apiFetch<{ user: User }>(`/users/${id}/role`, {
    method: "PATCH",
  });
}
