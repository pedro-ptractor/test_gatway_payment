const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3030/api';

const TOKEN_KEY = 'token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? res.statusText);
  }
  return res.json();
}

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  active: boolean;
};

export type CreateBillingPortalSessionResponse = { url: string };

export async function createBillingPortalSession(): Promise<string> {
  const response = await apiFetch<CreateBillingPortalSessionResponse>(
    '/stripe/billing-portal',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  console.log(response);
  return response.url;
}
export async function fetchPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>('/plans');
}

export type CreateCheckoutSessionResponse = { checkoutUrl: string };

export async function createCheckoutSession(
  planId: string,
): Promise<CreateCheckoutSessionResponse> {
  return apiFetch<CreateCheckoutSessionResponse>(
    '/checkout/create-checkout-session',
    {
      method: 'POST',
      body: JSON.stringify({ planId }),
    },
  );
}

// --- Auth ---

export type LoginResponse = { token: string };
export type RegisterResponse = { id: string; name: string; email: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  setToken(data.token);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  console.log(name, email, password);
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export function logout(): void {
  removeToken();
}
