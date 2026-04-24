import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AVATAR_VIDEO_URL =
  'https://zlefskputrqptsatndtc.supabase.co/storage/v1/object/public/fardamentos/Giro%20360%20do%20Avatar_720p.mp4';

interface AvatarVideoModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function AvatarVideoModal({ open, onClose, title }: AvatarVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ESC + lock body scroll + back-button support
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let popped = false;
    window.history.pushState({ __avatarModal: true }, '');
    const onPop = () => { popped = true; onClose(); };
    window.addEventListener('popstate', onPop);

    // Try to autoplay (muted so browsers allow it)
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      document.body.style.overflow = prevOverflow;
      if (!popped && window.history.state?.__avatarModal) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Modal content */}
          <motion.div
            className="relative w-full max-w-md aspect-[9/16] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={AVATAR_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              className="w-full h-full object-cover rounded-3xl pointer-events-none select-none"
            />

            {/* Subtle gradient overlay for title contrast */}
            {title && (
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            )}

            {title && (
              <div className="absolute top-4 left-5 right-16 text-white">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Visualização</p>
                <h3 className="text-lg font-bold truncate">{title}</h3>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 ring-1 ring-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
