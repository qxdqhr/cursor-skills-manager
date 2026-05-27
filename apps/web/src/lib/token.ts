const STORAGE_KEY = 'csm.api.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token.trim());
}

export function clearStoredToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
