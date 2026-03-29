export const DEFAULT_COMMISSION_RATE = 0.1;

export function calculateCommissionFee(totalAmount: number, rate = DEFAULT_COMMISSION_RATE): number {
  return Math.round(totalAmount * rate);
}

export function calculateBookingAmount(pricePerHour: number, startTime: Date, endTime: Date): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const hourInMs = 60 * 60 * 1000;
  const durationHours = Math.max(durationMs / hourInMs, 0);
  return Math.round(pricePerHour * durationHours);
}
