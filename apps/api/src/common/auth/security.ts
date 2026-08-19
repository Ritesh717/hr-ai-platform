import * as bcrypt from 'bcrypt';

// Mirrors shared/auth/security.py: bcrypt has its own 72-byte plaintext limit, and node's
// `bcrypt` package (unlike Python's manual truncation) will throw on longer inputs, so we
// truncate explicitly here rather than relying on the library to do it silently.
const BCRYPT_MAX_BYTES = 72;
const SALT_ROUNDS = 10;

function truncateToBcryptLimit(plain: string): string {
  return Buffer.from(plain, 'utf-8').subarray(0, BCRYPT_MAX_BYTES).toString('utf-8');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(truncateToBcryptLimit(plain), SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(truncateToBcryptLimit(plain), hashed);
}
