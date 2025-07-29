import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useForm } from '@/hooks/useForm';
import { useFilters } from '@/hooks/useFilters';
import { useNotifications } from '@/hooks/useNotifications';
import { Usuario, TipoUsuario } from '@/types';
import { Plus, User, Users, Shield, Edit, Eye, EyeOff, Search, Trash2, AlertTriangle, UserCheck, CheckCircle } from 'lucide-react';

interface UsuarioFormData {
  nome: string;
  email: string;
  tipo: TipoUsuario;
  senha?: string;
  espacos: number[];
}

const validateForm = (values: UsuarioFormData, isEditing: boolean) => {
  const errors: Record<string, string> = {};
  if (!values.nome.trim()) errors.nome = 'Nome é obrigatório';
  if (!values.email.trim() || !/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Email inválido';
  if (!values.tipo) errors.tipo = 'Tipo é obrigatório';
  if (!isEditing && !values.senha) errors.senha = 'Senha é obrigatória para novos usuários';
  return errors;
};

const GerenciarUsuarios = () => {
  const { usuarios, agendamentos, espacos, loading, error, actions } = useSupabaseData();
  const notifications = useNotifications();
  const { filters, updateFilter, clearFilters } = useFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  const form = useForm<UsuarioFormData>({
    initialValues: { nome: '', email: '', tipo: 'usuario', senha: '', espacos: [] },
    onSubmit: async (values) => {
      const formErrors = validateForm(values, !!editingUsuario);
      if (Object.keys(formErrors).length > 0) {
        Object.values(formErrors).forEach(err => notifications.error('Erro de validação', err));
        return;
      }
      
      const emailExists = usuarios.some(u => u.email.toLowerCase() === values.email.toLowerCase() && u.id !== editingUsuario?.id);
      if (emailExists) {
        notifications.error('Erro', 'Já existe um usuário com este email.');
        return;
      }

      if (editingUsuario) {
        await actions.updateUsuario({ ...editingUsuario, ...values, espacos: values.tipo === 'gestor' ? values.espacos : undefined });
        notifications.usuario.updated();
      } else {
        await actions.addUsuario({ ...values, id: 0, ativo: true, espacos: values.tipo === 'gestor' ? values.espacos : [] });
        notifications.usuario.created();
      }
      setIsDialogOpen(false);
    }
  });

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    form.setValues({ nome: usuario.nome, email: usuario.email, tipo: usuario.tipo, espacos: usuario.espacos || [], senha: usuario.senha || '' });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (usuario: Usuario) => {
    if (!usuario.ativo) {
      actions.toggleUsuarioStatus(usuario.id, true).then(() => notifications.usuario.activated());
      return;
    }
    const isLastAdmin = usuario.tipo === 'admin' && usuarios.filter(u => u.tipo === 'admin' && u.ativo).length === 1;
    if (isLastAdmin) {
      notifications.error('Não é possível desativar', 'Deve existir pelo menos um administrador ativo.');
      return;
    }
    actions.toggleUsuarioStatus(usuario.id, false).then(() => notifications.usuario.deactivated());
  };

  const handleDeleteClick = (usuario: Usuario) => {
    const isLastAdmin = usuario.tipo === 'admin' && usuarios.filter(u => u.tipo === 'admin').length === 1;
    if (isLastAdmin) {
      notifications.error('Não é possível excluir', 'Não é permitido excluir o último administrador.');
      return;
    }
    const userHasBookings = agendamentos.some(a => a.usuarioId === usuario.id);
    if (userHasBookings) {
      notifications.error('Não é possível excluir', 'Este usuário possui agendamentos no sistema.');
      return;
    }
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;
    try {
      await actions.deleteUsuario(usuarioToDelete.id);
      notifications.usuario.deleted();
    } catch(e) {
      notifications.error("Erro", "Falha ao excluir usuário.");
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  const filteredUsuarios = useMemo(() => usuarios.filter(u => 
    (u.nome.toLowerCase().includes(filters.searchTerm?.toLowerCase() || '') || u.email.toLowerCase().includes(filters.searchTerm?.toLowerCase() || '')) &&
    (filters.statusFilter === 'todos' || !filters.statusFilter || u.tipo === filters.statusFilter)
  ), [usuarios, filters]);

  const stats = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.tipo === 'admin').length,
    gestores: usuarios.filter(u => u.tipo === 'gestor').length,
    ativos: usuarios.filter(u => u.ativo).length
  }), [usuarios]);

  const getStatusBadge = (ativo: boolean) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
    if (ativo) {
      return <span className={`${baseClass} status-success`}><CheckCircle className="w-3.5 h-3.5" />Ativo</span>;
    }
    return <span className={`${baseClass} status-secondary`}><EyeOff className="w-3.5 h-3.5" />Inativo</span>;
  };

  const getTipoBadge = (tipo: TipoUsuario) => {
    const typeMap = {
      admin: { label: 'Admin', icon: <Shield className="w-3.5 h-3.5" />, className: 'status-error' },
      gestor: { label: 'Gestor', icon: <Eye className="w-3.5 h-3.5" />, className: 'status-info' },
      usuario: { label: 'Usuário', icon: <User className="w-3.5 h-3.5" />, className: 'status-secondary' }
    };
    const { label, icon, className } = typeMap[tipo];
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${className}`}>{icon}{label}</span>;
  };

  const columns = [
    { key: 'nome', header: 'Nome', accessor: (u: Usuario) => <div className="flex flex-col"><span className="font-semibold body-text">{u.nome}</span><span className="caption-text">{u.email}</span></div> },
    { key: 'tipo', header: 'Tipo', accessor: (u: Usuario) => getTipoBadge(u.tipo), hiddenOnMobile: true },
    { key: 'status', header: 'Status', accessor: (u: Usuario) => getStatusBadge(u.ativo) },
    { key: 'agendamentos', header: 'Agendamentos', accessor: (u: Usuario) => <span className="caption-text">{agendamentos.filter(a => a.usuarioId === u.id).length}</span>, hiddenOnMobile: true },
    { key: 'acoes', header: 'Ações', accessor: (u: Usuario) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => handleEdit(u)}><Edit className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(u)}>{u.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(u)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )}
  ];
  
  const mobileCardRender = (item: Usuario) => (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex flex-col"><span className="font-semibold body-text">{item.nome}</span><span className="caption-text">{item.email}</span></div>
        {getStatusBadge(item.ativo)}
      </div>
      <div>{getTipoBadge(item.tipo)}</div>
      <div className="pt-3 flex gap-2 border-t">
        <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1"><Edit className="h-4 w-4 mr-2"/>Editar</Button>
        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(item)} className="flex-1">{item.ativo ? <EyeOff className="h-4 w-4 mr-2"/> : <Eye className="h-4 w-4 mr-2"/>}{item.ativo ? 'Desativar' : 'Ativar'}</Button>
        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item)} className="flex-1"><Trash2 className="h-4 w-4 mr-2"/>Excluir</Button>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner message="Carregando usuários..." />;
  if (error) return <div>Erro ao carregar dados.</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance">Gerenciar Usuários</h1>
          <p className="subtle-text">Crie, edite e gerencie os usuários do sistema.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>Preencha as informações do usuário.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome" 
                  value={form.values.nome} 
                  onChange={e => form.setValue('nome', e.target.value)} 
                  placeholder="Nome Completo" 
                  className={form.errors.nome ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={form.values.email} 
                  onChange={e => form.setValue('email', e.target.value)} 
                  placeholder="email@exemplo.com" 
                  className={form.errors.email ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="senha">
                  Senha {editingUsuario ? '(deixe em branco para manter)' : '*'}
                </Label>
                <Input 
                  id="senha" 
                  type="password" 
                  value={form.values.senha} 
                  onChange={e => form.setValue('senha', e.target.value)} 
                  className={form.errors.senha ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={form.values.tipo} onValueChange={(v) => form.setValue('tipo', v as TipoUsuario)}>
                  <SelectTrigger>
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuário</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.values.tipo === 'gestor' && (
                <div className="space-y-2">
                  <Label>Espaços Gerenciados</Label>
                  <div className="grid grid-cols-2 gap-2 border p-2 rounded-md max-h-32 overflow-y-auto">
                    {espacos.filter(e => e.ativo).map(espaco => (
                      <div key={espaco.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`espaco-${espaco.id}`} 
                          checked={form.values.espacos.includes(espaco.id)} 
                          onCheckedChange={checked => 
                            form.setValue('espacos', 
                              checked 
                                ? [...form.values.espacos, espaco.id] 
                                : form.values.espacos.filter(id => id !== espaco.id)
                            )
                          }
                        />
                        <Label htmlFor={`espaco-${espaco.id}`} className="font-normal">
                          {espaco.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.isSubmitting}>
                  {form.isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><Users className="w-6 h-6 icon-accent"/></div><div className="metric-display">{stats.total}</div></div><div className="card-title">Total</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-success-bg rounded-lg"><UserCheck className="w-6 h-6 text-status-success"/></div><div className="metric-display text-status-success">{stats.ativos}</div></div><div className="card-title">Ativos</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-error-bg rounded-lg"><Shield className="w-6 h-6 text-status-error"/></div><div className="metric-display text-status-error">{stats.admins}</div></div><div className="card-title">Admins</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-info-bg rounded-lg"><Eye className="w-6 h-6 text-status-info"/></div><div className="metric-display text-status-info">{stats.gestores}</div></div><div className="card-title">Gestores</div></CardContent></Card>
      </div>
      
      <Card className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 self-start"><Users className="w-5 h-5 icon-muted" /><h2 className="card-title">Lista de Usuários</h2></div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar por nome ou email..." value={filters.searchTerm || ''} onChange={e => updateFilter('searchTerm', e.target.value)} className="pl-10"/></div>
              <Select value={filters.statusFilter || 'todos'} onValueChange={(v) => updateFilter('statusFilter', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todos os Tipos</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="usuario">Usuário</SelectItem></SelectContent></Select>
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">Limpar</Button>
            </div>
          </div>
          <ResponsiveTable
            data={filteredUsuarios}
            columns={columns}
            mobileCardRender={mobileCardRender}
            emptyState={<div className="text-center py-12"><Users className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum usuário encontrado</div><p className="caption-text mt-2">Tente ajustar os filtros ou crie um novo usuário.</p></div>}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Confirmar Exclusão</DialogTitle><DialogDescription>Esta ação é <strong>irreversível</strong>. Tem certeza de que deseja excluir este usuário?</DialogDescription></DialogHeader>
          {usuarioToDelete && <div className="py-4 space-y-3"><div className="p-4 bg-muted/50 border rounded-lg"><p className="body-text font-semibold">{usuarioToDelete.nome}</p><p className="caption-text">{usuarioToDelete.email}</p></div><div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="body-text text-red-700">Todos os dados relacionados a este usuário serão perdidos.</p></div></div>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button><Button type="button" variant="destructive" onClick={handleConfirmDelete}><Trash2 className="h-4 w-4 mr-2" />Excluir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarUsuarios;
