import { hashPassword, verifyPassword } from './security';

// Mirrors tests/unit/test_security.py's password-hashing cases.
describe('security', () => {
  it('round-trips a password through hash/verify', async () => {
    const hashed = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('correct-horse-battery-staple', hashed)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hashed = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('wrong-password', hashed)).toBe(false);
  });
});
