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
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // Also check hash
    if (window.location.hash.includes('type=recovery')) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
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
      toast.success('Senha atualizada com sucesso! 💖');
      navigate('/login');
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
            <CardTitle>Verificando...</CardTitle>
            <CardDescription>Aguarde enquanto verificamos seu link de redefinição.</CardDescription>
          </CardHeader>
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
