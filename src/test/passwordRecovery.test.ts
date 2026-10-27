import { describe, expect, it, vi } from 'vitest';
import { requestRecoveryEmail } from '@/lib/passwordRecovery';

describe('requestRecoveryEmail', () => {
  it('sends the normalized email to Supabase using same-origin callback', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    await requestRecoveryEmail(
      { resetPasswordForEmail },
      '  EXAMPLE@HOTMAIL.COM  ',
      'https://manancial.example.com'
    );
    expect(resetPasswordForEmail).toHaveBeenCalledOnce();
    expect(resetPasswordForEmail).toHaveBeenCalledWith('example@hotmail.com', {
      redirectTo: 'https://manancial.example.com/reset-password',
    });
  });

  it('never makes requests for empty addresses', async () => {
    const resetPasswordForEmail = vi.fn();
    await expect(requestRecoveryEmail({ resetPasswordForEmail }, ' ', 'https://example.com'))
      .rejects.toThrow('Informe um endereço');
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('propagates Supabase errors without claiming the email was sent', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: new Error('rate limit') });
    await expect(requestRecoveryEmail({ resetPasswordForEmail }, 'test@example.com', 'https://example.com'))
      .rejects.toThrow('rate limit');
  });
});
