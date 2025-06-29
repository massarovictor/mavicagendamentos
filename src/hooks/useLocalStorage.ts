
import { useState, useEffect } from 'react';
import { Usuario, Espaco, Agendamento } from '@/types';

const INITIAL_DATA = {
  usuarios: [
    { id: 1, nome: 'Administrador', tipo: 'admin' as const, email: 'admin@sistema.com' },
    { id: 2, nome: 'Gestor Principal', tipo: 'gestor' as const, espacos: [1, 2], email: 'gestor@sistema.com' },
    { id: 3, nome: 'João Silva', tipo: 'usuario' as const, email: 'joao@email.com' },
    { id: 4, nome: 'Maria Santos', tipo: 'usuario' as const, email: 'maria@email.com' }
  ],
  espacos: [
    { id: 1, nome: 'Sala de Reunião A', capacidade: 8, descricao: 'Sala com projetor e ar condicionado', equipamentos: ['Projetor', 'TV', 'Ar condicionado'], ativo: true },
    { id: 2, nome: 'Sala de Reunião B', capacidade: 12, descricao: 'Sala ampla para apresentações', equipamentos: ['Projetor', 'Quadro branco', 'Sistema de som'], ativo: true },
    { id: 3, nome: 'Auditório', capacidade: 50, descricao: 'Espaço para eventos e palestras', equipamentos: ['Projetor', 'Sistema de som', 'Microfone'], ativo: true },
    { id: 4, nome: 'Sala de Treinamento', capacidade: 20, descricao: 'Sala para cursos e treinamentos', equipamentos: ['Projetor', 'Computadores'], ativo: true }
  ],
  agendamentos: [
    {
      id: 1,
      espacoId: 1,
      usuarioId: 3,
      data: new Date().toISOString().split('T')[0],
      horaInicio: '14:00',
      horaFim: '16:00',
      status: 'pendente' as const,
      observacoes: 'Reunião de planejamento',
      criadoEm: new Date().toISOString()
    },
    {
      id: 2,
      espacoId: 2,
      usuarioId: 4,
      data: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      horaInicio: '09:00',
      horaFim: '11:00',
      status: 'aprovado' as const,
      observacoes: 'Apresentação do projeto',
      criadoEm: new Date().toISOString()
    }
  ]
};

export const useLocalStorage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    const loadData = () => {
      const storedUsuarios = localStorage.getItem('usuarios');
      const storedEspacos = localStorage.getItem('espacos');
      const storedAgendamentos = localStorage.getItem('agendamentos');

      if (!storedUsuarios || !storedEspacos || !storedAgendamentos) {
        localStorage.setItem('usuarios', JSON.stringify(INITIAL_DATA.usuarios));
        localStorage.setItem('espacos', JSON.stringify(INITIAL_DATA.espacos));
        localStorage.setItem('agendamentos', JSON.stringify(INITIAL_DATA.agendamentos));
        
        setUsuarios(INITIAL_DATA.usuarios);
        setEspacos(INITIAL_DATA.espacos);
        setAgendamentos(INITIAL_DATA.agendamentos);
      } else {
        setUsuarios(JSON.parse(storedUsuarios));
        setEspacos(JSON.parse(storedEspacos));
        setAgendamentos(JSON.parse(storedAgendamentos));
      }
    };

    loadData();
  }, []);

  const updateUsuarios = (newUsuarios: Usuario[]) => {
    localStorage.setItem('usuarios', JSON.stringify(newUsuarios));
    setUsuarios(newUsuarios);
  };

  const updateEspacos = (newEspacos: Espaco[]) => {
    localStorage.setItem('espacos', JSON.stringify(newEspacos));
    setEspacos(newEspacos);
  };

  const updateAgendamentos = (newAgendamentos: Agendamento[]) => {
    localStorage.setItem('agendamentos', JSON.stringify(newAgendamentos));
    setAgendamentos(newAgendamentos);
  };

  return {
    usuarios,
    espacos,
    agendamentos,
    updateUsuarios,
    updateEspacos,
    updateAgendamentos
  };
};
