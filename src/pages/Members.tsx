import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Members() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useRealtimeTable('members', [['members'], ['members-active']]);

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data } = await supabase.from('members').select('*').order('name');
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('members').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast.success('Ministra removida ✨'); },
  });

  // Helper to format birthday display
  const formatBirthday = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  // Check if birthday is today
  const isBirthdayToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    const birthday = new Date(dateStr);
    return today.getDate() === birthday.getDate() && today.getMonth() === birthday.getMonth();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ministras</h2>
          <p className="text-sm text-muted-foreground mt-1">Equipe Manancial</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="rounded-xl gradient-rose text-white border-0 shadow-rose hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m: any, i: number) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="glass-card border-0 group hover:shadow-rose transition-all duration-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-rose shrink-0 ${
                  isBirthdayToday(m.birthday) ? 'gradient-party' : 'gradient-rose'
                }`}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{m.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`text-[10px] ${m.status === 'active' ? 'bg-primary/15 text-primary border-0' : 'bg-muted text-muted-foreground border-0'}`}>
                      {m.status === 'active' ? '● Ativa' : '○ Inativa'}
                    </Badge>
                    {m.birthday && (
                      <Badge className={`text-[10px] ${isBirthdayToday(m.birthday) ? 'bg-amber-500/20 text-amber-600 border-0 animate-pulse' : 'bg-rose-100 text-rose-600 border-0'}`}>
                        <Cake className="h-3 w-3 mr-1" />
                        {isBirthdayToday(m.birthday) ? '🎂 Hoje!' : formatBirthday(m.birthday)}
                      </Badge>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10" onClick={() => { setEditing(m); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['members'] };
        setDialogOpen(false);
      }} />
    </div>
  );
}

function MemberDialog({ open, onOpenChange, member, onSaved }: any) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(member?.name ?? '');
      setStatus(member?.status ?? 'active');
      setBirthday(member?.birthday ?? '');
      setNotes(member?.notes ?? '');
    }
  }, [open, member]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (member) {
        await supabase.from('members').update({ name, status, birthday: birthday || null, notes: notes || null }).eq('id', member.id);
      } else {
        await supabase.from('members').insert({ name, status, birthday: birthday || null, notes: notes || null });
      }
      toast.success('Salvo com carinho ✨');
      onSaved();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-0 glass-card">
        <DialogHeader><DialogTitle className="text-xl font-bold">{member ? 'Editar Ministra' : 'Nova Ministra'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da ministra" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Aniversário</label>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={birthday} 
                onChange={e => setBirthday(e.target.value)} 
                className="rounded-xl bg-muted/30 border-border/40"
              />
              {birthday && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:bg-muted"
                  onClick={() => setBirthday('')}
                  title="Limpar data"
                >
                  <span className="text-lg">✕</span>
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Notas</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações..." className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-rose text-white font-semibold border-0 shadow-rose hover:opacity-90">
            {saving ? 'Salvando...' : 'Salvar 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}