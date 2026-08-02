import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "user" | string;

export type TransactionStatus = "pending" | "approved" | "rejected";

export type ISODateString = string;

export type UserRead = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
};

export type UserCreate = {
  email: string;
  password: string;
  full_name?: string | null;
  role?: UserRole;
};

export type UserUpdate = Partial<Pick<UserRead, "email" | "full_name" | "is_active" | "role">>;

export type TransactionBase = {
  amount: number;
  note: string;
  date: ISODateString;
};

export type TransactionCreate = TransactionBase & {
  paid_for_id: string;
  i_paid: boolean;
};

export type TransactionUpdate = Partial<TransactionBase>;

export type TransactionRead = TransactionBase & {
  id: string;
  status: TransactionStatus;
  rejection_reason: string | null;
  is_deleted: boolean;
  deletion_reason: string | null;
  paid_by_id: string;
  paid_for_id: string;
  created_by_id: string;
  created_at: Date | null;
  updated_at: Date | null;
  paid_by: UserRead;
  paid_for: UserRead;
  created_by: UserRead;
};

export type TransactionReject = {
  reason: string;
};

export type TransactionSoftDelete = {
  reason: string;
};

export type AuditAction =
  | "CREATE_TRANSACTION"
  | "UPDATE_TRANSACTION"
  | "APPROVE_TRANSACTION"
  | "REJECT_TRANSACTION"
  | "DELETE_TRANSACTION"
  | string;

export type AuditDetails = Record<string, unknown>;

export type AuditLogRead = {
  id: string;
  action: AuditAction;
  reason: string | null;
  details: AuditDetails | null;
  timestamp: Date | null;
  performed_by: UserRead;
};

export type UserBalance = {
  user: UserRead;
  balance: number;
};

export type DashboardData = {
  net_balance: number;
  total_to_receive: number;
  total_to_pay: number;
  user_balances: UserBalance[];
  recent_activity: AuditLogRead[];
  pending_approval_count: number;
};

export type UserDocument = Omit<UserRead, "id"> & {
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

export type TransactionDocument = TransactionBase & {
  status: TransactionStatus;
  rejection_reason: string | null;
  is_deleted: boolean;
  deletion_reason: string | null;
  paid_by_id: string;
  paid_for_id: string;
  created_by_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AuditLogDocument = {
  action: AuditAction;
  reason: string | null;
  details: AuditDetails | null;
  performed_by_id: string;
  timestamp: Timestamp;
};
