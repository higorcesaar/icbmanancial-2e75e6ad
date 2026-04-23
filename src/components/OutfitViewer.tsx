import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shirt, RotateCw, Pause, Play } from 'lucide-react';

interface OutfitViewerProps {
  frontUrl?: string | null;
  backUrl?: string | null;
  fallbackUrl?: string | null;
  name?: string;
}

/**
 * 3D flip-card viewer — front/back photos rendered as faces of a real 3D card
 * that rotates around the Y axis with depth and perspective.
 */
export function OutfitViewer({ frontUrl, backUrl, fallbackUrl, name }: OutfitViewerProps) {
  const front = frontUrl ?? fallbackUrl ?? null;
  const back = backUrl ?? fallbackUrl ?? null;
  const hasBoth = !!front && !!back && front !== back;

  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(hasBoth);

  useEffect(() => {
    if (!autoRotate || !hasBoth) return;
    const id = setInterval(() => setRotation(r => r + 180), 3500);
    return () => clearInterval(id);
  }, [autoRotate, hasBoth]);

  if (!front && !back) {
    return (
      <div className="aspect-[3/4] w-full rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <Shirt className="h-20 w-20 text-primary/25" />
      </div>
    );
  }

  const showingBack = ((rotation % 360) + 360) % 360 >= 90 && ((rotation % 360) + 360) % 360 < 270;

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[3/4] w-full rounded-2xl bg-gradient-to-br from-muted/40 via-background to-muted/20"
        style={{ perspective: '1400px' }}
      >
        {/* Soft floor shadow */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/30 blur-xl rounded-full" />

        <motion.div
          className="absolute inset-3 rounded-2xl"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: rotation }}
          transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
          drag={!autoRotate ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDrag={(_, info) => {
            if (!autoRotate) setRotation(r => r + info.delta.x * 0.7);
          }}
        >
          {/* FRONT face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-muted"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <img
              src={front ?? back ?? undefined}
              alt={`${name ?? 'Fardamento'} - frente`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-bold uppercase tracking-wider text-foreground border border-border/40">
              Frente
            </div>
          </div>

          {/* BACK face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-muted"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <img
              src={back ?? front ?? undefined}
              alt={`${name ?? 'Fardamento'} - costas`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-bold uppercase tracking-wider text-foreground border border-border/40">
              Costas
            </div>
          </div>
        </motion.div>

        {hasBoth && !autoRotate && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 pointer-events-none">
            ← Arraste para girar →
          </p>
        )}
      </div>

      {hasBoth && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={!showingBack ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl"
            onClick={() => { setRotation(0); setAutoRotate(false); }}
          >
            Frente
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setAutoRotate(a => !a)}
            title={autoRotate ? 'Pausar rotação' : 'Girar automaticamente'}
          >
            {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant={showingBack ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl"
            onClick={() => { setRotation(180); setAutoRotate(false); }}
          >
            Costas
          </Button>
        </div>
      )}

      {!hasBoth && (front || back) && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
          <RotateCw className="h-3 w-3" />
          Adicione foto de {front ? 'costas' : 'frente'} para visualização 3D completa
        </p>
      )}
    </div>
  );
}
