// Tiny validation helpers. Throw on invalid; route handlers catch and 400.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = new Set(['work', 'health', 'personal']);
const THEMES = new Set(['light', 'dark', 'system']);

export const isTime = (v) => typeof v === 'string' && TIME_RE.test(v);
export const isDate = (v) => typeof v === 'string' && DATE_RE.test(v);
export const isCategory = (v) => CATEGORIES.has(v);
export const isTheme = (v) => THEMES.has(v);
export const isDayOfWeek = (v) => Number.isInteger(v) && v >= 0 && v <= 6;

export function requireString(value, field, { max = 500 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${field} is required`);
  }
  if (value.length > max) {
    throw new HttpError(400, `${field} too long`);
  }
  return value;
}
