import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Usuario, Espaco, Agendamento, AgendamentoFixo } from '@/types';
import { NotificationService } from '@/lib/notificationService';

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

const CACHE_KEYS = {
  USUARIOS: 'mavic_data_usuarios',
  ESPACOS: 'mavic_data_espacos',
  AGENDAMENTOS: 'mavic_data_agendamentos',
  FIXOS: 'mavic_data_fixos',
};

function getCached<T>(key: string, defaultValue: T): T {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setCached(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) { }
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, errMsg: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms))
  ]);
}

const convertUsuario = (row: UsuarioRow): Usuario => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  tipo: row.tipo,
  ativo: row.ativo,
  espacos: row.espacos || undefined,
  telefone: row.telefone || undefined,
  papel: row.papel || undefined,
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
  usuarioId: row.usuario_id,
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
  usuarioId: row.usuario_id,
  dataInicio: row.data_inicio,
  dataFim: row.data_fim,
  aulaInicio: row.aula_inicio,
  aulaFim: row.aula_fim,
  diasSemana: row.dias_semana,
  observacoes: row.observacoes || undefined,
  ativo: row.ativo,
  criadoEm: row.created_at,
});

const convertToUsuarioInsert = (usuario: Usuario, userUuid: string): Tables['usuarios']['Insert'] => {
  const insert: Tables['usuarios']['Insert'] = {
    id: userUuid,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    ativo: usuario.ativo,
    espacos: usuario.espacos || null,
    telefone: usuario.telefone || null,
  };
  // Só incluir papel se tiver um valor (banco tem default 'professor')
  if (usuario.papel) {
    insert.papel = usuario.papel;
  }
  return insert;
};

const convertToEspacoInsert = (espaco: Espaco): Tables['espacos']['Insert'] => ({
  nome: espaco.nome,
  capacidade: espaco.capacidade,
  descricao: espaco.descricao || null,
  equipamentos: espaco.equipamentos || null,
  ativo: espaco.ativo,
});

export const useSupabaseData = () => {
  const [state, setState] = useState<SupabaseState>(() => ({
    usuarios: getCached(CACHE_KEYS.USUARIOS, []),
    espacos: getCached(CACHE_KEYS.ESPACOS, []),
    agendamentos: getCached(CACHE_KEYS.AGENDAMENTOS, []),
    agendamentosFixos: getCached(CACHE_KEYS.FIXOS, []),
    loading: true,
    error: null,
  }));

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const QUERY_TIMEOUT = 2500;

      const { data: usersData, error: usersError } = await withTimeout(
        supabase.from('usuarios').select('*').order('created_at'),
        QUERY_TIMEOUT,
        'Timeout usuários'
      );
      if (usersError) throw usersError;
      const usuarios = usersData?.map(convertUsuario) || [];
      setCached(CACHE_KEYS.USUARIOS, usuarios);

      const { data: espacosData, error: espacosError } = await withTimeout(
        supabase.from('espacos').select('*').order('id'),
        QUERY_TIMEOUT,
        'Timeout espaços'
      );
      if (espacosError) throw espacosError;
      const espacos = espacosData?.map(convertEspaco) || [];
      setCached(CACHE_KEYS.ESPACOS, espacos);

      const { data: agendamentosData, error: agendamentosError } = await withTimeout(
        supabase.from('agendamentos').select('*').order('created_at', { ascending: false }),
        QUERY_TIMEOUT,
        'Timeout agendamentos'
      );
      if (agendamentosError) throw agendamentosError;
      const agendamentos = agendamentosData?.map(convertAgendamento) || [];
      setCached(CACHE_KEYS.AGENDAMENTOS, agendamentos);

      const { data: fixosData, error: fixosError } = await withTimeout(
        supabase.from('agendamentos_fixos').select('*').order('created_at', { ascending: false }),
        QUERY_TIMEOUT,
        'Timeout fixos'
      );
      if (fixosError) throw fixosError;
      const agendamentosFixos = fixosData?.map(convertAgendamentoFixo) || [];
      setCached(CACHE_KEYS.FIXOS, agendamentosFixos);

      setState({
        usuarios,
        espacos,
        agendamentos,
        agendamentosFixos,
        loading: false,
        error: null,
      });

    } catch (error: any) {
      console.warn('[SupabaseHook] Erro loadData:', error.message);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Conexão lenta: ${error.message}`,
      }));
    }
  }, []);

  const addUsuario = useCallback(async (usuario: Usuario): Promise<boolean> => {
    try {
      const { error } = await supabase.from('usuarios').insert(convertToUsuarioInsert(usuario, crypto.randomUUID()));
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const updateUsuario = useCallback(async (usuario: Usuario): Promise<boolean> => {
    try {
      const { error } = await supabase.from('usuarios').update({
        nome: usuario.nome, email: usuario.email, tipo: usuario.tipo,
        ativo: usuario.ativo, espacos: usuario.espacos || null,
        telefone: usuario.telefone || null, papel: usuario.papel || null
      }).eq('id', usuario.id);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const deleteUsuario = useCallback(async (usuarioId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', usuarioId);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const addEspaco = useCallback(async (espaco: Espaco): Promise<boolean> => {
    try {
      const { error } = await supabase.from('espacos').insert(convertToEspacoInsert(espaco));
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const updateEspaco = useCallback(async (espaco: Espaco): Promise<boolean> => {
    try {
      const { error } = await supabase.from('espacos').update({
        nome: espaco.nome, capacidade: espaco.capacidade,
        descricao: espaco.descricao || null, equipamentos: espaco.equipamentos || null, ativo: espaco.ativo
      }).eq('id', espaco.id);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const deleteEspaco = useCallback(async (espacoId: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('espacos').delete().eq('id', espacoId);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const addAgendamento = useCallback(async (agendamento: Agendamento): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agendamentos').insert({
        espaco_id: agendamento.espacoId, usuario_id: agendamento.usuarioId,
        data: agendamento.data, aula_inicio: agendamento.aulaInicio, aula_fim: agendamento.aulaFim,
        status: agendamento.status, observacoes: agendamento.observacoes || null,
        agendamento_fixo_id: agendamento.agendamentoFixoId || null
      });
      if (error) throw error;

      const usuario = state.usuarios.find(u => u.id === agendamento.usuarioId);
      const espaco = state.espacos.find(e => e.id === agendamento.espacoId);
      if (usuario && espaco) {
        void NotificationService.notificarTodosGestores(agendamento, usuario, espaco, state.usuarios);
      }

      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData, state.usuarios, state.espacos]);

  const updateAgendamentoStatus = useCallback(async (agendamentoId: number, status: 'pendente' | 'aprovado' | 'rejeitado'): Promise<boolean> => {
    try {
      const agendamentoAtual = state.agendamentos.find(a => a.id === agendamentoId);

      const { error } = await supabase.from('agendamentos').update({ status }).eq('id', agendamentoId);
      if (error) throw error;

      if (agendamentoAtual && (status === 'aprovado' || status === 'rejeitado')) {
        const usuario = state.usuarios.find(u => u.id === agendamentoAtual.usuarioId);
        const espaco = state.espacos.find(e => e.id === agendamentoAtual.espacoId);
        const gestores = NotificationService.findGestoresDoEspaco(agendamentoAtual.espacoId, state.usuarios);
        const gestor = gestores[0]; // Notifica o primeiro gestor encontrado como referência

        if (usuario && espaco && gestor) {
          if (status === 'aprovado') {
            void NotificationService.notificarUsuarioAprovacao(agendamentoAtual, usuario, espaco, gestor);
          } else {
            void NotificationService.notificarUsuarioRejeicao(agendamentoAtual, usuario, espaco, gestor);
          }
        }
      }

      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData, state.agendamentos, state.usuarios, state.espacos]);

  const deleteAgendamento = useCallback(async (agendamentoId: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', agendamentoId);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const addAgendamentoFixo = useCallback(async (af: AgendamentoFixo): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agendamentos_fixos').insert({
        espaco_id: af.espacoId, usuario_id: af.usuarioId, data_inicio: af.dataInicio,
        data_fim: af.dataFim, aula_inicio: af.aulaInicio, aula_fim: af.aulaFim,
        dias_semana: af.diasSemana, observacoes: af.observacoes || null, ativo: af.ativo
      });
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  const deleteAgendamentoFixo = useCallback(async (afId: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('agendamentos_fixos').delete().eq('id', afId);
      if (error) throw error;
      await loadData(true);
      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadData(true);
      else setState(prev => ({ ...prev, usuarios: [], espacos: [], agendamentos: [], agendamentosFixos: [], loading: false, error: null }));
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'espacos' }, () => loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos_fixos' }, () => loadData(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  return useMemo(() => ({
    ...state,
    actions: {
      loadData, addUsuario, updateUsuario, deleteUsuario,
      toggleUsuarioStatus: async (id: string, ativo: boolean) => {
        const u = state.usuarios.find(val => val.id === id);
        return u ? updateUsuario({ ...u, ativo }) : false;
      },
      addEspaco, updateEspaco, deleteEspaco,
      toggleEspacoStatus: async (id: number, ativo: boolean) => {
        const e = state.espacos.find(val => val.id === id);
        return e ? updateEspaco({ ...e, ativo }) : false;
      },
      addAgendamento, deleteAgendamento, updateAgendamentoStatus,
      addAgendamentoFixo, deleteAgendamentoFixo, refreshData: loadData,
      clearError: () => setState(prev => ({ ...prev, error: null })),
    },
  }), [state, loadData, addUsuario, updateUsuario, deleteUsuario, addEspaco, updateEspaco, deleteEspaco, addAgendamento, deleteAgendamento, updateAgendamentoStatus, addAgendamentoFixo, deleteAgendamentoFixo]);
};
