const MAX_FREE_GUEST_SCANS = 3;
const SCAN_COUNT_KEY = 'math_scan_guest_count';

function getCount(): number {
  if (typeof window === 'undefined') return 0;
  const value = Number.parseInt(localStorage.getItem(SCAN_COUNT_KEY) || '0', 10);
  return Number.isFinite(value) ? Math.min(MAX_FREE_GUEST_SCANS, Math.max(0, value)) : 0;
}
export function getCompletedGuestScans(): number { return getCount(); }
export function getRemainingGuestScans(): number { return Math.max(0, MAX_FREE_GUEST_SCANS - getCount()); }
export function incrementGuestScanCount(): number {
  const updated = Math.min(MAX_FREE_GUEST_SCANS, getCount() + 1);
  localStorage.setItem(SCAN_COUNT_KEY, String(updated));
  window.dispatchEvent(new CustomEvent('guest-scan-count-changed', { detail: updated }));
  return updated;
}
