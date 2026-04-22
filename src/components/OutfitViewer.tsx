import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shirt, RotateCw, Pause, Play } from 'lucide-react';

interface OutfitViewerProps {
  frontUrl?: string | null;
  backUrl?: string | null;
  fallbackUrl?: string | null;
  name?: string;
}

/**
 * 360° outfit viewer — flips between front and back photos with smooth 3D rotation.
 * No heavy 3D libraries: pure CSS transforms + Framer Motion.
 */
export function OutfitViewer({ frontUrl, backUrl, fallbackUrl, name }: OutfitViewerProps) {
  const front = frontUrl ?? fallbackUrl ?? null;
  const back = backUrl ?? fallbackUrl ?? null;
  const hasBoth = !!front && !!back && front !== back;

  const [showingBack, setShowingBack] = useState(false);
  const [autoRotate, setAutoRotate] = useState(hasBoth);

  useEffect(() => {
    if (!autoRotate || !hasBoth) return;
    const id = setInterval(() => setShowingBack(s => !s), 3000);
    return () => clearInterval(id);
  }, [autoRotate, hasBoth]);

  const currentUrl = showingBack ? back : front;

  if (!front && !back) {
    return (
      <div className="aspect-[3/4] w-full rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <Shirt className="h-20 w-20 text-primary/25" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-muted/30 [perspective:1200px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={showingBack ? 'back' : 'front'}
            src={currentUrl ?? undefined}
            alt={`${name ?? 'Fardamento'} - ${showingBack ? 'costas' : 'frente'}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover [backface-visibility:hidden]"
            style={{ transformStyle: 'preserve-3d' }}
          />
        </AnimatePresence>

        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-bold uppercase tracking-wider text-foreground border border-border/40">
          {showingBack ? 'Costas' : 'Frente'}
        </div>
      </div>

      {hasBoth && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={!showingBack ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl"
            onClick={() => { setShowingBack(false); setAutoRotate(false); }}
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
            onClick={() => { setShowingBack(true); setAutoRotate(false); }}
          >
            Costas
          </Button>
        </div>
      )}

      {!hasBoth && (front || back) && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
          <RotateCw className="h-3 w-3" />
          Adicione foto de {front ? 'costas' : 'frente'} para visualização 360°
        </p>
      )}
    </div>
  );
}
