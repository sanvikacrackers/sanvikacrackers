/**
 * Billing utility functions for the Sanvika Crackers staff billing system.
 * All displayed times use Asia/Kolkata timezone in 12-hour format.
 */

/**
 * Formats a timestamp as "DD MMM YYYY, hh:mm AM/PM" in Asia/Kolkata timezone.
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatIST(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '—';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const ampm = get('dayPeriod').toUpperCase();
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')} ${ampm}`;
}

/**
 * Formats a date-only string as "DD MMM YYYY" in Asia/Kolkata timezone.
 */
export function formatISTDate(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a number as Indian Rupee currency.
 */
export const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0);

/**
 * Calculates line total safely using integer paise to avoid floating-point errors.
 */
export function calcLineTotal(quantity, unitPrice, discountAmount = 0) {
  const qty = Math.max(0, Math.round(Number(quantity)));
  const pricePaise = Math.round(Number(unitPrice) * 100);
  const discPaise = Math.round(Number(discountAmount) * 100);
  const gross = qty * pricePaise;
  const net = gross - qty * discPaise;
  return Math.max(0, net) / 100;
}

/**
 * Calculates bill totals (subtotal, discount_total, grand_total) from items array.
 * Items must have: unit_price, quantity, discount_amount
 */
export function calcBillTotals(items) {
  let subtotalPaise = 0;
  let discountPaise = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.round(Number(item.quantity)));
    const pricePaise = Math.round(Number(item.unit_price) * 100);
    const discPaise = Math.round(Number(item.discount_amount ?? 0) * 100);
    subtotalPaise += qty * pricePaise;
    discountPaise += qty * discPaise;
  }

  return {
    subtotal: subtotalPaise / 100,
    discount_total: discountPaise / 100,
    grand_total: Math.max(0, subtotalPaise - discountPaise) / 100,
  };
}

/**
 * Returns start-of-day in Asia/Kolkata as a UTC ISO string.
 * Uses date arithmetic based on IST offset (UTC+5:30).
 */
export function istDayStart(daysAgo = 0) {
  const now = new Date();
  // IST offset = +330 minutes
  const istNow = new Date(now.getTime() + 330 * 60 * 1000);
  istNow.setUTCHours(0, 0, 0, 0);
  istNow.setUTCDate(istNow.getUTCDate() - daysAgo);
  // Convert back to UTC
  return new Date(istNow.getTime() - 330 * 60 * 1000).toISOString();
}

export function istDayEnd(daysAgo = 0) {
  const now = new Date();
  const istNow = new Date(now.getTime() + 330 * 60 * 1000);
  istNow.setUTCHours(23, 59, 59, 999);
  istNow.setUTCDate(istNow.getUTCDate() - daysAgo);
  return new Date(istNow.getTime() - 330 * 60 * 1000).toISOString();
}
