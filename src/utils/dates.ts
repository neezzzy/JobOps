export function nowIso() {
  return new Date().toISOString();
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addDaysToIsoDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return addDaysIsoDate(days);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isIsoDate(value?: string | null) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function daysBetweenIso(startValue?: string | null, endValue = todayIsoDate()) {
  if (!startValue) return 0;
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

export function displayDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
