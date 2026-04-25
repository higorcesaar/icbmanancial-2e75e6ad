import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Accessories() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useRealtimeTable('accessories', [['accessories'], ['accessories-all']]);

  const { data: accessories = [] } = useQuery({
    queryKey: ['accessories'],
    queryFn: async () => {
      const { data } = await supabase.from('accessories').select('*').order('name');
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('accessories').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accessories'] }); toast.success('Acessório removido'); },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Acessórios</h2>
          <p className="text-sm text-muted-foreground mt-1">Itens para complementar as apresentações</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessories.map((a: any, i: number) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="glass-card border-0 group hover:shadow-rose transition-all duration-300 overflow-hidden">
              {a.image_url ? (
                <img src={a.image_url} alt={a.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-accent/25" />
                </div>
              )}
              <CardContent className="p-4">
                <p className="font-bold text-foreground">{a.name}</p>
                {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                {isAdmin && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => { setEditing(a); setDialogOpen(true); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AccessoryDialog open={dialogOpen} onOpenChange={setDialogOpen} accessory={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['accessories'] });
        setDialogOpen(false);
      }} />
    </div>
  );
}

function AccessoryDialog({ open, onOpenChange, accessory, onSaved }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(accessory?.name ?? '');
      setDescription(accessory?.description ?? '');
      setImageFile(null);
    }
  }, [open, accessory]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let imageUrl = accessory?.image_url ?? null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `accessories/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('outfits').upload(path, imageFile);
        if (!error) {
          const { data } = supabase.storage.from('outfits').getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      if (accessory) {
        await supabase.from('accessories').update({ name, description: description || null }).eq('id', accessory.id);
      } else {
        await supabase.from('accessories').insert({ name, description: description || null });
      }
      toast.success('Acessório salvo ✨');
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
        <DialogHeader><DialogTitle className="text-xl font-bold">{accessory ? 'Editar Acessório' : 'Novo Acessório'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tecido, Bambu..." className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Descrição</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição opcional" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Imagem</label>
            <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="rounded-xl" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-rose text-white font-semibold border-0 shadow-rose hover:opacity-90">
            {saving ? 'Salvando...' : 'Salvar 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
