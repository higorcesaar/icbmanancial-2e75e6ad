import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Download } from 'lucide-react';
import { CosmicBackground } from '@/components/CosmicBackground';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      toast('Toque em Compartilhar (ícone ↗️) na barra inferior e depois em "Adicionar à Tela Inicial" 📱', { duration: 8000 });
      return;
    }
    
    if (/chrome|edg|firefox|samsung|opera/.test(userAgent)) {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandaloneMode) {
        toast.info('O app já está instalado! 🎉');
        return;
      }
      
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
          toast.success('App instalado com sucesso! 💖');
        }
      } else {
        toast.info('Para instalar: abra o menu (⋮) e selecione "Adicionar à tela inicial" ou "Install App"');
      }
      return;
    }
    
    toast.info('Para instalar o app, abra o menu do navegador e selecione "Adicionar à tela inicial"');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Bem-vinda de volta! 💖');
    } catch {
      toast.error('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      <CosmicBackground />

      {/* Login Card Layer */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <CardHeader className="text-center space-y-3 pt-8 pb-2">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="mx-auto flex items-center justify-center"
            >
              <img src="/logo-manancial-transparent.png" alt="Logo" className="w-40 sm:w-56 h-auto object-contain" />
            </motion.div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Escala Manancial</CardTitle>
              <CardDescription className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Equipe de Dança</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  required
                  className="h-12 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                <div className="relative group">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {showForgotPassword ? (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                    <p className="text-sm text-white/80">Para redefinir a senha, contate sua líder ou administradora.</p>
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      ← Voltar ao login
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-rose text-white font-bold text-lg shadow-rose hover:opacity-90 active:scale-[0.98] transition-all border-0 shadow-lg"
                >
                {loading ? 'Preparando...' : 'Entrar na Escala 💖'}
              </Button>

              {!isStandalone && (
                <Button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Instalar App
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Floating text footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 text-center text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]"
        >
          ICB Manancial • Adoração com Dança
        </motion.p>
      </motion.div>
    </div>
  );
}
