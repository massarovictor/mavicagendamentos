
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Usuario } from '@/types';
import { Plus, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GerenciarUsuarios = () => {
  const { usuarios, espacos, updateUsuarios } = useLocalStorage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'usuario' as 'admin' | 'gestor' | 'usuario',
    espacos: [] as number[]
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      tipo: 'usuario',
      espacos: []
    });
    setEditingUsuario(null);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingUsuario) {
      // Editar usuário existente
      const updatedUsuarios = usuarios.map(usuario => 
        usuario.id === editingUsuario.id 
          ? {
              ...usuario,
              nome: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              tipo: formData.tipo,
              espacos: formData.tipo === 'gestor' ? formData.espacos : undefined
            }
          : usuario
      );
      updateUsuarios(updatedUsuarios);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
    } else {
      // Criar novo usuário
      const newId = Math.max(...usuarios.map(u => u.id), 0) + 1;
      const newUsuario: Usuario = {
        id: newId,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        tipo: formData.tipo,
        espacos: formData.tipo === 'gestor' ? formData.espacos : undefined
      };
      updateUsuarios([...usuarios, newUsuario]);
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email || '',
      telefone: usuario.telefone || '',
      tipo: usuario.tipo,
      espacos: usuario.espacos || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (usuarioId: number) => {
    const updatedUsuarios = usuarios.filter(usuario => usuario.id !== usuarioId);
    updateUsuarios(updatedUsuarios);
    toast({
      title: "Sucesso",
      description: "Usuário removido com sucesso!",
    });
  };

  const handleEspacoChange = (espacoId: number, checked: boolean) => {
    if (checked) {
      setFormData({...formData, espacos: [...formData.espacos, espacoId]});
    } else {
      setFormData({...formData, espacos: formData.espacos.filter(id => id !== espacoId)});
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'usuario': return 'Usuário';
      default: return tipo;
    }
  };

  const getEspacosGerenciados = (usuario: Usuario) => {
    if (usuario.tipo !== 'gestor' || !usuario.espacos) return '-';
    return usuario.espacos
      .map(id => espacos.find(e => e.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-2">Crie, edite e gerencie os usuários do sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do usuário abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Usuário</Label>
                <select 
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="usuario">Usuário</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              {formData.tipo === 'gestor' && (
                <div className="grid gap-2">
                  <Label>Espaços Gerenciados</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {espacos.filter(e => e.ativo).map((espaco) => (
                      <div key={espaco.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`espaco-${espaco.id}`}
                          checked={formData.espacos.includes(espaco.id)}
                          onChange={(e) => handleEspacoChange(espaco.id, e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`espaco-${espaco.id}`} className="text-sm">
                          {espaco.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSave}>
                {editingUsuario ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Todos os usuários cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Espaços Gerenciados</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.tipo === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : usuario.tipo === 'gestor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getTipoLabel(usuario.tipo)}
                    </span>
                  </TableCell>
                  <TableCell>{getEspacosGerenciados(usuario)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(usuario)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(usuario.id)}
                      >
                        Remover
                      </Button>
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

export default GerenciarUsuarios;
