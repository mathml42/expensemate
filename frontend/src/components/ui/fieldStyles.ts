export const fieldBaseClasses =
  "w-full rounded-md border border-slate-200 bg-white text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 ease-emphasized placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-primary-400 dark:focus:ring-primary-400/15 dark:disabled:bg-slate-900/50 dark:disabled:hover:border-slate-700";

export const fieldErrorClasses =
  "border-danger-400 focus:border-danger-500 focus:ring-danger-500/15 dark:border-danger-700 dark:focus:border-danger-400";

export const fieldSizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
} as const;
