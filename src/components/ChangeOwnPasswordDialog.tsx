import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ChangeOwnPasswordDialog({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  const clear = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Escolha uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmation) {
      toast.error('As novas senhas não coincidem.');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da atual.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        current_password: currentPassword,
        password: newPassword,
      });
      if (error) throw error;
      await supabase.auth.signOut();
      clear();
      setOpen(false);
      toast.success('Senha alterada. Entre novamente com sua nova senha.');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      console.error('Não foi possível alterar a senha:', message);
      toast.error('Falha ao alterar a senha. Confira a senha atual ou as exigências de segurança.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) clear(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl">
          <KeyRound className="h-4 w-4 mr-2" />
          {!collapsed && 'Alterar senha'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar minha senha</DialogTitle>
          <DialogDescription>Informe sua senha atual e escolha uma nova senha. Esta opção exige que você já esteja conectado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span>Senha atual</span>
            <Input type="password" autoComplete="current-password" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Nova senha</span>
            <Input type="password" autoComplete="new-password" minLength={8} value={newPassword}
              onChange={e => setNewPassword(e.target.value)} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Confirme a nova senha</span>
            <Input type="password" autoComplete="new-password" minLength={8} value={confirmation}
              onChange={e => setConfirmation(e.target.value)} required />
          </label>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
