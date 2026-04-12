const BASE_URL = 'http://localhost:5000/api';

export interface ApiProductImage {
  id: number;
  url: string;
  priority: number | null;
}

export interface ApiProduct {
  id: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  category: string;
  gender: string;
  status: string | null;
  productUrl: string;
  productType: string;
  condition: string;
  sku: string | null;
  conditionGrade: string | null;
  createdAt: string;
  images: ApiProductImage[];
  hasEmbedding: boolean;
}

export interface ApiScoreEntry {
  image: number;
  text: number;
  final: number;
}

export interface ApiCluster {
  id: number;
  productIds: string[];
  products: ApiProduct[];
  winnerId: string | null;
  scores: Record<string, ApiScoreEntry> | null;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

/* ── Resolver cluster types (slim product shape from /duplicates/) ── */

export interface ApiResolverProduct {
  id: string;
  title: string;
  brand: string;
  description: string;
  gender: string;
  sku: string | null;
  productType: string;
  image: string | null;
}

export interface ApiResolverCluster {
  clusterId: number;
  scores: Record<string, ApiScoreEntry> | null;
  products: ApiResolverProduct[];
}

/* ── Token helpers ── */

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

/* ── Core fetch ── */

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 ) {
    clearToken();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/* ── API calls ── */

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getProducts: (page = 1, perPage = 20, brand?: string, type?: string, q?: string) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (brand) params.set('brand', brand);
    if (type) params.set('type', type);
    if (q) params.set('q', q);
    return request<{ products: ApiProduct[]; total: number; page: number; per_page: number; pages: number }>(
      `/products/?${params}`
    );
  },

  getProductFilters: () =>
    request<{ brands: string[]; productTypes: string[]; category: string[] }>('/products/filters'),

  getDuplicates: () =>
    request<{ clusters: ApiResolverCluster[]; total: number }>('/duplicates/'),

  ingestProducts: (products: object[]) =>
    request<{
      inserted: number;
      skipped: number;
      new_clusters: number;
      products: ApiProduct[];
      validation_errors?: { index: number; missing_fields: string[] }[];
    }>('/ingest/products', {
      method: 'POST',
      body: JSON.stringify(products),
    }),
};
