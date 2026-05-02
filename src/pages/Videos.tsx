import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Video as VideoIcon, ArrowUp, ArrowDown, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { compressVideo } from '@/lib/videoCompressor';

type UploadPhase = 'idle' | 'compressing' | 'uploading' | 'saving';

const BUCKET = 'videos';
const SIGNED_URL_TTL = 60 * 60; // 1 hour

async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data.signedUrl;
}

export default function Videos() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

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

  // Resolve signed URLs for each video (path is stored in video_url)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        (videos as any[]).map(async (v) => {
          const path = v.video_url as string;
          if (!path) return [v.id, ''] as const;
          // Backwards-compat: if it's already an absolute URL, just use it
          if (/^https?:\/\//i.test(path)) return [v.id, path] as const;
          const url = await getSignedUrl(path);
          return [v.id, url ?? ''] as const;
        })
      );
      if (!cancelled) {
        setSignedUrls(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videos]);

  const openDialog = (v: any = null) => {
    setEditing(v);
    setTitle(v?.title ?? '');
    setDescription(v?.description ?? '');
    setVideoFile(null);
    setProgress(0);
    setPhase('idle');
    setDialogOpen(true);
  };

  const resetUploadState = () => {
    setPhase('idle');
    setProgress(0);
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

    try {
      let storagePath: string = editing?.video_url ?? '';

      if (videoFile) {
        // 1. Compress
        setPhase('compressing');
        setProgress(0);
        const compressed = await compressVideo(videoFile, {
          onProgress: (r) => setProgress(Math.round(r * 100)),
        });

        // 2. Upload to private bucket
        setPhase('uploading');
        setProgress(0);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, compressed, {
            contentType: 'video/mp4',
            upsert: false,
          });
        if (upErr) throw upErr;
        storagePath = fileName;
        setProgress(100);
      }

      setPhase('saving');

      if (editing) {
        const { error } = await supabase
          .from('videos')
          .update({ title, description, video_url: storagePath })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Vídeo atualizado');
      } else {
        const maxPos = (videos as any[]).reduce(
          (m: number, v: any) => Math.max(m, v.position ?? 0),
          0
        );
        const { error } = await supabase
          .from('videos')
          .insert({ title, description, video_url: storagePath, position: maxPos + 1 });
        if (error) throw error;
        toast.success('Vídeo adicionado');
      }

      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar');
    } finally {
      resetUploadState();
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (v: any) => {
      const path = v.video_url as string;
      try {
        if (path && !/^https?:\/\//i.test(path)) {
          await supabase.storage.from(BUCKET).remove([path]);
        } else if (path) {
          // legacy public URL — try to extract path
          const url = new URL(path);
          const idx = url.pathname.indexOf(`/${BUCKET}/`);
          if (idx >= 0) {
            const p = url.pathname.slice(idx + BUCKET.length + 2);
            await supabase.storage.from(BUCKET).remove([decodeURIComponent(p)]);
          }
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

  const isWorking = phase !== 'idle';
  const phaseLabel =
    phase === 'compressing'
      ? 'Comprimindo arquivo...'
      : phase === 'uploading'
      ? 'Enviando vídeo...'
      : phase === 'saving'
      ? 'Salvando...'
      : '';

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
          {(videos as any[]).map((v: any, i: number) => {
            const src = signedUrls[v.id];
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-all duration-300">
                  <div className="relative bg-black">
                    {src ? (
                      <video
                        src={src}
                        controls
                        preload="metadata"
                        className="w-full h-52 object-contain bg-black"
                      />
                    ) : (
                      <div className="w-full h-52 flex items-center justify-center bg-black">
                        <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
                      </div>
                    )}
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
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !isWorking && setDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar vídeo' : 'Adicionar vídeo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do vídeo"
                disabled={isWorking}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                disabled={isWorking}
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
                disabled={isWorking}
              >
                <Upload className="h-4 w-4 mr-2" />
                {videoFile ? videoFile.name : 'Selecionar arquivo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                O vídeo será comprimido para MP4 720p antes do envio.
              </p>
            </div>

            {isWorking && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{phaseLabel}</span>
                  {phase !== 'saving' && (
                    <span className="ml-auto text-xs text-muted-foreground">{progress}%</span>
                  )}
                </div>
                {phase !== 'saving' && <Progress value={progress} className="h-2" />}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={isWorking}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isWorking}>
                {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
