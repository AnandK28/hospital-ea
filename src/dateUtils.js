// Internally we store dates as ISO (YYYY-MM-DD) for correct sorting/search.
// The UI displays and edits them as DD/MM/YY (2-digit year).

export function isoToDisplay(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso; // already in some other format, show as-is
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y.slice(2)}`;
}

export function displayToIso(display) {
  if (!display) return "";
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(display.trim());
  if (!m) return display; // not a full valid date yet, pass through
  const [, d, mo, yy] = m;
  const yyNum = parseInt(yy, 10);
  const currentYY = new Date().getFullYear() % 100;
  // pivot: two-digit years further in the "future" than today are assumed
  // to be 1900s (sensible for birth dates), otherwise 2000s.
  const century = yyNum > currentYY + 10 ? 1900 : 2000;
  const year = century + yyNum;
  return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Auto-inserts "/" separators as the user types raw digits (DDMMYY -> DD/MM/YY).
export function formatTypingInput(text) {
  const digits = text.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
