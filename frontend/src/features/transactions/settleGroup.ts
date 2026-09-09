import { splitAmountEqually } from "./splitEqually";

export type GroupPayment = {
  userId: string;
  amountPaid: number;
};

export type SettlementEdge = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

/**
 * Given how much each group member actually paid toward a shared expense,
 * computes the minimal set of payments needed to settle everyone up to an
 * equal share, using a greedy largest-debtor-pays-largest-creditor match.
 */
export function computeGroupSettlement(payments: GroupPayment[]): SettlementEdge[] {
  const total = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const shares = splitAmountEqually(total, payments.length);

  const creditors: { userId: string; paise: number }[] = [];
  const debtors: { userId: string; paise: number }[] = [];

  payments.forEach((payment, index) => {
    const netPaise = Math.round(payment.amountPaid * 100) - Math.round(shares[index] * 100);
    if (netPaise > 0) creditors.push({ userId: payment.userId, paise: netPaise });
    else if (netPaise < 0) debtors.push({ userId: payment.userId, paise: -netPaise });
  });

  creditors.sort((a, b) => b.paise - a.paise);
  debtors.sort((a, b) => b.paise - a.paise);

  const edges: SettlementEdge[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settled = Math.min(creditor.paise, debtor.paise);

    edges.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount: settled / 100 });

    creditor.paise -= settled;
    debtor.paise -= settled;
    if (creditor.paise === 0) creditorIndex += 1;
    if (debtor.paise === 0) debtorIndex += 1;
  }

  return edges;
}
