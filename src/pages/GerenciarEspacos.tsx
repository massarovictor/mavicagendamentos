import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { useForm } from '@/hooks/useForm';
import { Espaco } from '@/types';
import { Plus, Settings, Users, Edit, Eye, EyeOff, Trash2, AlertTriangle, MapPin, CheckCircle } from 'lucide-react';

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
  const [equipamentosInput, setEquipamentosInput] = useState('');

  // Form para criar/editar espaço
  const form = useForm<EspacoFormData>({
    initialValues: {
      nome: '',
      capacidade: 1,
      descricao: '',
      equipamentos: []
    },
    onSubmit: async (values) => {
      // Validações de formulário
      const formErrors = validateForm(values);
      if (Object.keys(formErrors).length > 0) {
        Object.values(formErrors).forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      // Converter equipamentosInput para array
      const equipamentosArr = equipamentosInput
        .split(',')
        .map(eq => eq.trim())
        .filter(Boolean);

      if (editingEspaco) {
        // Editar espaço existente
        await actions.updateEspaco({
          ...editingEspaco,
          nome: values.nome,
          capacidade: Number(values.capacidade),
          descricao: values.descricao,
          equipamentos: equipamentosArr
        });
        notifications.espaco.updated();
      } else {
        // Criar novo espaço
        await actions.addEspaco({
          id: 0, // ID temporário - será substituído pelo Supabase
          nome: values.nome,
          capacidade: Number(values.capacidade),
          descricao: values.descricao,
          equipamentos: equipamentosArr,
          ativo: true
        });
        notifications.espaco.created();
      }

      setIsDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    form.reset();
    setEditingEspaco(null);
    setEquipamentosInput('');
  };

  const handleEdit = (espaco: Espaco) => {
    setEditingEspaco(espaco);
    form.setValues({
      nome: espaco.nome,
      capacidade: espaco.capacidade,
      descricao: espaco.descricao || '',
      equipamentos: espaco.equipamentos || []
    });
    setEquipamentosInput((espaco.equipamentos || []).join(', '));
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (espacoId: number, futuroStatus: boolean) => {
    try {
      await actions.toggleEspacoStatus(espacoId, futuroStatus);
      notifications.espaco[futuroStatus ? 'activated' : 'deactivated']();
    } catch (err) {
      notifications.error("Erro", `Falha ao ${futuroStatus ? 'reativar' : 'desativar'} espaço.`);
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
    } catch (error) {
      notifications.error("Erro", "Falha ao excluir espaço");
    } finally {
      setDeleteDialogOpen(false);
      setEspacoToDelete(null);
    }
  };

  const stats = useMemo(() => ({
    total: espacos.length,
    ativos: espacos.filter(e => e.ativo).length,
    inativos: espacos.filter(e => !e.ativo).length,
    capacidadeTotal: espacos.reduce((acc, e) => acc + e.capacidade, 0)
  }), [espacos]);

  const getStatusBadge = (ativo: boolean) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
    if (ativo) {
      return <span className={`${baseClass} status-success`}><CheckCircle className="w-3.5 h-3.5" />Ativo</span>;
    }
    return <span className={`${baseClass} status-secondary`}><EyeOff className="w-3.5 h-3.5" />Inativo</span>;
  };

  const columns = [
    { key: 'nome', header: 'Nome', accessor: (e: Espaco) => <span className="font-semibold body-text">{e.nome}</span> },
    { key: 'capacidade', header: 'Capacidade', accessor: (e: Espaco) => <span className="caption-text flex items-center gap-2"><Users className="w-4 h-4 icon-muted" />{e.capacidade} pessoas</span> },
    { key: 'equipamentos', header: 'Equipamentos', accessor: (e: Espaco) => (
      e.equipamentos?.length ? <div className="flex flex-wrap gap-1">{e.equipamentos.slice(0, 2).map(eq => <Badge key={eq} variant="secondary">{eq}</Badge>)}{e.equipamentos.length > 2 && <Badge variant="outline">+{e.equipamentos.length - 2}</Badge>}</div> : <span className="caption-text">-</span>
    ), hiddenOnMobile: true },
    { key: 'status', header: 'Status', accessor: (e: Espaco) => getStatusBadge(e.ativo) },
    { key: 'acoes', header: 'Ações', accessor: (e: Espaco) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => handleEdit(e)}><Edit className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(e.id, !e.ativo)}>{e.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(e)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )}
  ];
  
  const mobileCardRender = (item: Espaco) => (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="card-title">{item.nome}</h3>
        {getStatusBadge(item.ativo)}
      </div>
      <p className="caption-text flex items-center gap-2"><Users className="w-4 h-4 icon-muted" /> {item.capacidade} pessoas</p>
      {item.equipamentos?.length > 0 && <div className="flex flex-wrap gap-1 pt-2">{item.equipamentos.map(eq => <Badge key={eq} variant="secondary">{eq}</Badge>)}</div>}
      <div className="pt-3 flex gap-2 border-t">
        <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1"><Edit className="h-4 w-4 mr-2"/>Editar</Button>
        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(item.id, !item.ativo)} className="flex-1">{item.ativo ? <EyeOff className="h-4 w-4 mr-2"/> : <Eye className="h-4 w-4 mr-2"/>}{item.ativo ? 'Desativar' : 'Ativar'}</Button>
        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item)} className="flex-1"><Trash2 className="h-4 w-4 mr-2"/>Excluir</Button>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Carregando espaços..." />;
  }

  if (error) {
    return <div>Erro ao carregar dados.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance">Gerenciar Espaços</h1>
          <p className="subtle-text">Crie, edite e gerencie os espaços disponíveis para agendamento.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Novo Espaço</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEspaco ? 'Editar Espaço' : 'Novo Espaço'}</DialogTitle>
              <DialogDescription>Preencha as informações do espaço abaixo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome" 
                  value={form.values.nome} 
                  onChange={(e) => form.setValue('nome', e.target.value)} 
                  placeholder="Ex: Laboratório de Informática" 
                  className={form.errors.nome ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="capacidade">Capacidade *</Label>
                <Input 
                  id="capacidade" 
                  type="number" 
                  value={form.values.capacidade} 
                  onChange={(e) => form.setValue('capacidade', Number(e.target.value))} 
                  placeholder="Ex: 25" 
                  className={form.errors.capacidade ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input 
                  id="descricao" 
                  value={form.values.descricao} 
                  onChange={(e) => form.setValue('descricao', e.target.value)} 
                  placeholder="Ex: Sala com 25 computadores"
                />
              </div>
              <div>
                <Label htmlFor="equipamentos">Equipamentos (separados por vírgula)</Label>
                <Input 
                  id="equipamentos" 
                  value={equipamentosInput} 
                  onChange={(e) => setEquipamentosInput(e.target.value)} 
                  placeholder="Ex: Projetor, Ar condicionado"
                />
              </div>
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
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><Settings className="w-6 h-6 icon-accent"/></div><div className="metric-display">{stats.total}</div></div><div className="card-title">Total</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-success-bg rounded-lg"><CheckCircle className="w-6 h-6 text-status-success"/></div><div className="metric-display text-status-success">{stats.ativos}</div></div><div className="card-title">Ativos</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-muted/50 rounded-lg"><EyeOff className="w-6 h-6 text-muted-foreground"/></div><div className="metric-display text-muted-foreground">{stats.inativos}</div></div><div className="card-title">Inativos</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-info-bg rounded-lg"><Users className="w-6 h-6 text-status-info"/></div><div className="metric-display text-status-info">{stats.capacidadeTotal}</div></div><div className="card-title">Capacidade Total</div></CardContent></Card>
      </div>

      <Card className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex items-center gap-2 mb-6"><Settings className="w-5 h-5 icon-muted" /><h2 className="card-title">Lista de Espaços</h2></div>
          <ResponsiveTable
            data={espacos}
            columns={columns}
            mobileCardRender={mobileCardRender}
            emptyState={
              <div className="text-center py-12"><MapPin className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum espaço cadastrado</div><p className="caption-text mt-2">Crie o primeiro espaço para começar a gerenciar.</p></div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Confirmar Exclusão</DialogTitle><DialogDescription>Esta ação é <strong>irreversível</strong>. Tem certeza de que deseja excluir permanentemente este espaço?</DialogDescription></DialogHeader>
          {espacoToDelete && (
            <div className="py-4 space-y-3">
              <div className="p-4 bg-muted/50 border rounded-lg"><p className="body-text font-semibold">{espacoToDelete.nome}</p><p className="caption-text">Capacidade: {espacoToDelete.capacidade}</p></div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="body-text text-red-700">Todos os dados relacionados a este espaço serão perdidos.</p></div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
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
