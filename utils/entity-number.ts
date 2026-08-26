export function formatEntityNumber(value: number) {
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return `#${String(safe).padStart(4, '0')}`;
}
