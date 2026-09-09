export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function formatDate(value: string | Date, style: "short" | "datetime" = "short"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return style === "datetime" ? date.toLocaleString() : date.toLocaleDateString();
}
