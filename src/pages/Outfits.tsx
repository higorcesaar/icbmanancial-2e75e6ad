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
import { Plus, Pencil, Trash2, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Outfits() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useRealtimeTable('outfits', [['outfits'], ['outfits-all']]);

  const { data: outfits = [] } = useQuery({
    queryKey: ['outfits'],
    queryFn: async () => {
      const { data } = await supabase.from('outfits').select('*').order('name');
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('outfits').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['outfits'] }); toast.success('Fardamento removido'); },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fardamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os fardamentos do ministério</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="rounded-xl gradient-rose text-white border-0 shadow-rose hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {outfits.map((o: any, i: number) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-all duration-300">
              {o.image_url ? (
                <img src={o.image_url} alt={o.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Shirt className="h-12 w-12 text-primary/25" />
                </div>
              )}
              <CardContent className="p-5 space-y-2">
                <h3 className="font-bold text-foreground text-lg">{o.name}</h3>
                {o.description && <p className="text-sm text-muted-foreground line-clamp-2">{o.description}</p>}
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={() => { setEditing(o); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(o.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <OutfitDialog open={dialogOpen} onOpenChange={setDialogOpen} outfit={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['outfits'] });
        setDialogOpen(false);
      }} />
    </div>
  );
}

function OutfitDialog({ open, onOpenChange, outfit, onSaved }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(outfit?.name ?? '');
      setDescription(outfit?.description ?? '');
      setImageFile(null);
    }
  }, [open, outfit]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let imageUrl = outfit?.image_url ?? null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('outfits').upload(path, imageFile);
        if (!error) {
          const { data } = supabase.storage.from('outfits').getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      if (outfit) {
        await supabase.from('outfits').update({ name, description: description || null, image_url: imageUrl }).eq('id', outfit.id);
      } else {
        await supabase.from('outfits').insert({ name, description: description || null, image_url: imageUrl });
      }
      toast.success('Fardamento salvo ✨');
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
        <DialogHeader><DialogTitle className="text-xl font-bold">{outfit ? 'Editar Fardamento' : 'Novo Fardamento'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do fardamento" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Descrição</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição..." className="rounded-xl bg-muted/30 border-border/40" />
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
