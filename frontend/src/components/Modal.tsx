import { PropsWithChildren, useEffect } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ isOpen, onClose, title, children }: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:px-6"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
          <h3 className="text-xl font-semibold" id="modal-title">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
