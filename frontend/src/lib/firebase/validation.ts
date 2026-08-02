import type { TransactionBase, UserCreate } from "../../types/domain";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function assertValidEmail(email: string) {
  if (!emailPattern.test(email)) {
    throw new Error("A valid email address is required.");
  }
}

export function assertValidPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

export function assertValidUserCreate(user: UserCreate) {
  assertValidEmail(user.email);
  assertValidPassword(user.password);
}

export function assertValidTransactionInput(input: Partial<TransactionBase>) {
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) {
    throw new Error("Amount must be greater than 0.");
  }

  if (input.amount !== undefined && Math.round(input.amount * 100) !== input.amount * 100) {
    throw new Error("Amount can have at most 2 decimal places.");
  }

  if (input.note !== undefined && (input.note.trim().length < 1 || input.note.length > 255)) {
    throw new Error("Note must be between 1 and 255 characters.");
  }

  if (input.date !== undefined && !isoDatePattern.test(input.date)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }
}

export function assertValidReason(reason: string) {
  if (reason.trim().length < 1 || reason.length > 500) {
    throw new Error("Reason must be between 1 and 500 characters.");
  }
}
