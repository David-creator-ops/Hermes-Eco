/**
 * Input sanitization utility
 * - Strips HTML tags
 * - Trims whitespace
 * - Escapes dangerous characters
 * - Validates URLs
 */

// Escape dangerous characters like < > & " '
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Strip all HTML tags
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// Validate URL: must start with http:// or https://
export function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  // Strip HTML, trim, escape, limit length
  return escapeHtml(stripHtml(input.trim().slice(0, maxLength)));
}

export function sanitizeDescription(input: string): string {
  return sanitizeText(input, 2000);
}

export function sanitizeName(input: string): string {
  return sanitizeText(input, 200);
}

export function sanitizeMessage(input: string): string {
  return sanitizeText(input, 500);
}

export function sanitizeGithubUrl(input: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!isValidUrl(trimmed)) return null;
  return trimmed;
}

export function sanitizeEmail(input: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (!isValidEmail(trimmed)) return null;
  return trimmed;
}
