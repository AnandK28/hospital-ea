// Internally we store dates as ISO (YYYY-MM-DD) for correct sorting/search.
// The UI displays and edits them as DD/MM/YYYY.

export function isoToDisplay(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso; // already in some other format, show as-is
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export function displayToIso(display) {
  if (!display) return "";
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(display.trim());
  if (!m) return display; // not a full valid date yet, pass through
  let [, d, mo, y] = m;
  if (y.length === 2) y = `20${y}`;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function formatDateHeader(ymd) {
  if (!ymd) return "Unknown date";
  const d = new Date(ymd + "T00:00:00");
  if (isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
