export function getConversationId(
  invoiceId: number,
  addressA: string,
  addressB: string
): string {
  const [a, b] = [addressA.toLowerCase(), addressB.toLowerCase()].sort();
  return `invoice:${invoiceId}:${a}:${b}`;
}
