import { Calendar, Users, Shirt, Sparkles, History, UserCog, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const mainItems = [
  { title: 'Escala', url: '/', icon: Calendar, adminOnly: false },
  { title: 'Ministras', url: '/membros', icon: Users, adminOnly: true },
  { title: 'Fardamentos', url: '/roupas', icon: Shirt, adminOnly: false },
  { title: 'Acessórios', url: '/acessorios', icon: Sparkles, adminOnly: false },
  { title: 'Histórico', url: '/historico', icon: History, adminOnly: true },
];

export function AppSidebar() {
  const { isAdmin, signOut, user } = useAuth();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const isMobile = useIsMobile();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-card/40 backdrop-blur-xl">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-4">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <img src="/logo-manancial-transparent.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            )}
            {collapsed && <img src="/logo-manancial-transparent.png" alt="Logo" className="w-10 h-10 object-contain mx-auto" />}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-8">
            <SidebarMenu className="space-y-1 px-2">
              {mainItems.filter(item => !item.adminOnly || isAdmin).map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/15 text-primary font-semibold shadow-sm"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/usuarios"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/15 text-primary font-semibold shadow-sm"
                      onClick={handleNavClick}
                    >
                      <UserCog className="h-[18px] w-[18px]" />
                      {!collapsed && <span className="text-sm">Usuários</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-border/30">
        {!collapsed && (
          <p className="text-xs text-muted-foreground truncate mb-2 px-3">{user?.email}</p>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
