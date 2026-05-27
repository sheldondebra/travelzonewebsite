export function calculateSmsUnits(message: string): number {
  const len = message.length;
  if (len <= 0) return 1;
  return Math.ceil(len / 160);
}
