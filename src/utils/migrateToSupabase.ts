import { supabase } from '@/lib/supabase';
import { Usuario, Espaco, Agendamento, AgendamentoFixo } from '@/types';

interface LocalStorageData {
  usuarios: Usuario[];
  espacos: Espaco[];
  agendamentos: Agendamento[];
  agendamentosFixos: AgendamentoFixo[];
}

interface MigrationResult {
  success: boolean;
  message: string;
  errors: string[];
  migrated: {
    usuarios: number;
    espacos: number;
    agendamentos: number;
    agendamentosFixos: number;
  };
}

// Mapeamento para converter IDs numéricos em UUIDs
const generateUuidFromId = (id: number): string => {
  const base = '550e8400-e29b-41d4-a716-44665544';
  const paddedId = id.toString().padStart(4, '0');
  return `${base}${paddedId}`;
};

export const migrateLocalStorageToSupabase = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: false,
    message: '',
    errors: [],
    migrated: {
      usuarios: 0,
      espacos: 0,
      agendamentos: 0,
      agendamentosFixos: 0,
    },
  };

  try {
    // 1. Verificar se existem dados no localStorage
    const localData = getLocalStorageData();
    if (!localData) {
      result.message = 'Nenhum dado encontrado no localStorage';
      return result;
    }

    // 2. Verificar se já existem dados no Supabase
    const existingData = await checkExistingData();
    if (existingData.hasData) {
      result.message = 'Dados já existem no Supabase. Migração não necessária.';
      result.success = true;
      return result;
    }

    // 3. Migrar usuários
    const usuariosMigrated = await migrateUsuarios(localData.usuarios);
    result.migrated.usuarios = usuariosMigrated.success;
    if (usuariosMigrated.errors.length > 0) {
      result.errors.push(...usuariosMigrated.errors);
    }

    // 4. Migrar espaços
    const espacosMigrated = await migrateEspacos(localData.espacos);
    result.migrated.espacos = espacosMigrated.success;
    if (espacosMigrated.errors.length > 0) {
      result.errors.push(...espacosMigrated.errors);
    }

    // 5. Migrar agendamentos (após usuários e espaços)
    const agendamentosMigrated = await migrateAgendamentos(localData.agendamentos);
    result.migrated.agendamentos = agendamentosMigrated.success;
    if (agendamentosMigrated.errors.length > 0) {
      result.errors.push(...agendamentosMigrated.errors);
    }

    // 6. Migrar agendamentos fixos
    const agendamentosFixosMigrated = await migrateAgendamentosFixos(localData.agendamentosFixos);
    result.migrated.agendamentosFixos = agendamentosFixosMigrated.success;
    if (agendamentosFixosMigrated.errors.length > 0) {
      result.errors.push(...agendamentosFixosMigrated.errors);
    }

    // 7. Criar backup dos dados originais
    await createLocalStorageBackup(localData);

    result.success = result.errors.length === 0;
    result.message = result.success 
      ? `Migração concluída com sucesso! Migrados: ${result.migrated.usuarios} usuários, ${result.migrated.espacos} espaços, ${result.migrated.agendamentos} agendamentos, ${result.migrated.agendamentosFixos} agendamentos fixos.`
      : `Migração concluída com ${result.errors.length} erro(s). Verifique os logs.`;

    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
    result.message = 'Falha na migração';
    return result;
  }
};

const getLocalStorageData = (): LocalStorageData | null => {
  try {
    const usuarios = localStorage.getItem('usuarios');
    const espacos = localStorage.getItem('espacos');
    const agendamentos = localStorage.getItem('agendamentos');
    const agendamentosFixos = localStorage.getItem('agendamentosFixos');

    if (!usuarios || !espacos || !agendamentos) {
      return null;
    }

    return {
      usuarios: JSON.parse(usuarios),
      espacos: JSON.parse(espacos),
      agendamentos: JSON.parse(agendamentos),
      agendamentosFixos: agendamentosFixos ? JSON.parse(agendamentosFixos) : [],
    };
  } catch (error) {
    return null;
  }
};

const checkExistingData = async (): Promise<{ hasData: boolean }> => {
  try {
    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    return { hasData: (count || 0) > 0 };
  } catch (error) {
    return { hasData: false };
  }
};

const migrateUsuarios = async (usuarios: Usuario[]): Promise<{ success: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;

  for (const usuario of usuarios) {
    try {
      const uuid = generateUuidFromId(usuario.id);
      
      const { error } = await supabase
        .from('usuarios')
        .insert({
          id: uuid,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          ativo: usuario.ativo,
          espacos: usuario.espacos || null,
          telefone: usuario.telefone || null,
        });

      if (error) {
        errors.push(`Usuário ${usuario.nome}: ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      errors.push(`Usuário ${usuario.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return { success, errors };
};

const migrateEspacos = async (espacos: Espaco[]): Promise<{ success: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;

  for (const espaco of espacos) {
    try {
      const { error } = await supabase
        .from('espacos')
        .insert({
          id: espaco.id,
          nome: espaco.nome,
          capacidade: espaco.capacidade,
          descricao: espaco.descricao || null,
          equipamentos: espaco.equipamentos || null,
          ativo: espaco.ativo,
        });

      if (error) {
        errors.push(`Espaço ${espaco.nome}: ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      errors.push(`Espaço ${espaco.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return { success, errors };
};

const migrateAgendamentos = async (agendamentos: Agendamento[]): Promise<{ success: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;

  for (const agendamento of agendamentos) {
    try {
      const usuarioUuid = generateUuidFromId(agendamento.usuarioId);
      
      const { error } = await supabase
        .from('agendamentos')
        .insert({
          id: agendamento.id,
          espaco_id: agendamento.espacoId,
          usuario_id: usuarioUuid,
          data: agendamento.data,
          aula_inicio: agendamento.aulaInicio,
          aula_fim: agendamento.aulaFim,
          status: agendamento.status,
          observacoes: agendamento.observacoes || null,
          agendamento_fixo_id: agendamento.agendamentoFixoId || null,
        });

      if (error) {
        errors.push(`Agendamento ${agendamento.id}: ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      errors.push(`Agendamento ${agendamento.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return { success, errors };
};

const migrateAgendamentosFixos = async (agendamentosFixos: AgendamentoFixo[]): Promise<{ success: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;

  for (const agendamentoFixo of agendamentosFixos) {
    try {
      const usuarioUuid = generateUuidFromId(agendamentoFixo.usuarioId);
      
      const { error } = await supabase
        .from('agendamentos_fixos')
        .insert({
          id: agendamentoFixo.id,
          espaco_id: agendamentoFixo.espacoId,
          usuario_id: usuarioUuid,
          data_inicio: agendamentoFixo.dataInicio,
          data_fim: agendamentoFixo.dataFim,
          aula_inicio: agendamentoFixo.aulaInicio,
          aula_fim: agendamentoFixo.aulaFim,
          dias_semana: agendamentoFixo.diasSemana,
          observacoes: agendamentoFixo.observacoes || null,
          ativo: agendamentoFixo.ativo,
        });

      if (error) {
        errors.push(`Agendamento Fixo ${agendamentoFixo.id}: ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      errors.push(`Agendamento Fixo ${agendamentoFixo.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return { success, errors };
};

const createLocalStorageBackup = async (data: LocalStorageData): Promise<void> => {
  try {
    const backup = {
      ...data,
      backupDate: new Date().toISOString(),
      version: '1.0',
    };

    localStorage.setItem('migration_backup', JSON.stringify(backup));
    } catch (error) {
    }
};

// Função para reverter migração (se necessário)
export const revertMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const backup = localStorage.getItem('migration_backup');
    if (!backup) {
      return { success: false, message: 'Backup não encontrado' };
    }

    const data = JSON.parse(backup);
    
    // Restaurar dados no localStorage
    localStorage.setItem('usuarios', JSON.stringify(data.usuarios));
    localStorage.setItem('espacos', JSON.stringify(data.espacos));
    localStorage.setItem('agendamentos', JSON.stringify(data.agendamentos));
    localStorage.setItem('agendamentosFixos', JSON.stringify(data.agendamentosFixos));

    return { success: true, message: 'Dados restaurados com sucesso do backup' };
  } catch (error) {
    return { 
      success: false, 
      message: `Erro ao reverter: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};

// Função para limpar dados do Supabase (cuidado!)
export const clearSupabaseData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Deletar em ordem para respeitar foreign keys
    await supabase.from('agendamentos').delete().neq('id', 0);
    await supabase.from('agendamentos_fixos').delete().neq('id', 0);
    await supabase.from('espacos').delete().neq('id', 0);
    await supabase.from('usuarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return { success: true, message: 'Dados do Supabase limpos com sucesso' };
  } catch (error) {
    return { 
      success: false, 
      message: `Erro ao limpar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}; 