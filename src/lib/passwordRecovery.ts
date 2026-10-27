// Recovery requests use a short-lived link sent by Supabase Auth.
// A password is never sent to the app backend or stored in the repository.
type RecoveryAuth = {
  resetPasswordForEmail: (
    email: string,
    options: { redirectTo: string },
  ) => Promise<{ error: Error | null }>;
};

export async function requestRecoveryEmail(auth: RecoveryAuth, email: string, origin: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('Informe um endereço de e-mail.');
  const redirectTo = new URL('/reset-password', origin).toString();
  const { error } = await auth.resetPasswordForEmail(normalized, { redirectTo });
  if (error) throw error;
}
