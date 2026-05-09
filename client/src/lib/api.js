import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || '';

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { ...(await authHeader()) } });
  return handle(res);
}

export async function apiSend(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

export const apiPost = (path, body) => apiSend('POST', path, body);
export const apiPut = (path, body) => apiSend('PUT', path, body);
export const apiDelete = (path) => apiSend('DELETE', path);

// multipart/form-data — used for avatar upload. Don't set Content-Type;
// the browser sets the multipart boundary itself.
export async function apiUpload(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...(await authHeader()) },
    body: formData,
  });
  return handle(res);
}
