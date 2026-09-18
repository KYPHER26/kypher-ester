export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatLongDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const todayISOStr = today.toISOString().slice(0, 10);
  const yestISOStr = yesterday.toISOString().slice(0, 10);
  if (iso === todayISOStr) return 'TODAY';
  if (iso === yestISOStr) return 'YESTERDAY';
  return d
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase();
}

export interface Duration {
  years: number;
  months: number;
  days: number;
}

export function durationSince(startISO: string): Duration {
  const start = new Date(startISO + 'T00:00:00');
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function daysUntil(dateISO: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO + 'T00:00:00');
  target.setFullYear(today.getFullYear());
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
