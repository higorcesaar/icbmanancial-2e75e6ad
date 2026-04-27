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
import { Plus, Pencil, Trash2, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { OutfitViewer } from '@/components/OutfitViewer';

export default function Accessories() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);

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
        {accessories.map((a: any, i: number) => {
          const cover = (a as any).image_front_url ?? a.image_url ?? (a as any).image_back_url;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card border-0 group hover:shadow-rose transition-all duration-300 overflow-hidden">
                <button onClick={() => setViewing(a)} className="block w-full text-left">
                  {cover ? (
                    <img src={cover} alt={a.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-accent/25" />
                    </div>
                  )}
                </button>
                <CardContent className="p-4">
                  <p className="font-bold text-foreground">{a.name}</p>
                  {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => setViewing(a)}>
                      <Eye className="h-3 w-3 mr-1" /> Ver 360°
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => { setEditing(a); setDialogOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AccessoryDialog open={dialogOpen} onOpenChange={setDialogOpen} accessory={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['accessories'] });
        setDialogOpen(false);
      }} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="rounded-2xl border-0 glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <OutfitViewer
              frontUrl={(viewing as any).image_front_url}
              backUrl={(viewing as any).image_back_url}
              fallbackUrl={viewing.image_url}
              name={viewing.name}
            />
          )}
          {viewing?.description && (
            <p className="text-sm text-muted-foreground">{viewing.description}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessoryDialog({ open, onOpenChange, accessory, onSaved }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(accessory?.name ?? '');
      setDescription(accessory?.description ?? '');
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(accessory?.image_front_url ?? accessory?.image_url ?? null);
      setBackPreview(accessory?.image_back_url ?? null);
    }
  }, [open, accessory]);

  const handleFile = (file: File | null, side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFile(file);
      setFrontPreview(file ? URL.createObjectURL(file) : (accessory?.image_front_url ?? accessory?.image_url ?? null));
    } else {
      setBackFile(file);
      setBackPreview(file ? URL.createObjectURL(file) : (accessory?.image_back_url ?? null));
    }
  };

  const uploadOne = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `accessories/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('outfits').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('outfits').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let frontUrl = accessory?.image_front_url ?? null;
      let backUrl = accessory?.image_back_url ?? null;

      if (frontFile) frontUrl = (await uploadOne(frontFile)) ?? frontUrl;
      if (backFile) backUrl = (await uploadOne(backFile)) ?? backUrl;

      const payload: any = {
        name,
        description: description || null,
        image_front_url: frontUrl,
        image_back_url: backUrl,
        image_url: frontUrl ?? accessory?.image_url ?? null,
      };

      if (accessory) {
        await supabase.from('accessories').update(payload).eq('id', accessory.id);
      } else {
        await supabase.from('accessories').insert(payload);
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
      <DialogContent className="rounded-2xl border-0 glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-bold">{accessory ? 'Editar Acessório' : 'Novo Acessório'}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tecido, Bambu..." className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Descrição</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição opcional" className="rounded-xl bg-muted/30 border-border/40" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Foto da Frente</label>
              {frontPreview ? (
                <img src={frontPreview} alt="Frente" className="w-full aspect-[3/4] object-cover rounded-xl border border-border/40" />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => handleFile(e.target.files?.[0] ?? null, 'front')}
                className="rounded-xl text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:px-2 file:py-1"
              />
              <p className="text-[10px] text-muted-foreground/70 text-center">Galeria, câmera ou arquivo</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Foto das Costas</label>
              {backPreview ? (
                <img src={backPreview} alt="Costas" className="w-full aspect-[3/4] object-cover rounded-xl border border-border/40" />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40 scale-x-[-1]" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => handleFile(e.target.files?.[0] ?? null, 'back')}
                className="rounded-xl text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:px-2 file:py-1"
              />
              <p className="text-[10px] text-muted-foreground/70 text-center">Galeria, câmera ou arquivo</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12">
            {saving ? 'Salvando...' : 'Salvar 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
