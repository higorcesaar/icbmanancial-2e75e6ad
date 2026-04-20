import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { motion } from 'framer-motion';

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-warm">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 flex items-center border-b border-border/40 px-6 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger className="mr-4 hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-2.5">
              <img src="/logo-manancial-transparent.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
          </header>
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 p-4 md:p-8 overflow-auto"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}
