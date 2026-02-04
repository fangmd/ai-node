import axios from 'axios';
import JSONBig from 'json-bigint';
import { getToken, clearToken } from './auth';

const LOGIN_PATH = '/api/auth/login';

const jsonParser = JSONBig({ storeAsString: true });

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

export const request = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  transformResponse: [
    (data: unknown) => {
      if (typeof data !== 'string') return data;
      try {
        return jsonParser.parse(data);
      } catch {
        return data;
      }
    },
  ],
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      const url = err.config?.url ?? '';
      if (!url.includes(LOGIN_PATH)) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(err);
  }
);
