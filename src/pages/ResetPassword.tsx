import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
        setCheckingLink(false);
      }
    });

    // The link must originate from an e-mail recovery request; do not
    // display a password form solely because a URL contains type=recovery.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const hasRecoveryLink = params.get('type') === 'recovery' ||
      query.get('type') === 'recovery' || query.has('code');
    const verifyLink = async () => {
      if (hasRecoveryLink) {
        const { data, error } = await supabase.auth.getSession();
        if (active && !error && data.session) setReady(true);
      }
      if (active) setCheckingLink(false);
    };
    void verifyLink().catch(() => { if (active) setCheckingLink(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // A recovery session must not remain active after the password changes.
      await supabase.auth.signOut();
      toast.success('Senha atualizada com sucesso! Entre novamente com a nova senha. 💖');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, hsl(340, 33%, 99%) 0%, hsl(340, 60%, 94%) 50%, hsl(270, 60%, 92%) 100%)' }}>
        <Card className="w-full max-w-md shadow-lg border-none">
          <CardHeader className="text-center space-y-2">
            <span className="text-3xl">🪷</span>
            <CardTitle>{checkingLink ? 'Verificando...' : 'Link de recuperação inválido'}</CardTitle>
            <CardDescription>
              {checkingLink
                ? 'Aguarde enquanto verificamos seu link de redefinição.'
                : 'Solicite um novo link na tela de login. Links expirados ou já utilizados não podem ser reutilizados.'}
            </CardDescription>
          </CardHeader>
          {!checkingLink && (
            <CardContent>
              <Button type="button" onClick={() => navigate('/login', { replace: true })} className="w-full">
                Voltar ao login
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, hsl(340, 33%, 99%) 0%, hsl(340, 60%, 94%) 50%, hsl(270, 60%, 92%) 100%)' }}>
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-2">
          <span className="text-3xl">🪷</span>
          <CardTitle className="text-2xl">Nova Senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nova senha</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar senha</label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
