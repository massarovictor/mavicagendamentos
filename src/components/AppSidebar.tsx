import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';
import MavicCompleto from '@/components/ui/mavic-completo';
import { 
  Calendar, 
  Settings, 
  User, 
  Plus,
  Check,
  Clock,
} from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const currentPath = location.pathname;

  const getIconColor = (url: string) => {
    if (isActive(url)) return 'text-blue-700';
    
    switch (url) {
      case '/dashboard': return 'text-blue-600';
      case '/novo-agendamento': return 'text-green-600';
      case '/meus-agendamentos': return 'text-purple-600';
      case '/espacos': return 'text-orange-600';
      case '/usuarios': return 'text-indigo-600';
      case '/todos-agendamentos': return 'text-violet-600';
      case '/agendamentos-fixos': return 'text-red-600';
      case '/meus-espacos': return 'text-amber-600';
      case '/aprovar-agendamentos': return 'text-emerald-600';
      case '/espacos-disponiveis': return 'text-slate-600';
      default: return 'text-gray-600';
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Calendar },
      { title: "Novo Agendamento", url: "/novo-agendamento", icon: Plus },
      { title: "Meus Agendamentos", url: "/meus-agendamentos", icon: Calendar },
    ];

    if (usuario?.tipo === 'admin') {
      return [
        ...baseItems,
        { title: "Gerenciar Espaços", url: "/espacos", icon: Settings },
        { title: "Gerenciar Usuários", url: "/usuarios", icon: User },
        { title: "Todos Agendamentos", url: "/todos-agendamentos", icon: Calendar },
        { title: "Agendamentos Fixos", url: "/agendamentos-fixos", icon: Clock },
      ];
    }

    if (usuario?.tipo === 'gestor') {
      return [
        ...baseItems,
        { title: "Meus Espaços", url: "/meus-espacos", icon: Settings },
        { title: "Aprovar Agendamentos", url: "/aprovar-agendamentos", icon: Check },
        { title: "Agendamentos Fixos", url: "/agendamentos-fixos", icon: Clock },
      ];
    }

    // Usuário comum
    return [
      ...baseItems,
      { title: "Ver Espaços", url: "/espacos-disponiveis", icon: Settings },
    ];
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => currentPath === path;

  const getUserTypeColor = () => {
    switch (usuario?.tipo) {
      case 'admin': return 'border-admin';
      case 'gestor': return 'border-gestor';
      case 'usuario': return 'border-usuario';
      default: return 'border-gray-300';
    }
  };

  return (
    <Sidebar className={`w-64 border-r-2 ${getUserTypeColor()}`}>
      <SidebarContent className="bg-white">
        {/* Logo do Sistema */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex justify-center">
            <MavicCompleto 
              size={120} 
              className="text-gray-700" 
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.url)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${getIconColor(item.url)}`} />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
