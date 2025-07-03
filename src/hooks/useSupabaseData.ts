import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Usuario, Espaco, Agendamento, AgendamentoFixo } from '@/types';

type Tables = Database['public']['Tables'];
type UsuarioRow = Tables['usuarios']['Row'];
type EspacoRow = Tables['espacos']['Row'];
type AgendamentoRow = Tables['agendamentos']['Row'];
type AgendamentoFixoRow = Tables['agendamentos_fixos']['Row'];

interface SupabaseState {
  usuarios: Usuario[];
  espacos: Espaco[];
  agendamentos: Agendamento[];
  agendamentosFixos: AgendamentoFixo[];
  loading: boolean;
  error: string | null;
}

// Funções de conversão entre tipos Supabase e tipos da aplicação
const convertUsuario = (row: UsuarioRow): Usuario => ({
  id: parseInt(row.id.replace(/-/g, '').substring(0, 8), 16), // Converter UUID para number para compatibilidade
  nome: row.nome,
  email: row.email,
  tipo: row.tipo,
  ativo: row.ativo,
  espacos: row.espacos || undefined,
  telefone: row.telefone || undefined,
  // Não incluímos senha por segurança
});

const convertEspaco = (row: EspacoRow): Espaco => ({
  id: row.id,
  nome: row.nome,
  capacidade: row.capacidade,
  descricao: row.descricao || undefined,
  equipamentos: row.equipamentos || undefined,
  ativo: row.ativo,
});

const convertAgendamento = (row: AgendamentoRow): Agendamento => ({
  id: row.id,
  espacoId: row.espaco_id,
  usuarioId: parseInt(row.usuario_id.replace(/-/g, '').substring(0, 8), 16), // Converter UUID para number
  data: row.data,
  aulaInicio: row.aula_inicio,
  aulaFim: row.aula_fim,
  status: row.status,
  observacoes: row.observacoes || undefined,
  criadoEm: row.created_at,
  agendamentoFixoId: row.agendamento_fixo_id || undefined,
});

const convertAgendamentoFixo = (row: AgendamentoFixoRow): AgendamentoFixo => ({
  id: row.id,
  espacoId: row.espaco_id,
  usuarioId: parseInt(row.usuario_id.replace(/-/g, '').substring(0, 8), 16), // Converter UUID para number
  dataInicio: row.data_inicio,
  dataFim: row.data_fim,
  aulaInicio: row.aula_inicio,
  aulaFim: row.aula_fim,
  diasSemana: row.dias_semana,
  observacoes: row.observacoes || undefined,
  ativo: row.ativo,
  criadoEm: row.created_at,
});

// Funções de conversão reversa (aplicação -> Supabase)
const convertToUsuarioInsert = (usuario: Usuario, userUuid: string): Tables['usuarios']['Insert'] => ({
  id: userUuid,
  nome: usuario.nome,
  email: usuario.email,
  tipo: usuario.tipo,
  ativo: usuario.ativo,
  espacos: usuario.espacos || null,
  telefone: usuario.telefone || null,
});

const convertToEspacoInsert = (espaco: Espaco): Tables['espacos']['Insert'] => ({
  nome: espaco.nome,
  capacidade: espaco.capacidade,
  descricao: espaco.descricao || null,
  equipamentos: espaco.equipamentos || null,
  ativo: espaco.ativo,
});

const convertToAgendamentoInsert = (agendamento: Agendamento, userUuid: string): Tables['agendamentos']['Insert'] => ({
  espaco_id: agendamento.espacoId,
  usuario_id: userUuid,
  data: agendamento.data,
  aula_inicio: agendamento.aulaInicio,
  aula_fim: agendamento.aulaFim,
  status: agendamento.status,
  observacoes: agendamento.observacoes || null,
  agendamento_fixo_id: agendamento.agendamentoFixoId || null,
});

export const useSupabaseData = () => {
  const [state, setState] = useState<SupabaseState>({
    usuarios: [],
    espacos: [],
    agendamentos: [],
    agendamentosFixos: [],
    loading: true,
    error: null,
  });

  // Mapeamento UUID <-> ID numérico para compatibilidade
  const [userUuidMap, setUserUuidMap] = useState<Map<number, string>>(new Map());

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Carregar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at');

      if (usuariosError) throw usuariosError;

      // Criar mapeamento UUID <-> ID numérico
      const uuidMap = new Map<number, string>();
      const usuarios = usuariosData.map(row => {
        const usuario = convertUsuario(row);
        uuidMap.set(usuario.id, row.id);
        return usuario;
      });
      setUserUuidMap(uuidMap);

      // Carregar espaços
      const { data: espacosData, error: espacosError } = await supabase
        .from('espacos')
        .select('*')
        .order('id');

      if (espacosError) throw espacosError;
      const espacos = espacosData.map(convertEspaco);

      // Carregar agendamentos
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (agendamentosError) throw agendamentosError;
      const agendamentos = agendamentosData.map(convertAgendamento);

      // Carregar agendamentos fixos
      const { data: agendamentosFixosData, error: agendamentosFixosError } = await supabase
        .from('agendamentos_fixos')
        .select('*')
        .order('created_at', { ascending: false });

      if (agendamentosFixosError) throw agendamentosFixosError;
      const agendamentosFixos = agendamentosFixosData.map(convertAgendamentoFixo);

      setState({
        usuarios,
        espacos,
        agendamentos,
        agendamentosFixos,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
    }
  }, []);

  // Funções CRUD
  const addUsuario = useCallback(async (usuario: Usuario): Promise<boolean> => {
    try {
      const userUuid = crypto.randomUUID();
      const { error } = await supabase
        .from('usuarios')
        .insert(convertToUsuarioInsert(usuario, userUuid));

      if (error) throw error;

      await loadData(); // Recarregar dados
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao adicionar usuário' }));
      return false;
    }
  }, [loadData]);

  const updateUsuario = useCallback(async (usuario: Usuario): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(usuario.id);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          ativo: usuario.ativo,
          espacos: usuario.espacos || null,
          telefone: usuario.telefone || null,
        })
        .eq('id', userUuid);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar usuário' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const deleteUsuario = useCallback(async (usuarioId: number): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(usuarioId);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userUuid);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao deletar usuário' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const addEspaco = useCallback(async (espaco: Espaco): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('espacos')
        .insert(convertToEspacoInsert(espaco));

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar espaço:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao adicionar espaço' }));
      return false;
    }
  }, [loadData]);

  const updateEspaco = useCallback(async (espaco: Espaco): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('espacos')
        .update({
          nome: espaco.nome,
          capacidade: espaco.capacidade,
          descricao: espaco.descricao || null,
          equipamentos: espaco.equipamentos || null,
          ativo: espaco.ativo,
        })
        .eq('id', espaco.id);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar espaço:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar espaço' }));
      return false;
    }
  }, [loadData]);

  const deleteEspaco = useCallback(async (espacoId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('espacos')
        .delete()
        .eq('id', espacoId);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao deletar espaço:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao deletar espaço' }));
      return false;
    }
  }, [loadData]);

  const addAgendamento = useCallback(async (agendamento: Agendamento): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(agendamento.usuarioId);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('agendamentos')
        .insert(convertToAgendamentoInsert(agendamento, userUuid));

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao adicionar agendamento' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const updateAgendamentoStatus = useCallback(async (agendamentoId: number, status: 'pendente' | 'aprovado' | 'rejeitado'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', agendamentoId);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar agendamento' }));
      return false;
    }
  }, [loadData]);

  const updateAgendamento = useCallback(async (agendamento: Agendamento): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(agendamento.usuarioId);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('agendamentos')
        .update({
          espaco_id: agendamento.espacoId,
          usuario_id: userUuid,
          data: agendamento.data,
          aula_inicio: agendamento.aulaInicio,
          aula_fim: agendamento.aulaFim,
          status: agendamento.status,
          observacoes: agendamento.observacoes || null,
          agendamento_fixo_id: agendamento.agendamentoFixoId || null,
        })
        .eq('id', agendamento.id);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar agendamento' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const deleteAgendamento = useCallback(async (agendamentoId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao deletar agendamento' }));
      return false;
    }
  }, [loadData]);

  // Funções para agendamentos fixos
  const addAgendamentoFixo = useCallback(async (agendamentoFixo: AgendamentoFixo): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(agendamentoFixo.usuarioId);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('agendamentos_fixos')
        .insert({
          espaco_id: agendamentoFixo.espacoId,
          usuario_id: userUuid,
          data_inicio: agendamentoFixo.dataInicio,
          data_fim: agendamentoFixo.dataFim,
          aula_inicio: agendamentoFixo.aulaInicio,
          aula_fim: agendamentoFixo.aulaFim,
          dias_semana: agendamentoFixo.diasSemana,
          observacoes: agendamentoFixo.observacoes || null,
          ativo: agendamentoFixo.ativo,
        });

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar agendamento fixo:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao adicionar agendamento fixo' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const updateAgendamentoFixo = useCallback(async (agendamentoFixo: AgendamentoFixo): Promise<boolean> => {
    try {
      const userUuid = userUuidMap.get(agendamentoFixo.usuarioId);
      if (!userUuid) throw new Error('UUID do usuário não encontrado');

      const { error } = await supabase
        .from('agendamentos_fixos')
        .update({
          espaco_id: agendamentoFixo.espacoId,
          usuario_id: userUuid,
          data_inicio: agendamentoFixo.dataInicio,
          data_fim: agendamentoFixo.dataFim,
          aula_inicio: agendamentoFixo.aulaInicio,
          aula_fim: agendamentoFixo.aulaFim,
          dias_semana: agendamentoFixo.diasSemana,
          observacoes: agendamentoFixo.observacoes || null,
          ativo: agendamentoFixo.ativo,
        })
        .eq('id', agendamentoFixo.id);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento fixo:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar agendamento fixo' }));
      return false;
    }
  }, [userUuidMap, loadData]);

  const deleteAgendamentoFixo = useCallback(async (agendamentoFixoId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agendamentos_fixos')
        .delete()
        .eq('id', agendamentoFixoId);

      if (error) throw error;

      await loadData();
      return true;
    } catch (error) {
      console.error('Erro ao deletar agendamento fixo:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao deletar agendamento fixo' }));
      return false;
    }
  }, [loadData]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup de realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase
        .channel('usuarios_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
          loadData();
        })
        .subscribe(),

      supabase
        .channel('espacos_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'espacos' }, () => {
          loadData();
        })
        .subscribe(),

      supabase
        .channel('agendamentos_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
          loadData();
        })
        .subscribe(),

      supabase
        .channel('agendamentos_fixos_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos_fixos' }, () => {
          loadData();
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [loadData]);

  return {
    ...state,
    actions: {
      // Usuários
      addUsuario,
      updateUsuario,
      deleteUsuario,
      toggleUsuarioStatus: async (id: number, ativo: boolean) => {
        const usuario = state.usuarios.find(u => u.id === id);
        if (usuario) {
          return updateUsuario({ ...usuario, ativo });
        }
        return false;
      },

      // Espaços
      addEspaco,
      updateEspaco,
      deleteEspaco,
      toggleEspacoStatus: async (id: number, ativo: boolean) => {
        const espaco = state.espacos.find(e => e.id === id);
        if (espaco) {
          return updateEspaco({ ...espaco, ativo });
        }
        return false;
      },

      // Agendamentos
      addAgendamento,
      updateAgendamento,
      deleteAgendamento,
      updateAgendamentoStatus,

      // Agendamentos Fixos
      addAgendamentoFixo,
      updateAgendamentoFixo,
      deleteAgendamentoFixo,

      // Utilitários
      refreshData: loadData,
      clearError: () => setState(prev => ({ ...prev, error: null })),
    },
  };
}; 