// バックエンドの PublicUser 型(backend/src/types/user.ts)に対応する、フロント側の型
export type User = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  created_at: string;
  has_seen_onboarding: boolean;
};
