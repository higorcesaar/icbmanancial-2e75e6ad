import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Download, Camera } from 'lucide-react';
import { CosmicBackground } from '@/components/CosmicBackground';

type Tab = 'login' | 'request';

export default function Login() {
  const { signIn } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Request access form state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [reqPreview, setReqPreview] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      toast('Toque em Compartilhar (↗️) e depois em "Adicionar à Tela Inicial" 📱', { duration: 8000 });
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setIsStandalone(true); toast.success('App instalado! 💖'); }
    } else {
      toast.info('Abra o menu do navegador e toque em "Adicionar à tela inicial"');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Bem-vinda de volta! 💖');
    } catch (err: any) {
      toast.error(err.message ?? 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File | null) => {
    setReqFile(file);
    if (reqPreview) URL.revokeObjectURL(reqPreview);
    setReqPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim() || !reqPassword || !reqFile) {
      toast.error('Preencha todos os campos e envie uma foto');
      return;
    }
    if (reqPassword.length < 6) {
      toast.error('A senha precisa de ao menos 6 caracteres');
      return;
    }

    setSubmittingRequest(true);
    try {
      // 1. Upload photo to public bucket
      const ext = reqFile.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('access-requests')
        .upload(path, reqFile, { contentType: reqFile.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('access-requests').getPublicUrl(path);

      // 2. Sign up with metadata flagging this as access request (trigger sets pending)
      const { error: suErr } = await supabase.auth.signUp({
        email: reqEmail.trim(),
        password: reqPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: reqName.trim(),
            access_request: true,
            request_photo_url: pub.publicUrl,
          },
        },
      });
      if (suErr) throw suErr;

      // 3. Sign out immediately (account is pending)
      await supabase.auth.signOut();

      toast.success('Solicitação enviada! Aguarde a aprovação da líder. 💖', { duration: 6000 });
      setReqName(''); setReqEmail(''); setReqPassword(''); handleFile(null);
      setTab('login');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar solicitação');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-black">
      <CosmicBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Tabs above logo */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tab === 'login' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab('request')}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tab === 'request' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              Solicitar Acesso
            </button>
          </div>
        </div>

        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <CardHeader className="text-center space-y-3 pt-8 pb-2">
            <motion.div whileHover={{ scale: 1.1 }} className="mx-auto flex items-center justify-center">
              <img src="/logo-manancial-transparent.png" alt="Logo" className="w-40 sm:w-56 h-auto object-contain" />
            </motion.div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Escala Manancial</CardTitle>
              <CardDescription className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Equipe de Dança</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                    <Input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="exemplo@email.com" required
                      className="h-12 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 focus:border-white/30 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required
                        className="h-12 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 focus:border-white/30 text-white placeholder:text-white/30 pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {showForgotPassword ? (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                        <p className="text-sm text-white/80">Para redefinir a senha, contate sua líder ou administradora.</p>
                        <button type="button" onClick={() => setShowForgotPassword(false)} className="text-xs font-bold text-primary hover:underline">
                          ← Voltar ao login
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[10px] font-bold text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
                    {loading ? 'Preparando...' : 'Entrar na Escala 💖'}
                  </Button>

                  {!isStandalone && (
                    <Button type="button" onClick={handleInstallClick}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold flex items-center justify-center gap-2">
                      <Download size={20} /> Instalar App
                    </Button>
                  )}
                </motion.form>
              ) : (
                <motion.form
                  key="request"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleRequestSubmit}
                  className="space-y-5"
                >
                  <p className="text-[11px] text-white/60 text-center font-medium leading-relaxed">
                    Sua solicitação será analisada pela líder antes de liberar o acesso 💖
                  </p>

                  {/* Photo upload with preview */}
                  <div className="flex flex-col items-center gap-3">
                    <label className="cursor-pointer group">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-dashed border-white/20 group-hover:border-primary/50 transition-all flex items-center justify-center">
                        {reqPreview ? (
                          <img src={reqPreview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="h-8 w-8 text-white/40" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                      {reqFile ? 'Toque para trocar' : 'Toque para enviar foto'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome</label>
                    <Input value={reqName} onChange={e => setReqName(e.target.value)} required maxLength={100}
                      className="h-11 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 text-white placeholder:text-white/30" placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                    <Input type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} required
                      className="h-11 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 text-white placeholder:text-white/30" placeholder="exemplo@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                    <Input type="password" value={reqPassword} onChange={e => setReqPassword(e.target.value)} required minLength={6}
                      className="h-11 rounded-xl bg-white/10 border-white/10 focus:bg-white/20 text-white placeholder:text-white/30" placeholder="Mínimo 6 caracteres" />
                  </div>

                  <Button type="submit" disabled={submittingRequest}
                    className="w-full h-12 rounded-xl gradient-rose text-white font-bold text-lg border-0 shadow-rose hover:opacity-90 active:scale-[0.98]">
                    {submittingRequest ? 'Enviando...' : 'Enviar Solicitação ✨'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="mt-10 text-center text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
          ICB Manancial • Adoração com Dança
        </motion.p>
      </motion.div>
    </div>
  );
}
