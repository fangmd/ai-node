import axios from 'axios';
import JSONBig from 'json-bigint';
import { getToken, clearToken } from './auth';

const jsonParser = JSONBig({ storeAsString: true });

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

const request = axios.create({
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
  (res) => {
    if (res.data.code === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return res;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export { request };
