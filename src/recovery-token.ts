let resetToken = '';

if (typeof window !== 'undefined' && window.location.pathname === '/redefinir-senha') {
  const url = new URL(window.location.href);
  resetToken = url.searchParams.get('token') || '';
  if (url.search) {
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.hash}`);
  }
}

export function getResetToken(): string {
  return resetToken;
}

export function clearResetToken(): void {
  resetToken = '';
}
