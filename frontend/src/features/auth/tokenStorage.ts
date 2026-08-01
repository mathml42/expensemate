const TOKEN_KEY = "expensemate_access_token";

export function getStoredToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}
