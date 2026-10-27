/** Send a one-time login link only to an existing Supabase Auth account. */
export async function sendExistingAccountMagicLink(
  auth: { signInWithOtp: (credentials: {
    email: string;
    options: { shouldCreateUser: false; emailRedirectTo: string };
  }) => Promise<{ error: { message: string } | null }> },
  email: string,
  origin: string,
) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }
  const emailRedirectTo = new URL('/', origin).toString();
  const { error } = await auth.signInWithOtp({
    email: normalized,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
  if (error) throw error;
}
