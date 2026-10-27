import { describe, expect, it, vi } from 'vitest';
import { sendExistingAccountMagicLink } from '@/lib/magicLinkLogin';

describe('sendExistingAccountMagicLink', () => {
  it('signs in existing accounts only, with a same-origin callback', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    await sendExistingAccountMagicLink(
      { signInWithOtp },
      '  EXAMPLE@HOTMAIL.COM  ',
      'https://manancial.example.com',
    );
    expect(signInWithOtp).toHaveBeenCalledOnce();
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'example@hotmail.com',
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'https://manancial.example.com/',
      },
    });
  });

  it('rejects invalid addresses without any request', async () => {
    const signInWithOtp = vi.fn();
    await expect(sendExistingAccountMagicLink({ signInWithOtp }, 'invalid', 'https://example.com')).rejects.toThrow();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('surfaces an email-service failure', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: new Error('email temporarily unavailable') });
    await expect(sendExistingAccountMagicLink({ signInWithOtp }, 'example@domain.com', 'https://example.com')).rejects.toThrow('email temporarily unavailable');
  });
});
