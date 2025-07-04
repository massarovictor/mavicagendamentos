import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { useForm } from '@/hooks/useForm';
import { Espaco } from '@/types';
import { Plus, Settings, User, MapPin, Users, Building2, Edit, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';

interface EspacoFormData {
  nome: string;
  capacidade: number;
  descricao: string;
  equipamentos: string[];
}

// Validação de formulário
const validateForm = (values: EspacoFormData) => {
  const errors: Record<string, string> = {};
  
  if (!values.nome.trim()) {
    errors.nome = 'Nome é obrigatório';
  }
  
  if (!values.capacidade || values.capacidade <= 0) {
    errors.capacidade = 'Capacidade deve ser maior que zero';
  }
  
  return errors;
};

const GerenciarEspacos = () => {
  const { espacos, agendamentos, usuarios, loading, error, actions } = useSupabaseData();
  const notifications = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEspaco, setEditingEspaco] = useState<Espaco | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [espacoToDelete, setEspacoToDelete] = useState<Espaco | null>(null);

  // Form para criar/editar espaço
  const form = useForm<EspacoFormData>({
    initialValues: {
      nome: '',
      capacidade: 1,
      descricao: '',
      equipamentos: []
    },
    persistenceKey: editingEspaco 
      ? `form-espaco-${editingEspaco.id}` 
      : 'form-novo-espaco',
    onSubmit: async (values) => {
      // Validações de formulário
      const formErrors = validateForm(values);
      if (Object.keys(formErrors).length > 0) {
        Object.values(formErrors).forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      if (editingEspaco) {
        // Editar espaço existente
        const updatedEspaco: Espaco = {
          ...editingEspaco,
          nome: values.nome,
          capacidade: Number(values.capacidade),
          descricao: values.descricao,
          equipamentos: values.equipamentos
        };
        await actions.updateEspaco(updatedEspaco);
        notifications.espaco.updated();
      } else {
        // Criar novo espaço
        const newEspaco: Espaco = {
          id: 0, // ID temporário - será substituído pelo Supabase
          nome: values.nome,
          capacidade: Number(values.capacidade),
          descricao: values.descricao,
          equipamentos: values.equipamentos,
          ativo: true
        };
        await actions.addEspaco(newEspaco);
        notifications.espaco.created();
      }

      form.clearPersistence(); // Limpa o localStorage após o sucesso
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    form.reset();
    setEditingEspaco(null);
  };

  const handleEdit = (espaco: Espaco) => {
    setEditingEspaco(espaco);
    form.setValues({
      nome: espaco.nome,
      capacidade: espaco.capacidade,
      descricao: espaco.descricao || '',
      equipamentos: espaco.equipamentos || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (espacoId: number) => {
    try {
      await actions.toggleEspacoStatus(espacoId, false);
      notifications.espaco.deactivated();
    } catch (error) {
      notifications.error("Erro", "Falha ao desativar espaço");
    }
  };

  const handleReactivate = async (espacoId: number) => {
    try {
      await actions.toggleEspacoStatus(espacoId, true);
      notifications.espaco.activated();
    } catch (error) {
      notifications.error("Erro", "Falha ao reativar espaço");
    }
  };

  const handleDeleteClick = (espaco: Espaco) => {
    setEspacoToDelete(espaco);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!espacoToDelete) return;

    // Validações de segurança antes da exclusão
    const errors: string[] = [];

    // Verificar agendamentos existentes
    const agendamentosEspaco = agendamentos.filter(a => a.espacoId === espacoToDelete.id);
    if (agendamentosEspaco.length > 0) {
      errors.push(`Este espaço possui ${agendamentosEspaco.length} agendamento(s) no sistema`);
    }

    // Verificar se gestores dependem deste espaço
    const gestoresDependentes = usuarios.filter(u => 
      u.tipo === 'gestor' && u.espacos?.includes(espacoToDelete.id)
    );
    if (gestoresDependentes.length > 0) {
      errors.push(`${gestoresDependentes.length} gestor(es) gerenciam este espaço`);
    }

    if (errors.length > 0) {
      errors.forEach(error => notifications.error('Não é possível excluir', error));
      setDeleteDialogOpen(false);
      setEspacoToDelete(null);
      return;
    }

    try {
      // Proceder com a exclusão
      await actions.deleteEspaco(espacoToDelete.id);
      notifications.espaco.deleted();
      setDeleteDialogOpen(false);
      setEspacoToDelete(null);
    } catch (error) {
      notifications.error("Erro", "Falha ao excluir espaço");
    }
  };

  // Estatísticas para o PageHeader
  const pageStats = useMemo(() => [
    {
      label: "Total de Espaços",
      value: espacos.length,
      icon: MapPin,
      color: "bg-blue-500"
    },
    {
      label: "Espaços Ativos", 
      value: espacos.filter(e => e.ativo).length,
      icon: Eye,
      color: "bg-green-500"
    },
    {
      label: "Espaços Inativos",
      value: espacos.filter(e => !e.ativo).length,
      icon: EyeOff,
      color: "bg-gray-500"
    },
    {
      label: "Capacidade Total",
      value: espacos.reduce((acc, e) => acc + e.capacidade, 0),
      icon: Users,
      color: "bg-purple-500"
    }
  ], [espacos]);

  if (loading) {
    return <LoadingSpinner message="Carregando espaços..." />;
  }

  if (error) {
    return <ErrorState title="Erro ao carregar dados" message={error} showRetry onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Gerenciar Espaços"
        subtitle="Crie, edite e gerencie os espaços do sistema"
        icon={Building2}
        stats={pageStats}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Espaço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingEspaco ? 'Editar Espaço' : 'Novo Espaço'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do espaço abaixo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={form.values.nome}
                      onChange={(e) => form.setValue('nome', e.target.value)}
                      placeholder="Nome do espaço"
                      className={form.errors.nome ? 'border-red-500' : ''}
                    />
                    {form.errors.nome && (
                      <p className="text-sm text-red-600">{form.errors.nome}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacidade">Capacidade *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      value={form.values.capacidade}
                      onChange={(e) => form.setValue('capacidade', Number(e.target.value))}
                      placeholder="Número de pessoas"
                      className={form.errors.capacidade ? 'border-red-500' : ''}
                    />
                    {form.errors.capacidade && (
                      <p className="text-sm text-red-600">{form.errors.capacidade}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={form.values.descricao}
                      onChange={(e) => form.setValue('descricao', e.target.value)}
                      placeholder="Descrição do espaço"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="equipamentos">Equipamentos</Label>
                    <Input
                      id="equipamentos"
                      value={form.values.equipamentos.join(', ')}
                      onChange={(e) => form.setValue('equipamentos', e.target.value.split(',').map(eq => eq.trim()).filter(eq => eq))}
                      placeholder="Separados por vírgula"
                    />
                  </div>
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
                        {editingEspaco ? 'Atualizando...' : 'Criando...'}
                      </>
                    ) : (
                      editingEspaco ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Espaços</CardTitle>
          <CardDescription>Todos os espaços cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={espacos}
            columns={[
              {
                key: 'nome',
                header: 'Nome',
                accessor: (espaco) => espaco.nome,
                mobileLabel: 'Nome'
              },
              {
                key: 'capacidade',
                header: 'Capacidade',
                accessor: (espaco) => (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                    <span>{espaco.capacidade} pessoas</span>
                        </div>
                ),
                mobileLabel: 'Capacidade'
              },
              {
                key: 'descricao',
                header: 'Descrição',
                accessor: (espaco) => espaco.descricao || '-',
                mobileLabel: 'Descrição',
                hiddenOnMobile: true
              },
              {
                key: 'equipamentos',
                header: 'Equipamentos',
                accessor: (espaco) => (
                  espaco.equipamentos?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {espaco.equipamentos.slice(0, 2).map((eq, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {eq}
                              </Badge>
                            ))}
                            {espaco.equipamentos.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{espaco.equipamentos.length - 2}
                              </Badge>
                            )}
                          </div>
                  ) : '-'
                ),
                mobileLabel: 'Equipamentos',
                hiddenOnMobile: true
              },
              {
                key: 'status',
                header: 'Status',
                accessor: (espaco) => (
                        <Badge variant={espaco.ativo ? "default" : "secondary"}>
                          {espaco.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                ),
                mobileLabel: 'Status'
              },
              {
                key: 'acoes',
                header: 'Ações',
                accessor: (espaco) => (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(espaco)}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                    {espaco.ativo ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(espaco.id)}
                        className="hover:bg-yellow-50 hover:border-yellow-200"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReactivate(espaco.id)}
                        className="hover:bg-green-50 hover:border-green-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                          <Button
                            variant="outline"
                            size="sm"
                      onClick={() => handleDeleteClick(espaco)}
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
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum espaço encontrado</p>
                  <p className="text-sm">Crie um novo espaço para começar</p>
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
              Esta ação é <strong>irreversível</strong>. O espaço será permanentemente removido do sistema.
            </DialogDescription>
          </DialogHeader>
          
          {espacoToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Building2 className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{espacoToDelete.nome}</p>
                    <p className="text-sm text-gray-600">
                      Capacidade: {espacoToDelete.capacidade} pessoas
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={espacoToDelete.ativo ? "default" : "secondary"}>
                      {espacoToDelete.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendamentos:</span>
                    <span className="font-medium">
                      {agendamentos.filter(a => a.espacoId === espacoToDelete.id).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gestores responsáveis:</span>
                    <span className="font-medium">
                      {usuarios.filter(u => u.tipo === 'gestor' && u.espacos?.includes(espacoToDelete.id)).length}
                    </span>
                  </div>
                  {espacoToDelete.equipamentos && espacoToDelete.equipamentos.length > 0 && (
                    <div>
                      <span className="text-gray-600">Equipamentos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {espacoToDelete.equipamentos.slice(0, 3).map((eq, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                        {espacoToDelete.equipamentos.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{espacoToDelete.equipamentos.length - 3}
                          </Badge>
                        )}
                      </div>
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
                  Todos os dados relacionados a este espaço serão perdidos permanentemente.
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

export default GerenciarEspacos;
