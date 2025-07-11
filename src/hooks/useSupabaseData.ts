import { useState, useEffect, useCallback } from 'react';
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
  espacos: usuario.espacos || null, // Array será enviado diretamente
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
      const [
        usuariosResponse,
        espacosResponse,
        agendamentosResponse,
        agendamentosFixosResponse
      ] = await Promise.all([
        supabase.from('usuarios').select('*').order('created_at'),
        supabase.from('espacos').select('*').order('id'),
        supabase.from('agendamentos').select('*').order('created_at', { ascending: false }),
        supabase.from('agendamentos_fixos').select('*').order('created_at', { ascending: false })
      ]);

      if (usuariosResponse.error) throw usuariosResponse.error;
      if (espacosResponse.error) throw espacosResponse.error;
      if (agendamentosResponse.error) throw agendamentosResponse.error;
      if (agendamentosFixosResponse.error) throw agendamentosFixosResponse.error;

      // Processar usuários e criar o mapa de UUID
      const uuidMap = new Map<number, string>();
      const usuarios = usuariosResponse.data.map(row => {
        const usuario = convertUsuario(row);
        uuidMap.set(usuario.id, row.id);
        return usuario;
      });
      setUserUuidMap(uuidMap);

      const espacos = espacosResponse.data.map(convertEspaco);
      const agendamentos = agendamentosResponse.data.map(convertAgendamento);
      const agendamentosFixos = agendamentosFixosResponse.data.map(convertAgendamentoFixo);

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

      // Log detalhado para debug
      console.log('🔧 Atualizando usuário:', {
        nome: usuario.nome,
        tipo: usuario.tipo,
        espacosOriginais: usuario.espacos,
        espacosTipo: typeof usuario.espacos,
        espacosLength: usuario.espacos?.length,
        userUuid
      });

      const dadosParaAtualizar = {
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        ativo: usuario.ativo,
        espacos: usuario.espacos || null, // Enviar array diretamente
        telefone: usuario.telefone || null,
        senha: usuario.senha ? usuario.senha : null, // Não enviar senha se não for atualizada
      };

      console.log('📤 Dados sendo enviados para Supabase:', dadosParaAtualizar);

      const { data, error } = await supabase
        .from('usuarios')
        .update(dadosParaAtualizar)
        .eq('id', userUuid)
        .select(); // Retornar os dados atualizados

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        throw error;
      }

      console.log('✅ Usuário atualizado com sucesso:', data);

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

      // Capturar dados ANTES da inserção para evitar problemas de timing
      const usuario = state.usuarios.find(u => u.id === agendamento.usuarioId);
      const espaco = state.espacos.find(e => e.id === agendamento.espacoId);
      const todosUsuarios = [...state.usuarios]; // Cópia dos usuários atuais

      console.log('🔄 Criando agendamento:', { agendamento, usuario: usuario?.nome, espaco: espaco?.nome });

      const { error } = await supabase
        .from('agendamentos')
        .insert(convertToAgendamentoInsert(agendamento, userUuid));

      if (error) throw error;

      await loadData();

      // Enviar notificação por email para gestores após criação bem-sucedida
      try {
        if (usuario && espaco) {
          console.log('📧 Enviando notificação para gestores...');
          const resultado = await NotificationService.notificarTodosGestores(agendamento, usuario, espaco, todosUsuarios);
          console.log('📧 Resultado da notificação:', resultado);
        } else {
          console.warn('⚠️ Não foi possível enviar notificação: dados incompletos', { 
            usuario: !!usuario, 
            espaco: !!espaco 
          });
        }
      } catch (emailError) {
        console.warn('⚠️ Falha ao enviar notificação por email:', emailError);
        // Não falha a operação se o email falhar
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao adicionar agendamento' }));
      return false;
    }
  }, [userUuidMap, loadData, state.usuarios, state.espacos]);

  const updateAgendamentoStatus = useCallback(async (agendamentoId: number, status: 'pendente' | 'aprovado' | 'rejeitado'): Promise<boolean> => {
    try {
      // Buscar o agendamento antes da atualização para ter os dados para notificação
      const agendamentoAtual = state.agendamentos.find(a => a.id === agendamentoId);
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', agendamentoId);

      if (error) throw error;

      await loadData();

      // Enviar notificação por email para o usuário sobre a decisão
      if (agendamentoAtual && (status === 'aprovado' || status === 'rejeitado')) {
        try {
          const usuario = state.usuarios.find(u => u.id === agendamentoAtual.usuarioId);
          const espaco = state.espacos.find(e => e.id === agendamentoAtual.espacoId);
          
          // Encontrar um gestor para identificar quem aprovou/rejeitou (para fins de email)
          const gestores = NotificationService.findGestoresDoEspaco(agendamentoAtual.espacoId, state.usuarios);
          const gestor = gestores[0]; // Usar o primeiro gestor encontrado
          
          if (usuario && espaco && gestor) {
            if (status === 'aprovado') {
              await NotificationService.notificarUsuarioAprovacao(agendamentoAtual, usuario, espaco, gestor);
            } else if (status === 'rejeitado') {
              await NotificationService.notificarUsuarioRejeicao(agendamentoAtual, usuario, espaco, gestor);
            }
          }
        } catch (emailError) {
          console.warn('Aviso: Falha ao enviar notificação por email:', emailError);
          // Não falha a operação se o email falhar
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar agendamento' }));
      return false;
    }
  }, [loadData, state.agendamentos, state.usuarios, state.espacos]);

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
      loadData,
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
      addAgendamento,
      updateAgendamento,
      deleteAgendamento,
      updateAgendamentoStatus,
      addAgendamentoFixo,
      updateAgendamentoFixo,
      deleteAgendamentoFixo,
      refreshData: loadData,
      clearError: () => setState(prev => ({ ...prev, error: null })),
    },
  };
}; 