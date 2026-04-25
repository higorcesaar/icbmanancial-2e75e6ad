import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, UserCheck, UserX, Trash2, KeyRound, BellRing, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const translateError = (error: string) => {
  if (error.includes('Password is known to be weak')) {
    return 'A senha é muito fraca e fácil de adivinhar. Escolha uma senha mais forte.';
  }
  if (error.includes('User already registered') || error.includes('already exists')) {
    return 'Este email já está cadastrado no sistema.';
  }
  if (error.includes('Invalid login credentials')) {
    return 'Email ou senha inválidos.';
  }
  return error;
};

const ensureSession = async () => {
  // Proactively refresh session to avoid stale tokens
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error || !session) {
    console.error('Falha ao renovar sessão:', error);
    toast.error('Sessão expirada. Por favor, saia e entre novamente.');
    throw new Error('Unauthorized');
  }
  return session;
};

export default function UserManagement() {
  const { isAdmin, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [rawError, setRawError] = useState<string | null>(null);

  const { data: profiles = [], isLoading, error: queryError } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      setRawError(null);
      console.log('Buscando perfis...');
      
      // Fetch profiles first
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');
      
      if (pError) {
        setRawError(pError.message);
        throw pError;
      }

      console.log('Buscando cargos...');
      // Fetch all roles separately to avoid join issues
      const { data: rData, error: rError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rError) {
        console.warn('Erro ao carregar cargos, usando padrão:', rError.message);
      }

      const rolesMap = new Map((rData || []).map(r => [r.user_id, r.role]));
      
      const merged = (pData || []).map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || 'ministra'
      }));

      console.log('Usuários carregados com sucesso:', merged.length);
      return merged;
    },
  });

  const toggleActive = async (profile: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', profile.id);
    if (error) {
      console.error('Erro ao alternar status:', error);
      toast.error('Erro ao atualizar status: ' + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
    toast.success(profile.is_active ? 'Conta desativada' : 'Conta ativada');
  };

  const changeRole = async (profile: any, newRole: string) => {
    if (profile.role === newRole) return;
    try {
      // profile.id is profiles.id; we need the auth user_id
      const targetUserId = profile.user_id ?? profile.id;

      const { error: delErr } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUserId, role: newRole as any });
      if (insErr) throw insErr;

      await queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success(`Permissão ${newRole === 'admin' ? 'de Admin' : 'de Ministra'} atualizada ✨`);
    } catch (err: any) {
      console.error('Erro ao atualizar cargo:', err);
      toast.error('Erro ao salvar permissão: ' + (err.message ?? 'desconhecido'));
    }
  };

  const deleteUser = async (profile: any) => {
    if (profile.id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir ${profile.display_name ?? profile.email}?`)) return;
    try {
      await ensureSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { action: 'delete', user_id: profile.id },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success('Usuário excluído');
    } catch (err: any) {
      toast.error(translateError(err.message || 'Erro ao excluir'));
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      await ensureSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { action: 'change_password', user_id: passwordDialog.id, new_password: newPassword },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success('Senha alterada ✨');
      setPasswordDialog(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(translateError(err.message || 'Erro ao alterar senha'));
    } finally {
      setChangingPassword(false);
    }
  };

  const approveRequest = async (profile: any) => {
    try {
      await ensureSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { action: 'approve_request', profile_id: profile.id },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      await queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
      toast.success(`${profile.display_name ?? profile.email} foi aprovada e adicionada às Ministras 💖`);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao aprovar');
    }
  };

  const rejectRequest = async (profile: any) => {
    if (!confirm(`Recusar a solicitação de ${profile.display_name ?? profile.email}?`)) return;
    try {
      await ensureSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { action: 'reject_request', profile_id: profile.id },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      await queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
      toast.success('Solicitação recusada');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao recusar');
    }
  };

  // Non-admin: show only their own login info
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Meu Login</h2>
        <Card className="glass-card border-0">
          <CardContent className="p-6 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Email / Login</p>
              <p className="text-lg font-semibold text-foreground mt-1">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Nome</p>
              <p className="text-foreground mt-1">{currentUser?.user_metadata?.display_name ?? currentUser?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Usuários</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{profiles.length} cadastro{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
        </div>
      )}

      {queryError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <UserX className="h-10 w-10 text-destructive mb-2" />
            <p className="font-bold text-destructive">Erro ao carregar usuários</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              O banco de dados não respondeu como esperado. Verifique sua conexão ou se a migração foi aplicada.
            </p>
            {rawError && (
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-1 max-w-full truncate px-4">
                Detalhe: {rawError}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] })} className="mt-2">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !queryError && (() => {
        const pending = profiles.filter((p: any) => p.status === 'pending');
        const approved = profiles.filter((p: any) => p.status !== 'pending');
        return (
          <>
            {/* Pending requests section */}
            <AnimatePresence>
              {pending.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-destructive">
                      Solicitações Pendentes ({pending.length})
                    </h3>
                  </div>
                  {pending.map((p: any, i: number) => (
                    <motion.div key={p.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-2 border-destructive/30 bg-destructive/5 shadow-lg">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            {p.request_photo_url ? (
                              <img src={p.request_photo_url} alt={p.display_name} className="w-16 h-16 rounded-full object-cover border-2 border-destructive/40 shrink-0" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center text-xl font-bold text-destructive shrink-0">
                                {(p.display_name ?? p.email ?? '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-foreground">{p.display_name ?? p.email}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                              <Badge variant="destructive" className="mt-1.5 text-[10px]">Aguardando aprovação</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => approveRequest(p)} className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                              <Check className="h-4 w-4 mr-1.5" /> Aprovar
                            </Button>
                            <Button onClick={() => rejectRequest(p)} variant="outline" className="flex-1 h-10 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
                              <X className="h-4 w-4 mr-1.5" /> Recusar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Approved users */}
            <div className="space-y-3">
              {approved.map((p: any, i: number) => {
                const role = p.role;
                const isSelf = p.id === currentUser?.id;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="glass-card border-0 hover:shadow-rose transition-shadow duration-300">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.display_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {(p.display_name ?? p.email ?? '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-foreground text-sm sm:text-base">{p.display_name ?? p.email}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {p.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Select value={role} onValueChange={v => changeRole(p, v)}>
                            <SelectTrigger className="flex-1 min-w-[110px] rounded-xl bg-muted/30 border-border/40 text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin"><div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</div></SelectItem>
                              <SelectItem value="ministra">Ministra</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1 ml-auto">
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-primary/10" title="Alterar senha" onClick={() => { setPasswordDialog(p); setNewPassword(''); }}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-primary/10" onClick={() => toggleActive(p)}>
                              {p.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </Button>
                            {!isSelf && (
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteUser(p)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        );
      })()}

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
        setDialogOpen(false);
      }} />

      {/* Change Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => !open && !changingPassword && setPasswordDialog(null)} disableBackButtonClose>
        <DialogContent
          className="rounded-2xl border-0 glass-card"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Alterar Senha
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}
            className="space-y-4 mt-2"
          >
            <p className="text-sm text-muted-foreground">
              Alterando senha de <strong>{passwordDialog?.display_name ?? passwordDialog?.email}</strong>
            </p>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nova Senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="rounded-xl bg-muted/30 border-border/40"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPasswordDialog(null)} disabled={changingPassword} className="flex-1 h-11 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={changingPassword} className="flex-1 h-11">
                {changingPassword ? 'Alterando...' : 'Confirmar 💖'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange, onCreated }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('ministra');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!email || !password) return;
    setSaving(true);
    try {
      await ensureSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { email, password, display_name: displayName || email, role },
      });
      if (res.error) throw new Error(res.error.message || 'Erro ao criar usuário');
      if (res.data?.error) throw new Error(res.data.error);

      toast.success('Usuário criado com carinho ✨');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('ministra');
      onCreated();
    } catch (err: any) {
      toast.error(translateError(err.message || 'Erro ao criar usuário'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-0 glass-card">
        <DialogHeader><DialogTitle className="text-xl font-bold">Adicionar Usuário</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nome de exibição" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Senha</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Permissão</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-xl bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Líder)</SelectItem>
                <SelectItem value="ministra">Ministra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={saving} className="w-full h-12 rounded-xl gradient-rose text-white font-semibold border-0 shadow-rose hover:opacity-90">
            {saving ? 'Criando...' : 'Criar usuário 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
