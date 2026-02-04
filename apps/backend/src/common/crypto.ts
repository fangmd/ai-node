import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from './env.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function keyBytes(): Buffer {
  // Accept arbitrary secret length; derive a stable 32-byte key.
  return createHash('sha256').update(config.llm.encryptionSecret).digest();
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = (s + pad).replaceAll('-', '+').replaceAll('_', '/');
  return Buffer.from(b64, 'base64');
}

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, keyBytes(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${b64urlEncode(iv)}.${b64urlEncode(tag)}.${b64urlEncode(ciphertext)}`;
}

export function decryptApiKey(enc: string): string {
  const [ivStr, tagStr, dataStr] = enc.split('.');
  if (!ivStr || !tagStr || !dataStr) throw new Error('Invalid encrypted apiKey format');
  const iv = b64urlDecode(ivStr);
  const tag = b64urlDecode(tagStr);
  const data = b64urlDecode(dataStr);
  const decipher = createDecipheriv(ALGO, keyBytes(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

