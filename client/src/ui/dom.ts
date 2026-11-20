// helpers for other files

const ESCAPES: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

// looks up the safe replacement for one special character
function escapeCharacter(c: string): string {
  return ESCAPES[c];
}

// makes text safe to put inside HTML, so a name like <b> shows as text instead of being treated as HTML
export function esc(text: string): string {
  return text.replace(/[&<>"']/g, escapeCharacter);
}

// turns a time in milliseconds into text like "3:56 PM"
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// finds an element on the page by its id, and stops with a clear message if it is missing
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}