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
import { Plus, Pencil, Trash2, Shirt, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { OutfitViewer } from '@/components/OutfitViewer';
import { AvatarVideoModal } from '@/components/AvatarVideoModal';

export default function Outfits() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [avatarOutfit, setAvatarOutfit] = useState<any>(null);

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
        {outfits.map((o: any, i: number) => {
          const cover = o.image_front_url ?? o.image_url ?? o.image_back_url;
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-all duration-300">
                <button onClick={() => setViewing(o)} className="block w-full text-left">
                  {cover ? (
                    <img src={cover} alt={o.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Shirt className="h-12 w-12 text-primary/25" />
                    </div>
                  )}
                </button>
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-bold text-foreground text-lg">{o.name}</h3>
                  {o.description && <p className="text-sm text-muted-foreground line-clamp-2">{o.description}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1 min-w-[110px]" onClick={() => setViewing(o)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver 360°
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl flex-1 min-w-[130px] gradient-rose text-white border-0 shadow-rose hover:opacity-90"
                      onClick={() => setAvatarOutfit(o)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Ver no Avatar
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setEditing(o); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(o.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      <OutfitDialog open={dialogOpen} onOpenChange={setDialogOpen} outfit={editing} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['outfits'] });
        queryClient.invalidateQueries({ queryKey: ['outfits-all'] });
        setDialogOpen(false);
      }} />

      <AvatarVideoModal
        open={!!avatarOutfit}
        onClose={() => setAvatarOutfit(null)}
        title={avatarOutfit?.name}
        videoUrl={avatarOutfit?.video_url}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="rounded-2xl border-0 glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <OutfitViewer
              frontUrl={viewing.image_front_url}
              backUrl={viewing.image_back_url}
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

function OutfitDialog({ open, onOpenChange, outfit, onSaved }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(outfit?.name ?? '');
      setDescription(outfit?.description ?? '');
      setVideoUrl(outfit?.video_url ?? '');
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(outfit?.image_front_url ?? outfit?.image_url ?? null);
      setBackPreview(outfit?.image_back_url ?? null);
    }
  }, [open, outfit]);

  const handleFile = (file: File | null, side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFile(file);
      setFrontPreview(file ? URL.createObjectURL(file) : (outfit?.image_front_url ?? outfit?.image_url ?? null));
    } else {
      setBackFile(file);
      setBackPreview(file ? URL.createObjectURL(file) : (outfit?.image_back_url ?? null));
    }
  };

  const uploadOne = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('outfits').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('outfits').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let frontUrl = outfit?.image_front_url ?? null;
      let backUrl = outfit?.image_back_url ?? null;

      if (frontFile) frontUrl = (await uploadOne(frontFile)) ?? frontUrl;
      if (backFile) backUrl = (await uploadOne(backFile)) ?? backUrl;

      const payload: any = {
        name,
        description: description || null,
        video_url: videoUrl.trim() || null,
        image_front_url: frontUrl,
        image_back_url: backUrl,
        image_url: frontUrl ?? outfit?.image_url ?? null,
      };

      if (outfit) {
        await supabase.from('outfits').update(payload).eq('id', outfit.id);
      } else {
        await supabase.from('outfits').insert(payload);
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
      <DialogContent className="rounded-2xl border-0 glass-card max-h-[90vh] overflow-y-auto">
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
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Vídeo do Avatar 360° (URL)
            </label>
            <Input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://...mp4"
              className="rounded-xl bg-muted/30 border-border/40"
            />
            <p className="text-[10px] text-muted-foreground/70">
              Cole o link público do vídeo 360° do avatar com este fardamento. Deixe vazio para mostrar "em breve".
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Foto da Frente</label>
              {frontPreview ? (
                <img src={frontPreview} alt="Frente" className="w-full aspect-[3/4] object-cover rounded-xl border border-border/40" />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-center">
                  <Shirt className="h-8 w-8 text-muted-foreground/40" />
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
                  <Shirt className="h-8 w-8 text-muted-foreground/40 scale-x-[-1]" />
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

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-rose text-white font-semibold border-0 shadow-rose hover:opacity-90">
            {saving ? 'Salvando...' : 'Salvar 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
