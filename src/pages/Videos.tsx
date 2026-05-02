import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Video as VideoIcon, ArrowUp, ArrowDown, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Videos() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useRealtimeTable('videos', [['videos']]);

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      return data ?? [];
    },
  });

  const openDialog = (v: any = null) => {
    setEditing(v);
    setTitle(v?.title ?? '');
    setDescription(v?.description ?? '');
    setVideoFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Informe um título');
      return;
    }
    if (!editing && !videoFile) {
      toast.error('Selecione um vídeo');
      return;
    }

    setUploading(true);
    try {
      let video_url = editing?.video_url ?? '';

      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile, { contentType: videoFile.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
        video_url = data.publicUrl;
      }

      if (editing) {
        const { error } = await supabase
          .from('videos')
          .update({ title, description, video_url })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Vídeo atualizado');
      } else {
        const maxPos = videos.reduce((m: number, v: any) => Math.max(m, v.position ?? 0), 0);
        const { error } = await supabase
          .from('videos')
          .insert({ title, description, video_url, position: maxPos + 1 });
        if (error) throw error;
        toast.success('Vídeo adicionado');
      }

      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar');
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (v: any) => {
      // try to delete file from storage
      try {
        const url = new URL(v.video_url);
        const idx = url.pathname.indexOf('/videos/');
        if (idx >= 0) {
          const path = url.pathname.slice(idx + '/videos/'.length);
          await supabase.storage.from('videos').remove([decodeURIComponent(path)]);
        }
      } catch {}
      const { error } = await supabase.from('videos').delete().eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo removido');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao remover'),
  });

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= videos.length) return;
    const a = videos[index] as any;
    const b = videos[target] as any;
    await Promise.all([
      supabase.from('videos').update({ position: b.position }).eq('id', a.id),
      supabase.from('videos').update({ position: a.position }).eq('id', b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['videos'] });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vídeos</h2>
          <p className="text-sm text-muted-foreground mt-1">Biblioteca de vídeos do ministério</p>
        </div>
        {isAdmin && (
          <Button onClick={() => openDialog(null)}>
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar
          </Button>
        )}
      </div>

      {videos.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-16 text-center">
            <VideoIcon className="h-14 w-14 mx-auto text-primary/30 mb-3" />
            <p className="text-muted-foreground">Nenhum vídeo adicionado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v: any, i: number) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-all duration-300">
                <div className="relative bg-black">
                  <video
                    src={v.video_url}
                    controls
                    preload="metadata"
                    className="w-full h-52 object-contain bg-black"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
                    #{i + 1}
                  </span>
                </div>
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-bold text-foreground text-lg">{v.title}</h3>
                  {v.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                  )}
                  {isAdmin && (
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => move(i, 1)}
                        disabled={i === videos.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl flex-1"
                        onClick={() => openDialog(v)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          if (confirm(`Remover "${v.title}"?`)) deleteMutation.mutate(v);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar vídeo' : 'Adicionar vídeo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do vídeo" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {editing ? 'Substituir vídeo (opcional)' : 'Vídeo'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {videoFile ? videoFile.name : 'Selecionar arquivo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">Tamanho máximo: 500MB</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={uploading}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
