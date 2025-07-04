import { useReducer, useEffect, useCallback } from 'react';
import { Usuario, Espaco, Agendamento, AgendamentoFixo } from '@/types';
import { DataIntegrityValidations, SecurityValidations, BusinessValidations } from '@/utils/validations';

// Estados da aplicação
interface AppState {
  usuarios: Usuario[];
  espacos: Espaco[];
  agendamentos: Agendamento[];
  agendamentosFixos: AgendamentoFixo[];
  loading: boolean;
  error: string | null;
  dataCorrupted: boolean;
  lastBackup: string | null;
}

// Actions
type AppAction = 
  | { type: 'LOAD_DATA_START' }
  | { type: 'LOAD_DATA_SUCCESS'; payload: Omit<AppState, 'loading' | 'error' | 'dataCorrupted' | 'lastBackup'> }
  | { type: 'LOAD_DATA_ERROR'; payload: string }
  | { type: 'DATA_CORRUPTION_DETECTED'; payload: string }
  | { type: 'UPDATE_USUARIOS'; payload: Usuario[] }
  | { type: 'UPDATE_ESPACOS'; payload: Espaco[] }
  | { type: 'UPDATE_AGENDAMENTOS'; payload: Agendamento[] }
  | { type: 'UPDATE_AGENDAMENTOS_FIXOS'; payload: AgendamentoFixo[] }
  | { type: 'ADD_AGENDAMENTO'; payload: Agendamento }
  | { type: 'UPDATE_AGENDAMENTO_STATUS'; payload: { id: number; status: 'aprovado' | 'rejeitado' } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CREATE_BACKUP'; payload: string };

// Dados iniciais
const INITIAL_DATA = {
  usuarios: [
    { id: 1, nome: 'Administrador', tipo: 'admin' as const, email: 'admin@sistema.com', senha: 'admin123', ativo: true },
    { id: 2, nome: 'Gestor Principal', tipo: 'gestor' as const, espacos: [1, 2], email: 'gestor@sistema.com', senha: 'gestor123', ativo: true },
    { id: 3, nome: 'João Silva', tipo: 'usuario' as const, email: 'joao@email.com', senha: 'usuario123', ativo: true },
    { id: 4, nome: 'Maria Santos', tipo: 'usuario' as const, email: 'maria@email.com', senha: 'usuario123', ativo: true }
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
      aulaInicio: 7,
      aulaFim: 8,
      status: 'pendente' as const,
      observacoes: 'Reunião de planejamento',
      criadoEm: new Date().toISOString()
    },
    {
      id: 2,
      espacoId: 2,
      usuarioId: 4,
      data: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      aulaInicio: 4,
      aulaFim: 5,
      status: 'aprovado' as const,
      observacoes: 'Apresentação do projeto',
      criadoEm: new Date().toISOString()
    }
  ],
  agendamentosFixos: []
};

const initialState: AppState = {
  usuarios: [],
  espacos: [],
  agendamentos: [],
  agendamentosFixos: [],
  loading: true,
  error: null,
  dataCorrupted: false,
  lastBackup: null
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_DATA_START':
      return { ...state, loading: true, error: null };
    
    case 'LOAD_DATA_SUCCESS':
      return { 
        ...state, 
        ...action.payload, 
        loading: false, 
        error: null,
        dataCorrupted: false
      };
    
    case 'LOAD_DATA_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };

    case 'DATA_CORRUPTION_DETECTED':
      return {
        ...state,
        dataCorrupted: true,
        error: action.payload 
      };
    
    case 'UPDATE_USUARIOS':
      return { ...state, usuarios: action.payload };
    
    case 'UPDATE_ESPACOS':
      return { ...state, espacos: action.payload };
    
    case 'UPDATE_AGENDAMENTOS':
      return { ...state, agendamentos: action.payload };
    
    case 'UPDATE_AGENDAMENTOS_FIXOS':
      return { ...state, agendamentosFixos: action.payload };
    
    case 'ADD_AGENDAMENTO':
      return { 
        ...state, 
        agendamentos: [...state.agendamentos, action.payload] 
      };
    
    case 'UPDATE_AGENDAMENTO_STATUS':
      return {
        ...state,
        agendamentos: state.agendamentos.map(a => 
          a.id === action.payload.id 
            ? { ...a, status: action.payload.status }
            : a
        )
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'CREATE_BACKUP':
      return { ...state, lastBackup: action.payload };
    
    default:
      return state;
  }
}

// Utilitários localStorage com validação robusta
const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Verificar segurança dos dados
      const securityCheck = SecurityValidations.validateUserInput(parsed);
      if (!securityCheck.isValid) {
        console.warn(`Dados potencialmente inseguros detectados em ${key}:`, securityCheck.errors);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Erro ao ler ${key} do localStorage:`, error);
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      // Verificar segurança antes de salvar
      const securityCheck = SecurityValidations.validateUserInput(value);
      if (!securityCheck.isValid) {
        console.error(`Tentativa de salvar dados inseguros em ${key}:`, securityCheck.errors);
        return false;
      }
      
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
      return false;
    }
  },

  backup: () => {
    try {
      const backupData = {
        usuarios: storage.get('usuarios'),
        espacos: storage.get('espacos'),
        agendamentos: storage.get('agendamentos'),
        agendamentosFixos: storage.get('agendamentosFixos'),
        timestamp: new Date().toISOString()
      };
      
      const backupKey = `backup_${Date.now()}`;
      storage.set(backupKey, backupData);
      
      // Manter apenas os 5 backups mais recentes
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
      if (allKeys.length > 5) {
        const sortedKeys = allKeys.sort();
        sortedKeys.slice(0, allKeys.length - 5).forEach(key => {
          localStorage.removeItem(key);
        });
      }
      
      return backupKey;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      return null;
    }
  },

  restore: (backupKey: string) => {
    try {
      const backupData = storage.get(backupKey);
      if (!backupData) return false;
      
      // Restaurar dados
      storage.set('usuarios', backupData.usuarios);
      storage.set('espacos', backupData.espacos);
      storage.set('agendamentos', backupData.agendamentos);
      storage.set('agendamentosFixos', backupData.agendamentosFixos);
      
      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return false;
    }
  }
};

// Hook principal
export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Verificação de integridade dos dados
  const validateDataIntegrity = useCallback((data: {
    usuarios: Usuario[];
    espacos: Espaco[];
    agendamentos: Agendamento[];
    agendamentosFixos: AgendamentoFixo[];
  }) => {
    const errors: string[] = [];

    // Verificar estrutura dos arrays
    if (!Array.isArray(data.usuarios)) errors.push('Usuários devem ser um array');
    if (!Array.isArray(data.espacos)) errors.push('Espaços devem ser um array');
    if (!Array.isArray(data.agendamentos)) errors.push('Agendamentos devem ser um array');
    if (!Array.isArray(data.agendamentosFixos)) errors.push('Agendamentos fixos devem ser um array');

    if (errors.length > 0) return { isValid: false, errors };

    // Verificar integridade individual dos dados
    const usuariosValidation = DataIntegrityValidations.validateArrayIntegrity(
      data.usuarios, 
      (u: Usuario) => u.id > 0 && u.nome && u.email && u.tipo
    );
    if (!usuariosValidation.isValid) {
      errors.push(`Usuários inválidos nos índices: ${usuariosValidation.invalidIndexes.join(', ')}`);
    }

    const espacosValidation = DataIntegrityValidations.validateArrayIntegrity(
      data.espacos,
      (e: Espaco) => e.id > 0 && e.nome && e.capacidade > 0
    );
    if (!espacosValidation.isValid) {
      errors.push(`Espaços inválidos nos índices: ${espacosValidation.invalidIndexes.join(', ')}`);
    }

    // Verificar integridade relacional
    const relationalErrors = DataIntegrityValidations.validateRelationalIntegrity(data);
    errors.push(...relationalErrors);

    // Verificar se existe pelo menos um admin
    const admins = data.usuarios.filter(u => u.tipo === 'admin' && u.ativo);
    if (admins.length === 0) {
      errors.push('Deve existir pelo menos um administrador ativo');
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // Carregamento inicial com verificações robustas
  useEffect(() => {
    const loadData = () => {
      dispatch({ type: 'LOAD_DATA_START' });
      
      try {
        const storedUsuarios = storage.get('usuarios');
        const storedEspacos = storage.get('espacos');
        const storedAgendamentos = storage.get('agendamentos');
        const storedAgendamentosFixos = storage.get('agendamentosFixos');

        // Verificar se os dados básicos existem e são válidos
        const hasValidData = storedUsuarios && Array.isArray(storedUsuarios) && 
                           storedEspacos && Array.isArray(storedEspacos) &&
                           storedAgendamentos && Array.isArray(storedAgendamentos);

        if (!hasValidData) {
          console.log('Dados não encontrados ou inválidos, inicializando com dados padrão...');
          // Criar backup dos dados corrompidos se existirem
          if (storedUsuarios || storedEspacos || storedAgendamentos) {
            storage.backup();
          }
          
          // Limpar localStorage completamente
          localStorage.clear();
          
          // Inicializar com dados padrão
          storage.set('usuarios', INITIAL_DATA.usuarios);
          storage.set('espacos', INITIAL_DATA.espacos);
          storage.set('agendamentos', INITIAL_DATA.agendamentos);
          storage.set('agendamentosFixos', INITIAL_DATA.agendamentosFixos);
          
          dispatch({ 
            type: 'LOAD_DATA_SUCCESS', 
            payload: INITIAL_DATA 
          });
          return;
        }

        const loadedData = {
              usuarios: storedUsuarios,
              espacos: storedEspacos,
              agendamentos: storedAgendamentos,
              agendamentosFixos: storedAgendamentosFixos || []
        };

        // Verificar integridade dos dados carregados
        const integrity = validateDataIntegrity(loadedData);
        
        if (!integrity.isValid) {
          console.error('Corrupção de dados detectada:', integrity.errors);
          
          // Tentar restaurar do backup mais recente
          const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('backup_'))
            .sort()
            .reverse();
          
          let restored = false;
          for (const backupKey of backupKeys) {
            if (storage.restore(backupKey)) {
              console.log(`Dados restaurados do backup: ${backupKey}`);
              restored = true;
              break;
            }
          }
          
          if (!restored) {
            // Fallback para dados iniciais
            console.log('Fallback para dados iniciais');
            localStorage.clear();
            storage.set('usuarios', INITIAL_DATA.usuarios);
            storage.set('espacos', INITIAL_DATA.espacos);
            storage.set('agendamentos', INITIAL_DATA.agendamentos);
            storage.set('agendamentosFixos', INITIAL_DATA.agendamentosFixos);
            
            dispatch({ 
              type: 'LOAD_DATA_SUCCESS', 
              payload: INITIAL_DATA 
            });
          } else {
            // Recarregar dados restaurados
            loadData();
          }
          
          dispatch({ 
            type: 'DATA_CORRUPTION_DETECTED', 
            payload: `Corrupção detectada: ${integrity.errors.join(', ')}` 
          });
          return;
        }

        // Dados válidos - carregar normalmente
        dispatch({ 
          type: 'LOAD_DATA_SUCCESS', 
          payload: loadedData 
        });

        // Criar backup automático periodicamente
        const lastBackup = localStorage.getItem('lastBackupTime');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastBackup || (now - parseInt(lastBackup)) > oneDay) {
          const backupKey = storage.backup();
          if (backupKey) {
            localStorage.setItem('lastBackupTime', now.toString());
            dispatch({ type: 'CREATE_BACKUP', payload: backupKey });
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        dispatch({ 
          type: 'LOAD_DATA_ERROR', 
          payload: 'Erro crítico ao carregar dados' 
        });
      }
    };

    loadData();
  }, [validateDataIntegrity]);

  // Actions com validações robustas
  const updateUsuarios = useCallback((usuarios: Usuario[]) => {
    const validation = DataIntegrityValidations.validateArrayIntegrity(
      usuarios, 
      (u: Usuario) => u.id > 0 && u.nome && u.email
    );
    
    if (!validation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Dados de usuários inválidos' });
      return false;
    }
    
    const success = storage.set('usuarios', usuarios);
    if (success) {
    dispatch({ type: 'UPDATE_USUARIOS', payload: usuarios });
    }
    return success;
  }, []);

  const updateEspacos = useCallback((espacos: Espaco[]) => {
    const validation = DataIntegrityValidations.validateArrayIntegrity(
      espacos,
      (e: Espaco) => e.id > 0 && e.nome && e.capacidade > 0
    );
    
    if (!validation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Dados de espaços inválidos' });
      return false;
    }
    
    const success = storage.set('espacos', espacos);
    if (success) {
    dispatch({ type: 'UPDATE_ESPACOS', payload: espacos });
    }
    return success;
  }, []);

  const updateAgendamentos = useCallback((agendamentos: Agendamento[]) => {
    const success = storage.set('agendamentos', agendamentos);
    if (success) {
    dispatch({ type: 'UPDATE_AGENDAMENTOS', payload: agendamentos });
    }
    return success;
  }, []);

  const updateAgendamentosFixos = useCallback((agendamentosFixos: AgendamentoFixo[]) => {
    const success = storage.set('agendamentosFixos', agendamentosFixos);
    if (success) {
    dispatch({ type: 'UPDATE_AGENDAMENTOS_FIXOS', payload: agendamentosFixos });
    }
    return success;
  }, []);

  const addAgendamento = useCallback((agendamento: Agendamento) => {
    // Verificar estrutura do agendamento
    const integrity = DataIntegrityValidations.validateDataStructure(
      agendamento, 
      ['id', 'espacoId', 'usuarioId', 'data', 'aulaInicio', 'aulaFim', 'status']
    );
    
    if (!integrity.isValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Dados do agendamento inválidos' });
      return false;
    }

    // Verificar rate limiting
    const rateLimitKey = `user_${agendamento.usuarioId}_${new Date().toDateString()}`;
    if (!SecurityValidations.rateLimit(rateLimitKey, 10)) {
      dispatch({ type: 'SET_ERROR', payload: 'Muitas tentativas de agendamento hoje' });
      return false;
    }

    const currentAgendamentos = storage.get('agendamentos') || [];
    const newAgendamentos = [...currentAgendamentos, agendamento];
    const success = storage.set('agendamentos', newAgendamentos);
    
    if (success) {
    dispatch({ type: 'ADD_AGENDAMENTO', payload: agendamento });
    }
    return success;
  }, []);

  const updateAgendamentoStatus = useCallback((id: number, status: 'aprovado' | 'rejeitado') => {
    if (!id || id <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'ID de agendamento inválido' });
      return false;
    }

    dispatch({ type: 'UPDATE_AGENDAMENTO_STATUS', payload: { id, status } });
    
    // Atualizar localStorage com o estado mais recente
    setTimeout(() => {
      const currentAgendamentos = storage.get('agendamentos') || [];
      const updatedAgendamentos = currentAgendamentos.map((a: Agendamento) => 
        a.id === id ? { ...a, status } : a
      );
      storage.set('agendamentos', updatedAgendamentos);
    }, 0);
    
    return true;
  }, []);

  // Actions para espaços com validações
  const addEspaco = useCallback((espaco: Espaco) => {
    const integrity = DataIntegrityValidations.validateDataStructure(
      espaco,
      ['id', 'nome', 'capacidade']
    );
    
    if (!integrity.isValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Dados do espaço inválidos' });
      return false;
    }

    const currentEspacos = storage.get('espacos') || [];
    const newEspacos = [...currentEspacos, espaco];
    const success = storage.set('espacos', newEspacos);
    
    if (success) {
    dispatch({ type: 'UPDATE_ESPACOS', payload: newEspacos });
    }
    return success;
  }, []);

  const updateEspaco = useCallback((espaco: Espaco) => {
    const currentEspacos = storage.get('espacos') || [];
    const newEspacos = currentEspacos.map((e: Espaco) => e.id === espaco.id ? espaco : e);
    const success = storage.set('espacos', newEspacos);
    
    if (success) {
    dispatch({ type: 'UPDATE_ESPACOS', payload: newEspacos });
    }
    return success;
  }, []);

  const toggleEspacoStatus = useCallback((id: number, ativo: boolean) => {
    const currentEspacos = storage.get('espacos') || [];
    const newEspacos = currentEspacos.map((e: Espaco) => e.id === id ? { ...e, ativo } : e);
    const success = storage.set('espacos', newEspacos);
    
    if (success) {
    dispatch({ type: 'UPDATE_ESPACOS', payload: newEspacos });
    }
    return success;
  }, []);

  // Actions para usuários com validações
  const addUsuario = useCallback((usuario: Usuario) => {
    const currentUsuarios = storage.get('usuarios') || [];
    const newUsuarios = [...currentUsuarios, usuario];
    const success = storage.set('usuarios', newUsuarios);
    
    if (success) {
    dispatch({ type: 'UPDATE_USUARIOS', payload: newUsuarios });
    }
    return success;
  }, []);

  const updateUsuario = useCallback((usuario: Usuario) => {
    const currentUsuarios = storage.get('usuarios') || [];
    const newUsuarios = currentUsuarios.map((u: Usuario) => u.id === usuario.id ? usuario : u);
    const success = storage.set('usuarios', newUsuarios);
    
    if (success) {
    dispatch({ type: 'UPDATE_USUARIOS', payload: newUsuarios });
    }
    return success;
  }, []);

  const toggleUsuarioStatus = useCallback((id: number, ativo: boolean) => {
    const currentUsuarios = storage.get('usuarios') || [];
    const newUsuarios = currentUsuarios.map((u: Usuario) => u.id === id ? { ...u, ativo } : u);
    const success = storage.set('usuarios', newUsuarios);
    
    if (success) {
    dispatch({ type: 'UPDATE_USUARIOS', payload: newUsuarios });
    }
    return success;
  }, []);

  // Actions para agendamentos fixos
  const addAgendamentoFixo = useCallback((agendamentoFixo: AgendamentoFixo) => {
    const currentAgendamentosFixos = storage.get('agendamentosFixos') || [];
    const newAgendamentosFixos = [...currentAgendamentosFixos, agendamentoFixo];
    const success = storage.set('agendamentosFixos', newAgendamentosFixos);
    
    if (success) {
    dispatch({ type: 'UPDATE_AGENDAMENTOS_FIXOS', payload: newAgendamentosFixos });
    }
    return success;
  }, []);

  const updateAgendamentoFixo = useCallback((agendamentoFixo: AgendamentoFixo) => {
    const currentAgendamentosFixos = storage.get('agendamentosFixos') || [];
    const newAgendamentosFixos = currentAgendamentosFixos.map((af: AgendamentoFixo) => 
      af.id === agendamentoFixo.id ? agendamentoFixo : af
    );
    const success = storage.set('agendamentosFixos', newAgendamentosFixos);
    
    if (success) {
    dispatch({ type: 'UPDATE_AGENDAMENTOS_FIXOS', payload: newAgendamentosFixos });
    }
    return success;
  }, []);

  const deleteAgendamentoFixo = useCallback((id: number) => {
    const currentAgendamentosFixos = storage.get('agendamentosFixos') || [];
    const newAgendamentosFixos = currentAgendamentosFixos.filter((af: AgendamentoFixo) => af.id !== id);
    const success = storage.set('agendamentosFixos', newAgendamentosFixos);
    
    if (success) {
    dispatch({ type: 'UPDATE_AGENDAMENTOS_FIXOS', payload: newAgendamentosFixos });
    }
    return success;
  }, []);

  // Actions de DELETE permanente para administradores
  const deleteEspaco = useCallback((id: number) => {
    const currentEspacos = storage.get('espacos') || [];
    const newEspacos = currentEspacos.filter((e: Espaco) => e.id !== id);
    const success = storage.set('espacos', newEspacos);
    
    if (success) {
      dispatch({ type: 'UPDATE_ESPACOS', payload: newEspacos });
    }
    return success;
  }, []);

  const deleteUsuario = useCallback((id: number) => {
    const currentUsuarios = storage.get('usuarios') || [];
    const newUsuarios = currentUsuarios.filter((u: Usuario) => u.id !== id);
    const success = storage.set('usuarios', newUsuarios);
    
    if (success) {
      dispatch({ type: 'UPDATE_USUARIOS', payload: newUsuarios });
    }
    return success;
  }, []);

  // Utilitários de manutenção
  const createManualBackup = useCallback(() => {
    const backupKey = storage.backup();
    if (backupKey) {
      dispatch({ type: 'CREATE_BACKUP', payload: backupKey });
    }
    return backupKey;
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    ...state,
    actions: {
      updateUsuarios,
      updateEspacos,
      updateAgendamentos,
      updateAgendamentosFixos,
      addAgendamento,
      updateAgendamentoStatus,
      // Espaços
      addEspaco,
      updateEspaco,
      toggleEspacoStatus,
      deleteEspaco,
      // Usuários
      addUsuario,
      updateUsuario,
      toggleUsuarioStatus,
      deleteUsuario,
      // Agendamentos Fixos
      addAgendamentoFixo,
      updateAgendamentoFixo,
      deleteAgendamentoFixo,
      // Utilitários
      createManualBackup,
      clearError
    }
  };
}; 