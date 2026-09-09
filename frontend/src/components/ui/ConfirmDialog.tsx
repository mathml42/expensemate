import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

import { Modal } from "../Modal";
import { Button } from "./Button";
import { Input } from "./Input";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
  confirmDisabled?: boolean;
  requireTypedConfirmation?: string;
  children?: ReactNode;
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  confirmDisabled = false,
  requireTypedConfirmation,
  children,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (isOpen) setTypedValue("");
  }, [isOpen]);

  const typedMismatch = Boolean(requireTypedConfirmation) && typedValue !== requireTypedConfirmation;
  const disabled = isLoading || confirmDisabled || typedMismatch;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">
          {variant === "danger" ? (
            <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
          ) : (
            <HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
          {children}
          {requireTypedConfirmation && (
            <Input
              label={`Type "${requireTypedConfirmation}" to confirm`}
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              autoComplete="off"
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={disabled}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
