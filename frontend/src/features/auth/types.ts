export type LoginCredentials = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type User = {
  id: number;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | string;
  is_active: boolean;
};
