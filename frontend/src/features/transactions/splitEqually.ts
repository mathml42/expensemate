export function splitAmountEqually(amount: number, peopleCount: number): number[] {
  const totalPaise = Math.round(amount * 100);
  const basePaise = Math.floor(totalPaise / peopleCount);
  const remainder = totalPaise - basePaise * peopleCount;

  return Array.from({ length: peopleCount }, (_, i) => (basePaise + (i < remainder ? 1 : 0)) / 100);
}
