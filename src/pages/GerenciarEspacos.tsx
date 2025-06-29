
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Espaco } from '@/types';
import { Plus, Settings, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GerenciarEspacos = () => {
  const { espacos, updateEspacos } = useLocalStorage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEspaco, setEditingEspaco] = useState<Espaco | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    capacidade: '',
    descricao: '',
    equipamentos: ''
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      capacidade: '',
      descricao: '',
      equipamentos: ''
    });
    setEditingEspaco(null);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.capacidade) {
      toast({
        title: "Erro",
        description: "Nome e capacidade são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const equipamentosArray = formData.equipamentos.split(',').map(e => e.trim()).filter(e => e);
    
    if (editingEspaco) {
      // Editar espaço existente
      const updatedEspacos = espacos.map(espaco => 
        espaco.id === editingEspaco.id 
          ? {
              ...espaco,
              nome: formData.nome,
              capacidade: parseInt(formData.capacidade),
              descricao: formData.descricao,
              equipamentos: equipamentosArray
            }
          : espaco
      );
      updateEspacos(updatedEspacos);
      toast({
        title: "Sucesso",
        description: "Espaço atualizado com sucesso!",
      });
    } else {
      // Criar novo espaço
      const newId = Math.max(...espacos.map(e => e.id), 0) + 1;
      const newEspaco: Espaco = {
        id: newId,
        nome: formData.nome,
        capacidade: parseInt(formData.capacidade),
        descricao: formData.descricao,
        equipamentos: equipamentosArray,
        ativo: true
      };
      updateEspacos([...espacos, newEspaco]);
      toast({
        title: "Sucesso",
        description: "Espaço criado com sucesso!",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (espaco: Espaco) => {
    setEditingEspaco(espaco);
    setFormData({
      nome: espaco.nome,
      capacidade: espaco.capacidade.toString(),
      descricao: espaco.descricao || '',
      equipamentos: espaco.equipamentos?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (espacoId: number) => {
    const updatedEspacos = espacos.map(espaco => 
      espaco.id === espacoId ? { ...espaco, ativo: false } : espaco
    );
    updateEspacos(updatedEspacos);
    toast({
      title: "Sucesso",
      description: "Espaço desativado com sucesso!",
    });
  };

  const handleReactivate = (espacoId: number) => {
    const updatedEspacos = espacos.map(espaco => 
      espaco.id === espacoId ? { ...espaco, ativo: true } : espaco
    );
    updateEspacos(updatedEspacos);
    toast({
      title: "Sucesso",
      description: "Espaço reativado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Espaços</h1>
          <p className="text-gray-600 mt-2">Crie, edite e gerencie os espaços do sistema</p>
        </div>
        
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
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome do espaço"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacidade">Capacidade *</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={formData.capacidade}
                  onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
                  placeholder="Número de pessoas"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição do espaço"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="equipamentos">Equipamentos</Label>
                <Input
                  id="equipamentos"
                  value={formData.equipamentos}
                  onChange={(e) => setFormData({...formData, equipamentos: e.target.value})}
                  placeholder="Separados por vírgula"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSave}>
                {editingEspaco ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Espaços</CardTitle>
          <CardDescription>Todos os espaços cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Equipamentos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {espacos.map((espaco) => (
                <TableRow key={espaco.id}>
                  <TableCell className="font-medium">{espaco.nome}</TableCell>
                  <TableCell>{espaco.capacidade} pessoas</TableCell>
                  <TableCell>{espaco.descricao || '-'}</TableCell>
                  <TableCell>
                    {espaco.equipamentos?.length ? espaco.equipamentos.join(', ') : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      espaco.ativo 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {espaco.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(espaco)}
                      >
                        Editar
                      </Button>
                      {espaco.ativo ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(espaco.id)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleReactivate(espaco.id)}
                        >
                          Reativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarEspacos;
