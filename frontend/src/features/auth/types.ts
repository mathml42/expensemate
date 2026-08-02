import type { UserRead } from "../../types/domain";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type User = UserRead;
