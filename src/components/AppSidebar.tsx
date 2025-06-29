
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
import { 
  Calendar, 
  Settings, 
  User, 
  Plus,
  Check,
} from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const currentPath = location.pathname;

  const getMenuItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Calendar },
      { title: "Fazer Agendamento", url: "/novo-agendamento", icon: Plus },
      { title: "Meus Agendamentos", url: "/meus-agendamentos", icon: Calendar },
    ];

    if (usuario?.tipo === 'admin') {
      return [
        ...baseItems,
        { title: "Gerenciar Espaços", url: "/espacos", icon: Settings },
        { title: "Gerenciar Usuários", url: "/usuarios", icon: User },
        { title: "Todos Agendamentos", url: "/todos-agendamentos", icon: Calendar },
      ];
    }

    if (usuario?.tipo === 'gestor') {
      return [
        ...baseItems,
        { title: "Meus Espaços", url: "/meus-espacos", icon: Settings },
        { title: "Aprovar Agendamentos", url: "/aprovar-agendamentos", icon: Check },
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
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-gray-600 font-medium">
            Menu Principal
          </SidebarGroupLabel>
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
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
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
