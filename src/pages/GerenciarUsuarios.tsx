import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useForm } from '@/hooks/useForm';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useNotifications } from '@/hooks/useNotifications';
import { Usuario, TipoUsuario } from '@/types';
import { Plus, User, Users, Shield, AlertCircle, Edit, Eye, EyeOff, UserPlus, Search, Building2, Trash2, AlertTriangle } from 'lucide-react';
import { FormatUtils } from '@/utils/validations';

interface UsuarioFormData {
  nome: string;
  email: string;
  tipo: TipoUsuario;
  senha: string;
  espacos: number[];
}

// Validação de formulário customizada
const validateForm = (values: UsuarioFormData) => {
  const errors: Record<string, string> = {};
  
  if (!values.nome.trim()) {
    errors.nome = 'Nome é obrigatório';
  }
  
  if (!values.email.trim()) {
    errors.email = 'Email é obrigatório';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!values.tipo) {
    errors.tipo = 'Tipo é obrigatório';
  }
  
  return errors;
};

// Opções de status
const statusOptions = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'admin', label: 'Administradores' },
  { value: 'gestor', label: 'Gestores' },
  { value: 'usuario', label: 'Usuários' }
];

const GerenciarUsuarios = () => {
  const { usuarios, agendamentos, espacos, loading, error, actions } = useSupabaseData();
  const notifications = useNotifications();
  const filters = useFilters();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  // Aplicar filtros
  const filteredUsuarios = useMemo(() => {
    let filtered = usuarios;

    // Filtro de texto
    if (filters.filters.searchTerm) {
      const searchLower = filters.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.nome.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de tipo
    if (filters.filters.statusFilter && filters.filters.statusFilter !== 'todos') {
      filtered = filtered.filter(u => u.tipo === filters.filters.statusFilter);
    }

    return filtered;
  }, [usuarios, filters.filters]);

  // Paginação
  const pagination = usePagination(filteredUsuarios, { initialPageSize: 10 });

  // Estatísticas para o PageHeader
  const pageStats = useMemo(() => {
    return [
      {
        label: 'Total de Usuários',
        value: usuarios.length,
        icon: Users,
        color: 'bg-blue-100'
      },
      {
        label: 'Administradores',
        value: usuarios.filter(u => u.tipo === 'admin').length,
        icon: Shield,
        color: 'bg-red-100'
      },
      {
        label: 'Gestores',
        value: usuarios.filter(u => u.tipo === 'gestor').length,
        icon: Eye,
        color: 'bg-purple-100'
      },
      {
        label: 'Usuários Ativos',
        value: usuarios.filter(u => u.ativo).length,
        icon: User,
        color: 'bg-green-100'
      }
    ];
  }, [usuarios]);

  // Form para criar/editar usuário
  const form = useForm<UsuarioFormData>({
    initialValues: {
      nome: '',
      email: '',
      tipo: 'usuario',
      senha: '',
      espacos: []
    },
    onSubmit: async (values) => {
      // Validações de formulário
      const formErrors = validateForm(values);
      if (Object.keys(formErrors).length > 0) {
        Object.values(formErrors).forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      // Validações de negócio
      const businessErrors = validateBusinessRules(values);
      if (businessErrors.length > 0) {
        businessErrors.forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      if (editingUsuario) {
        // Editar usuário existente
        const updatedUsuario: Usuario = {
          ...editingUsuario,
          nome: values.nome,
          email: values.email,
          tipo: values.tipo,
          espacos: values.tipo === 'gestor' ? values.espacos : undefined,
          // Só atualiza senha se foi fornecida
          ...(values.senha ? { senha: values.senha } : {})
        };
        await actions.updateUsuario(updatedUsuario);
        notifications.usuario.updated();
      } else {
        // Criar novo usuário
        const newUsuario: Usuario = {
          id: 0, // ID temporário - será substituído pelo Supabase
          nome: values.nome,
          email: values.email,
          tipo: values.tipo,
          senha: values.senha,
          ativo: true,
          espacos: values.tipo === 'gestor' ? values.espacos : undefined
        };
        await actions.addUsuario(newUsuario);
        notifications.usuario.created();
      }

      setIsDialogOpen(false);
      resetForm();
    }
  });

  const validateBusinessRules = (values: UsuarioFormData): string[] => {
    const errors: string[] = [];

    // Validar email único (exceto para edição)
    const emailExistente = usuarios.find(u => 
      u.email.toLowerCase() === values.email.toLowerCase() && 
      u.id !== editingUsuario?.id
    );
    if (emailExistente) {
      errors.push('Já existe um usuário com este email');
    }

    // Validar senha para novo usuário
    if (!editingUsuario && !values.senha) {
      errors.push('Senha é obrigatória para novos usuários');
    }

    // Validar que sempre existe pelo menos um admin
    if (editingUsuario?.tipo === 'admin' && values.tipo !== 'admin') {
      const outrosAdmins = usuarios.filter(u => u.tipo === 'admin' && u.id !== editingUsuario.id);
      if (outrosAdmins.length === 0) {
        errors.push('Deve existir pelo menos um administrador no sistema');
      }
    }

    return errors;
  };

  const resetForm = () => {
    form.reset();
    form.setValues({
      nome: '',
      email: '',
      tipo: 'usuario',
      senha: '',
      espacos: []
    });
    setEditingUsuario(null);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    form.setValues({
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      senha: '', // Senha fica vazia na edição
      espacos: usuario.espacos || []
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (usuarioId: number, ativo: boolean) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    if (!ativo && usuario) {
      // Verificar se é o último admin ativo
      if (usuario.tipo === 'admin') {
        const outrosAdminsAtivos = usuarios.filter(u => 
          u.tipo === 'admin' && u.ativo && u.id !== usuarioId
        );
        if (outrosAdminsAtivos.length === 0) {
          notifications.error(
            'Não é possível desativar',
            'Deve existir pelo menos um administrador ativo'
          );
          return;
        }
      }

      // Verificar agendamentos futuros
      const agendamentosFuturos = agendamentos.filter(a => 
        a.usuarioId === usuarioId && 
        a.data >= new Date().toISOString().split('T')[0] && 
        a.status !== 'rejeitado'
      );

      if (agendamentosFuturos.length > 0) {
        notifications.error(
          'Não é possível desativar',
          `Este usuário possui ${agendamentosFuturos.length} agendamento(s) futuro(s)`
        );
        return;
      }
    }

    try {
      await actions.toggleUsuarioStatus(usuarioId, ativo);
      if (ativo) {
        notifications.usuario.activated();
      } else {
        notifications.usuario.deactivated();
      }
    } catch (error) {
      notifications.error("Erro", "Falha ao alterar status do usuário");
    }
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;

    // Validações de segurança antes da exclusão
    const errors: string[] = [];

    // Verificar se é o último admin
    if (usuarioToDelete.tipo === 'admin') {
      const outrosAdmins = usuarios.filter(u => 
        u.tipo === 'admin' && u.id !== usuarioToDelete.id
      );
      if (outrosAdmins.length === 0) {
        errors.push('Não é possível excluir o último administrador do sistema');
      }
    }

    // Verificar agendamentos existentes
    const agendamentosUsuario = agendamentos.filter(a => a.usuarioId === usuarioToDelete.id);
    if (agendamentosUsuario.length > 0) {
      errors.push(`Este usuário possui ${agendamentosUsuario.length} agendamento(s) no sistema`);
    }

    if (errors.length > 0) {
      errors.forEach(error => notifications.error('Não é possível excluir', error));
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
      return;
    }

    try {
      // Proceder com a exclusão
      await actions.deleteUsuario(usuarioToDelete.id);
      notifications.usuario.deleted();
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    } catch (error) {
      notifications.error("Erro", "Falha ao excluir usuário");
    }
  };

  const getTipoLabel = (tipo: TipoUsuario) => {
    const labels = {
      admin: 'Administrador',
      gestor: 'Gestor',
      usuario: 'Usuário'
    };
    return labels[tipo];
  };

  const getTipoColor = (tipo: TipoUsuario) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      gestor: 'bg-purple-100 text-purple-800',
      usuario: 'bg-blue-100 text-blue-800'
    };
    return colors[tipo];
  };

  const getAgendamentosCount = (usuarioId: number) => {
    return agendamentos.filter(a => a.usuarioId === usuarioId && a.status !== 'rejeitado').length;
  };

  if (loading) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  if (error) {
    return <ErrorState title="Erro ao carregar dados" message={error} showRetry onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* PageHeader com botão de novo usuário */}
      <PageHeader 
        title="Gerenciar Usuários"
        subtitle="Crie, edite e gerencie os usuários do sistema"
        icon={Users}
        stats={pageStats}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2 hover:shadow-lg transition-shadow">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do usuário abaixo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={form.values.nome}
                      onChange={(e) => form.setValue('nome', e.target.value)}
                      placeholder="Nome completo do usuário"
                      className={form.errors.nome ? 'border-red-500' : ''}
                    />
                    {form.errors.nome && (
                      <p className="text-sm text-red-600">{form.errors.nome}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.values.email}
                      onChange={(e) => form.setValue('email', e.target.value)}
                      placeholder="email@exemplo.com"
                      className={form.errors.email ? 'border-red-500' : ''}
                    />
                    {form.errors.email && (
                      <p className="text-sm text-red-600">{form.errors.email}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select 
                      value={form.values.tipo} 
                      onValueChange={(value: TipoUsuario) => form.setValue('tipo', value)}
                    >
                      <SelectTrigger className={form.errors.tipo ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usuario">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Usuário - Pode criar agendamentos
                          </div>
                        </SelectItem>
                        <SelectItem value="gestor">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Gestor - Aprova agendamentos
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin - Acesso completo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {form.errors.tipo && (
                      <p className="text-sm text-red-600">{form.errors.tipo}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="senha">
                      Senha {editingUsuario ? '(deixe vazio para manter atual)' : '*'}
                    </Label>
                    <Input
                      id="senha"
                      type="password"
                      value={form.values.senha}
                      onChange={(e) => form.setValue('senha', e.target.value)}
                      placeholder={editingUsuario ? 'Nova senha (opcional)' : 'Senha do usuário'}
                      className={form.errors.senha ? 'border-red-500' : ''}
                    />
                    {form.errors.senha && (
                      <p className="text-sm text-red-600">{form.errors.senha}</p>
                    )}
                  </div>

                  {/* Campo de Espaços - apenas para gestores */}
                  {form.values.tipo === 'gestor' && (
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Espaços Gerenciados
                      </Label>
                      <div className="text-sm text-gray-600 mb-2">
                        Selecione os espaços que este gestor poderá aprovar agendamentos
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        {espacos.filter(e => e.ativo).map((espaco) => (
                          <div key={espaco.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`espaco-${espaco.id}`}
                              checked={form.values.espacos.includes(espaco.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  form.setValue('espacos', [...form.values.espacos, espaco.id]);
                                } else {
                                  form.setValue('espacos', form.values.espacos.filter(id => id !== espaco.id));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`espaco-${espaco.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {espaco.nome} ({espaco.capacidade} pessoas)
                            </label>
                          </div>
                        ))}
                        {espacos.filter(e => e.ativo).length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-4">
                            Nenhum espaço ativo disponível
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {form.values.espacos.length > 0 
                          ? `${form.values.espacos.length} espaço(s) selecionado(s)`
                          : 'Nenhum espaço selecionado'
                        }
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={form.isSubmitting}
                  >
                    {form.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingUsuario ? 'Atualizando...' : 'Criando...'}
                      </>
                    ) : (
                      editingUsuario ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar usuários</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou email..."
                  value={filters.filters.searchTerm || ''}
                  onChange={(e) => filters.updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Filtrar por tipo</Label>
              <Select 
                value={filters.filters.statusFilter || 'todos'} 
                onValueChange={(value) => filters.updateFilter('statusFilter', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-auto">
              <Label className="text-sm font-medium text-gray-700">&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={filters.clearFilters}
                className="w-full mt-1"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Mostrando {pagination.paginationInfo.startItem} a {pagination.paginationInfo.endItem} de {pagination.paginationInfo.totalItems} usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={pagination.paginatedData}
            columns={[
              {
                key: 'nome',
                header: 'Nome',
                accessor: (usuario) => usuario.nome,
                mobileLabel: 'Nome'
              },
              {
                key: 'email',
                header: 'Email',
                accessor: (usuario) => (
                  <div className="text-sm text-gray-600">{usuario.email}</div>
                ),
                mobileLabel: 'Email',
                hiddenOnMobile: true
              },
              {
                key: 'tipo',
                header: 'Tipo',
                accessor: (usuario) => (
                  <Badge className={getTipoColor(usuario.tipo)}>
                    {getTipoLabel(usuario.tipo)}
                  </Badge>
                ),
                mobileLabel: 'Tipo'
              },
              {
                key: 'espacos',
                header: 'Espaços',
                accessor: (usuario) => {
                  if (usuario.tipo !== 'gestor' || !usuario.espacos?.length) {
                    return <span className="text-sm text-gray-400">-</span>;
                  }
                  const espacosGestor = espacos.filter(e => usuario.espacos?.includes(e.id));
                  return (
                    <div className="flex flex-wrap gap-1">
                      {espacosGestor.slice(0, 2).map((espaco) => (
                        <Badge key={espaco.id} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {espaco.nome}
                        </Badge>
                      ))}
                      {espacosGestor.length > 2 && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                          +{espacosGestor.length - 2}
                        </Badge>
                      )}
                    </div>
                  );
                },
                mobileLabel: 'Espaços',
                hiddenOnMobile: true
              },
              {
                key: 'status',
                header: 'Status',
                accessor: (usuario) => (
                  <Badge variant={usuario.ativo ? "default" : "secondary"}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
                mobileLabel: 'Status'
              },
              {
                key: 'agendamentos',
                header: 'Agendamentos',
                accessor: (usuario) => (
                  <span className="text-sm text-gray-600">
                    {getAgendamentosCount(usuario.id)} agendamentos
                  </span>
                ),
                mobileLabel: 'Agendamentos',
                hiddenOnMobile: true
              },
              {
                key: 'acoes',
                header: 'Ações',
                accessor: (usuario) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(usuario.id, !usuario.ativo)}
                      className={usuario.ativo ? 'hover:bg-yellow-50 hover:border-yellow-200' : 'hover:bg-green-50 hover:border-green-200'}
                    >
                      {usuario.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(usuario)}
                      className="hover:bg-red-50 hover:border-red-200 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                mobileLabel: 'Ações'
              }
            ]}
            emptyState={
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou criar um novo usuário</p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. O usuário será permanentemente removido do sistema.
            </DialogDescription>
          </DialogHeader>
          
          {usuarioToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <User className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{usuarioToDelete.nome}</p>
                    <p className="text-sm text-gray-600">{usuarioToDelete.email}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <Badge className={getTipoColor(usuarioToDelete.tipo)}>
                      {getTipoLabel(usuarioToDelete.tipo)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendamentos:</span>
                    <span className="font-medium">{getAgendamentosCount(usuarioToDelete.id)}</span>
                  </div>
                  {usuarioToDelete.tipo === 'gestor' && usuarioToDelete.espacos?.length && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Espaços gerenciados:</span>
                      <span className="font-medium">{usuarioToDelete.espacos.length}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Atenção</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Todos os dados relacionados a este usuário serão perdidos permanentemente.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarUsuarios;
