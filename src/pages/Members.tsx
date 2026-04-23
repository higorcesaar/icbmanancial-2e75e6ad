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
import { Plus, Pencil, Trash2, Camera } from 'lucide-react';
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {members.map((m: any, i: number) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="glass-card border-0 group hover:shadow-rose transition-all duration-300 relative">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    className="w-24 h-24 rounded-full object-cover shadow-rose ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full gradient-rose flex items-center justify-center text-white font-bold text-2xl shadow-rose">
                    {m.name.charAt(0)}
                  </div>
                )}
                <div className="w-full min-w-0 space-y-1.5">
                  <p className="font-bold text-foreground text-sm leading-tight line-clamp-2">{m.name}</p>
                  <Badge className={`text-[10px] ${m.status === 'active' ? 'bg-primary/15 text-primary border-0' : 'bg-muted text-muted-foreground border-0'}`}>
                    {m.status === 'active' ? '● Ativa' : '○ Inativa'}
                  </Badge>
                </div>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 bg-background/80 backdrop-blur hover:bg-primary/10" onClick={() => { setEditing(m); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        setDialogOpen(false);
      }} />
    </div>
  );
}

function MemberDialog({ open, onOpenChange, member, onSaved }: any) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(member?.name ?? '');
      setStatus(member?.status ?? 'active');
      setNotes(member?.notes ?? '');
      setPhotoFile(null);
      setPhotoPreview(member?.photo_url ?? null);
    }
  }, [open, member]);

  const handleFile = (file: File | null) => {
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : (member?.photo_url ?? null));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('members').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('members').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let photoUrl = member?.photo_url ?? null;
      if (photoFile) photoUrl = (await uploadPhoto(photoFile)) ?? photoUrl;

      const payload = { name, status, notes: notes || null, photo_url: photoUrl };

      if (member) {
        await supabase.from('members').update(payload).eq('id', member.id);
      } else {
        await supabase.from('members').insert(payload);
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
      <DialogContent className="rounded-2xl border-0 glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-bold">{member ? 'Editar Ministra' : 'Nova Ministra'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Foto</label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Pré-visualização"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-muted/30 border border-dashed border-border flex items-center justify-center shrink-0">
                  <Camera className="h-7 w-7 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFile(e.target.files?.[0] ?? null)}
                  className="rounded-xl text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:px-2 file:py-1"
                />
                <p className="text-[10px] text-muted-foreground/70">Galeria, câmera ou arquivo</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da ministra" className="rounded-xl bg-muted/30 border-border/40" />
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
