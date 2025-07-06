import { Agendamento, Espaco, Usuario, AgendamentoFixo, AULAS_HORARIOS, NumeroAula } from '@/types';
import { z } from 'zod';

/**
 * Cria um objeto Date a partir de uma string 'YYYY-MM-DD' no fuso horário local,
 * evitando a conversão automática para UTC.
 * @param dateString A data no formato 'YYYY-MM-DD'.
 * @returns Um objeto Date local ou null se a string for inválida.
 */
const createLocalDate = (dateString: string): Date | null => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-indexados
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  // Garante que a data criada corresponde aos componentes, evitando estouro de mês/dia
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date;
  }
  return null;
};

// Schemas de validação usando Zod
export const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  tipo: z.enum(['admin', 'gestor', 'usuario']),
  senha: z.string().optional(),
  espacos: z.array(z.number()).optional()
});

export const espacoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  capacidade: z.number().min(1, 'Capacidade deve ser pelo menos 1'),
  descricao: z.string().optional(),
  equipamentos: z.string().optional()
});

export const emailSchema = z.string()
  .min(1, 'Email é obrigatório')
  .email('Email deve ter formato válido')
  .max(100, 'Email deve ter no máximo 100 caracteres')
  .refine(email => !email.includes('..'), 'Email não pode ter pontos consecutivos')
  .refine(email => email.split('@')[1]?.length > 0, 'Domínio do email é obrigatório');

export const nomeSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .refine(nome => nome.trim().length > 0, 'Nome não pode ser apenas espaços')
  .refine(nome => /^[a-zA-ZÀ-ÿ\s]+$/.test(nome), 'Nome deve conter apenas letras e espaços');

export const senhaSchema = z.string()
  .min(4, 'Senha deve ter pelo menos 4 dígitos')
  .max(20, 'Senha deve ter no máximo 20 dígitos')
  .refine(senha => /^[0-9]+$/.test(senha), 'Senha deve conter apenas números');

export const agendamentoSchema = z.object({
  espacoId: z.number().positive('Espaço deve ser selecionado'),
  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(data => {
      const date = createLocalDate(data);
      return date !== null && !isNaN(date.getTime());
    }, 'Data deve ser válida'),
  aulaInicio: z.number().min(1, 'Aula deve ser entre 1 e 9').max(9, 'Aula deve ser entre 1 e 9'),
  aulaFim: z.number().min(1, 'Aula deve ser entre 1 e 9').max(9, 'Aula deve ser entre 1 e 9'),
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional()
}).refine(data => data.aulaInicio <= data.aulaFim, {
  message: 'Aula de início deve ser anterior ou igual à aula de fim',
  path: ['aulaFim']
});

export const agendamentoFixoSchema = z.object({
  espacoId: z.number().positive('Espaço deve ser selecionado'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  aulaInicio: z.number().min(1, 'Aula deve ser entre 1 e 9').max(9, 'Aula deve ser entre 1 e 9'),
  aulaFim: z.number().min(1, 'Aula deve ser entre 1 e 9').max(9, 'Aula deve ser entre 1 e 9'),
  diasSemana: z.array(z.number().min(0).max(6)).min(1, 'Selecione pelo menos um dia da semana'),
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional()
}).refine(data => data.aulaInicio <= data.aulaFim, {
  message: 'Aula de início deve ser anterior ou igual à aula de fim',
  path: ['aulaFim']
}).refine(data => {
  const inicio = createLocalDate(data.dataInicio);
  const fim = createLocalDate(data.dataFim);
  return inicio && fim && inicio < fim;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['dataFim']
});

// Validações de integridade de dados
export class DataIntegrityValidations {
  static validateDataStructure<T>(data: any, expectedKeys: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Dados devem ser um objeto válido'] };
    }

    // Verificar chaves obrigatórias
    const missingKeys = expectedKeys.filter(key => !(key in data));
    if (missingKeys.length > 0) {
      errors.push(`Chaves obrigatórias ausentes: ${missingKeys.join(', ')}`);
    }

    // Verificar tipos básicos
    if ('id' in data && (typeof data.id !== 'number' || data.id <= 0)) {
      errors.push('ID deve ser um número positivo');
    }

    if ('ativo' in data && typeof data.ativo !== 'boolean') {
      errors.push('Campo "ativo" deve ser um booleano');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateArrayIntegrity<T>(array: T[], validator: (item: T) => boolean): { isValid: boolean; invalidIndexes: number[] } {
    if (!Array.isArray(array)) {
      return { isValid: false, invalidIndexes: [] };
    }

    const invalidIndexes = array
      .map((item, index) => validator(item) ? -1 : index)
      .filter(index => index !== -1);

    return { isValid: invalidIndexes.length === 0, invalidIndexes };
  }

  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/\s+/g, ' ') // Múltiplos espaços -> espaço único
      .replace(/[<>]/g, '') // Remove caracteres potencialmente perigosos
      .substring(0, 1000); // Limita tamanho
  }

  static validateRelationalIntegrity(data: {
    usuarios: Usuario[];
    espacos: Espaco[];
    agendamentos: Agendamento[];
    agendamentosFixos: AgendamentoFixo[];
  }): string[] {
    const errors: string[] = [];

    // Verificar se todos os agendamentos referenciam usuários e espaços válidos
    data.agendamentos.forEach(agendamento => {
      const usuarioExiste = data.usuarios.some(u => u.id === agendamento.usuarioId);
      const espacoExiste = data.espacos.some(e => e.id === agendamento.espacoId);

      if (!usuarioExiste) {
        errors.push(`Agendamento ${agendamento.id} referencia usuário inexistente: ${agendamento.usuarioId}`);
      }
      if (!espacoExiste) {
        errors.push(`Agendamento ${agendamento.id} referencia espaço inexistente: ${agendamento.espacoId}`);
      }
    });

    // Verificar agendamentos fixos
    data.agendamentosFixos.forEach(af => {
      const usuarioExiste = data.usuarios.some(u => u.id === af.usuarioId);
      const espacoExiste = data.espacos.some(e => e.id === af.espacoId);

      if (!usuarioExiste) {
        errors.push(`Agendamento fixo ${af.id} referencia usuário inexistente: ${af.usuarioId}`);
      }
      if (!espacoExiste) {
        errors.push(`Agendamento fixo ${af.id} referencia espaço inexistente: ${af.espacoId}`);
      }
    });

    // Verificar se gestores têm espaços válidos
    data.usuarios.forEach(usuario => {
      if (usuario.tipo === 'gestor' && usuario.espacos) {
        const espacosInvalidos = usuario.espacos.filter(espacoId => 
          !data.espacos.some(e => e.id === espacoId)
        );
        if (espacosInvalidos.length > 0) {
          errors.push(`Gestor ${usuario.nome} tem espaços inexistentes: ${espacosInvalidos.join(', ')}`);
        }
      }
    });

    return errors;
  }
}

// Validações de segurança
export class SecurityValidations {
  static validateUserInput(input: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar tamanho excessivo
    const jsonSize = JSON.stringify(input).length;
    if (jsonSize > 10000) { // 10KB limit
      errors.push('Dados muito grandes');
    }

    // Verificar tentativas de injeção
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    const inputStr = JSON.stringify(input).toLowerCase();
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(inputStr)) {
        errors.push('Conteúdo potencialmente perigoso detectado');
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static validatePermissions(usuario: Usuario, action: string, targetId?: number): boolean {
    // Admin pode tudo
    if (usuario.tipo === 'admin') return true;
    
    // Gestor tem permissões específicas
    if (usuario.tipo === 'gestor') {
      switch (action) {
        case 'manage_assigned_spaces':
          return true;
        case 'manage_space':
          return usuario.espacos?.includes(targetId!) || false;
        case 'create_booking':
          return usuario.ativo;
        default:
          return false;
      }
    }
    
    // Usuário comum
    if (usuario.tipo === 'usuario') {
      switch (action) {
        case 'create_booking':
          return usuario.ativo;
        default:
          return false;
      }
    }

    return false;
  }

  static rateLimit = (() => {
    const attempts = new Map<string, { count: number; lastAttempt: number }>();
    
    return (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
      const now = Date.now();
      const entry = attempts.get(key) || { count: 0, lastAttempt: 0 };
      
      // Reset se passou da janela de tempo
      if (now - entry.lastAttempt > windowMs) {
        entry.count = 0;
      }
      
      entry.count++;
      entry.lastAttempt = now;
      attempts.set(key, entry);
      
      return entry.count <= maxAttempts;
    };
  })();
}

// Validações de lógica de negócio
export class BusinessValidations {
  static validateAgendamentoConflict(
    novoAgendamento: Pick<Agendamento, 'espacoId' | 'data' | 'aulaInicio' | 'aulaFim'>,
    agendamentosExistentes: Agendamento[],
    excludeId?: number
  ): string | null {
    // Verificar integridade dos dados primeiro
    const integrity = DataIntegrityValidations.validateDataStructure(novoAgendamento, ['espacoId', 'data', 'aulaInicio', 'aulaFim']);
    if (!integrity.isValid) {
      return 'Dados do agendamento inválidos';
    }

    const conflito = agendamentosExistentes.find(a => 
      a.id !== excludeId &&
      a.espacoId === novoAgendamento.espacoId &&
      a.data === novoAgendamento.data &&
      (a.status === 'aprovado' || a.status === 'pendente') &&
      this.aulasConflitam(
        { inicio: novoAgendamento.aulaInicio, fim: novoAgendamento.aulaFim },
        { inicio: a.aulaInicio, fim: a.aulaFim }
      )
    );

    if (conflito) {
      if (conflito.status === 'aprovado') {
        return conflito.agendamentoFixoId 
          ? 'Este horário está ocupado por um agendamento fixo (não pode ser alterado)'
          : 'Este horário já está aprovado para outro usuário';
      } else {
        return 'Existe outro agendamento pendente para este horário. O gestor deverá escolher entre eles.';
      }
    }

    return null;
  }

  static validateEspacoDisponivel(espacoId: number, espacos: Espaco[]): string | null {
    if (!espacoId || espacoId <= 0) {
      return 'ID do espaço inválido';
    }

    const espaco = espacos.find(e => e.id === espacoId);
    if (!espaco) {
      return 'Espaço não encontrado';
    }

    if (!espaco.ativo) {
      return 'Este espaço está desativado';
    }

    return null;
  }

  static validateUsuarioAtivo(usuarioId: number, usuarios: Usuario[]): string | null {
    if (!usuarioId || usuarioId <= 0) {
      return 'ID do usuário inválido';
    }

    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!usuario) {
      return 'Usuário não encontrado';
    }

    if (!usuario.ativo) {
      return 'Este usuário está desativado';
    }

    return null;
  }

  static validatePermissaoEspaco(
    espacoId: number, 
    usuario: Usuario, 
    operacao: 'visualizar' | 'gerenciar' | 'agendar'
  ): string | null {
    if (!usuario) {
      return 'Usuário não autenticado';
    }

    if (!usuario.ativo) {
      return 'Usuário desativado';
    }

    if (usuario.tipo === 'admin') return null;
    
    if (operacao === 'gerenciar' && usuario.tipo === 'gestor') {
      return usuario.espacos?.includes(espacoId) 
        ? null 
        : 'Você não tem permissão para gerenciar este espaço';
    }
    
    if (operacao === 'agendar' && usuario.tipo === 'usuario') {
      return null; // Usuários podem agendar qualquer espaço ativo
    }
    
    return 'Permissão insuficiente';
  }

  static validateDataAgendamento(data: string): string | null {
    if (!data || typeof data !== 'string') {
      return 'Data é obrigatória';
    }

    const dataAgendamento = createLocalDate(data);
    if (!dataAgendamento) {
      return 'Data inválida';
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataAgendamento < hoje) {
      return 'Não é possível agendar para datas passadas';
    }
    
    // Validar se não é muito no futuro (ex: 6 meses)
    const seiseMesesFuturo = new Date();
    seiseMesesFuturo.setMonth(seiseMesesFuturo.getMonth() + 6);
    
    if (dataAgendamento > seiseMesesFuturo) {
      return 'Agendamentos só podem ser feitos com até 6 meses de antecedência';
    }

    // Verificar dias úteis - agora permite sábados
    const diaSemana = dataAgendamento.getDay();
    if (diaSemana === 0) {
      return 'Agendamentos não são permitidos aos domingos';
    }
    
    return null;
  }

  static validateAulasSequencia(aulaInicio: number, aulaFim: number): string | null {
    if (typeof aulaInicio !== 'number' || typeof aulaFim !== 'number') {
      return 'Aulas devem ser números';
    }

    if (aulaInicio < 1 || aulaInicio > 9 || aulaFim < 1 || aulaFim > 9) {
      return 'Aulas devem estar entre 1 e 9';
    }
    
    if (aulaInicio > aulaFim) {
      return 'Aula de início deve ser anterior ou igual à aula de fim';
    }
    
    // Removida restrição de duração máxima - agora permite qualquer quantidade de aulas consecutivas
    
    return null;
  }

  static validateHorarioComercial(aulaInicio: number, aulaFim: number): string | null {
    // Verificar se está dentro do horário de funcionamento (7h às 22h)
    if (aulaInicio < 1 || aulaFim > 9) {
      return 'Agendamentos permitidos apenas das 7h às 22h (1ª à 9ª aula)';
    }
    
    return null;
  }

  static validateCapacidadeEspaco(espacoId: number, numeroParticipantes: number, espacos: Espaco[]): string | null {
    const espaco = espacos.find(e => e.id === espacoId);
    if (!espaco) {
      return 'Espaço não encontrado';
    }

    if (numeroParticipantes > espaco.capacidade) {
      return `Número de participantes (${numeroParticipantes}) excede a capacidade do espaço (${espaco.capacidade})`;
    }

    return null;
  }

  static validateAgendamentoFixoConflict(
    novoAgendamento: Pick<Agendamento, 'espacoId' | 'data' | 'aulaInicio' | 'aulaFim'>,
    agendamentosFixos: AgendamentoFixo[]
  ): string | null {
    // Verificar integridade dos dados
    const integrity = DataIntegrityValidations.validateDataStructure(novoAgendamento, ['espacoId', 'data', 'aulaInicio', 'aulaFim']);
    if (!integrity.isValid) {
      return 'Dados do agendamento inválidos';
    }

    const dataAgendamento = createLocalDate(novoAgendamento.data);
    if (!dataAgendamento) {
      return 'Data do agendamento inválida';
    }

    const diaSemana = dataAgendamento.getDay();

    const conflitoFixo = agendamentosFixos.find(af => {
      const dataInicioFixo = createLocalDate(af.dataInicio);
      const dataFimFixo = createLocalDate(af.dataFim);
      if (!dataInicioFixo || !dataFimFixo) return false;

      return af.ativo &&
        af.espacoId === novoAgendamento.espacoId &&
        af.diasSemana.includes(diaSemana) &&
        dataAgendamento >= dataInicioFixo &&
        dataAgendamento <= dataFimFixo &&
        this.aulasConflitam(
          { inicio: novoAgendamento.aulaInicio, fim: novoAgendamento.aulaFim },
          { inicio: af.aulaInicio, fim: af.aulaFim }
        );
    });

    return conflitoFixo ? 'Este horário está bloqueado por um agendamento fixo' : null;
  }

  static getAgendamentoConflicts(
    agendamento: Pick<Agendamento, 'espacoId' | 'data' | 'aulaInicio' | 'aulaFim'>,
    agendamentosExistentes: Agendamento[],
    agendamentosFixos: AgendamentoFixo[],
    excludeId?: number
  ): {
    agendamentosConflitantes: Agendamento[];
    agendamentosFixosConflitantes: AgendamentoFixo[];
    hasConflicts: boolean;
  } {
    // Verificar integridade dos dados primeiro
    const integrity = DataIntegrityValidations.validateDataStructure(agendamento, ['espacoId', 'data', 'aulaInicio', 'aulaFim']);
    if (!integrity.isValid) {
      return { agendamentosConflitantes: [], agendamentosFixosConflitantes: [], hasConflicts: false };
    }

    const dataAgendamento = createLocalDate(agendamento.data);
    if (!dataAgendamento) {
      return { agendamentosConflitantes: [], agendamentosFixosConflitantes: [], hasConflicts: false };
    }

    const diaSemana = dataAgendamento.getDay();

    const agendamentosConflitantes = agendamentosExistentes.filter(a => 
      a.id !== excludeId &&
      a.espacoId === agendamento.espacoId &&
      a.data === agendamento.data &&
      (a.status === 'aprovado' || a.status === 'pendente') &&
      this.aulasConflitam(
        { inicio: agendamento.aulaInicio, fim: agendamento.aulaFim },
        { inicio: a.aulaInicio, fim: a.aulaFim }
      )
    );

    const agendamentosFixosConflitantes = agendamentosFixos.filter(af => {
      const dataInicioFixo = createLocalDate(af.dataInicio);
      const dataFimFixo = createLocalDate(af.dataFim);
      if (!dataInicioFixo || !dataFimFixo) return false;

      return af.ativo &&
        af.espacoId === agendamento.espacoId &&
        af.diasSemana.includes(diaSemana) &&
        dataAgendamento >= dataInicioFixo &&
        dataAgendamento <= dataFimFixo &&
        this.aulasConflitam(
          { inicio: agendamento.aulaInicio, fim: agendamento.aulaFim },
          { inicio: af.aulaInicio, fim: af.aulaFim }
        )
    });

    return {
      agendamentosConflitantes,
      agendamentosFixosConflitantes,
      hasConflicts: agendamentosConflitantes.length > 0 || agendamentosFixosConflitantes.length > 0
    };
  }

  static isHorarioDisponivel(
    espacoId: number,
    data: string,
    aulaInicio: number,
    aulaFim: number,
    agendamentos: Agendamento[],
    agendamentosFixos: AgendamentoFixo[],
    excludeId?: number
  ): boolean {
    const conflicts = this.getAgendamentoConflicts(
      { espacoId, data, aulaInicio, aulaFim },
      agendamentos,
      agendamentosFixos,
      excludeId
    );

    // Horário está disponível se não há agendamentos aprovados ou fixos conflitantes
    const hasApprovedConflicts = conflicts.agendamentosConflitantes.some(a => a.status === 'aprovado');
    const hasFixedConflicts = conflicts.agendamentosFixosConflitantes.length > 0;

    return !hasApprovedConflicts && !hasFixedConflicts;
  }

  private static aulasConflitam(
    aulas1: { inicio: number; fim: number },
    aulas2: { inicio: number; fim: number }
  ): boolean {
    return (aulas1.inicio <= aulas2.fim) && (aulas1.fim >= aulas2.inicio);
  }
}

// Utilitários de formatação
export class FormatUtils {
  static formatDate(date: string): string {
    const localDate = createLocalDate(date);
    return localDate ? localDate.toLocaleDateString('pt-BR') : 'Data inválida';
  }

  static formatAula(aula: number): string {
    return `${aula}ª aula`;
  }

  static formatAulaComHorario(aula: number): string {
    const horario = AULAS_HORARIOS[aula as NumeroAula];
    if (!horario) return `${aula}ª aula`;
    return `${aula}ª aula (${horario.inicio}-${horario.fim})`;
  }

  static formatDateTime(date: string, aula: number): string {
    const horario = AULAS_HORARIOS[aula as NumeroAula];
    const horarioStr = horario ? ` às ${horario.inicio}` : ` na ${aula}ª aula`;
    const localDate = createLocalDate(date);
    const dateStr = localDate ? localDate.toLocaleDateString('pt-BR') : 'Data inválida';
    return `${dateStr}${horarioStr}`;
  }

  static formatAulaRange(aulaInicio: number, aulaFim: number): string {
    if (aulaInicio === aulaFim) {
      return this.formatAula(aulaInicio);
    }
    return `${aulaInicio}ª à ${aulaFim}ª aula`;
  }

  static formatAulaRangeComHorario(aulaInicio: number, aulaFim: number): string {
    const horarioInicio = AULAS_HORARIOS[aulaInicio as NumeroAula];
    const horarioFim = AULAS_HORARIOS[aulaFim as NumeroAula];
    
    if (!horarioInicio || !horarioFim) {
      return this.formatAulaRange(aulaInicio, aulaFim);
    }
    
    return `${aulaInicio}ª à ${aulaFim}ª aula (${horarioInicio.inicio}-${horarioFim.fim})`;
  }

  static formatCapacidade(capacidade: number): string {
    return `${capacidade} pessoa${capacidade !== 1 ? 's' : ''}`;
  }

  static getStatusLabel(status: string): string {
    const labels = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado'
    };
    return labels[status as keyof typeof labels] || status;
  }

  static getStatusColor(status: string): string {
    const colors = {
      'aprovado': 'bg-green-100 text-green-800',
      'rejeitado': 'bg-red-100 text-red-800',
      'pendente': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  static getTipoUsuarioLabel(tipo: string): string {
    const labels = {
      'admin': 'Administrador',
      'gestor': 'Gestor',
      'usuario': 'Usuário'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  }

  static getDiasSemanaLabel(dias: number[]): string {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias.sort().map(dia => labels[dia]).join(', ');
  }

  static getAulaOptions(): Array<{ value: number; label: string }> {
    return Array.from({ length: 9 }, (_, i) => {
      const aula = i + 1;
      const horario = AULAS_HORARIOS[aula as NumeroAula];
      return {
        value: aula,
        label: `${aula}ª aula (${horario.inicio}-${horario.fim})`
      };
    });
  }
}

// Utilitários de filtros e buscas
export class FilterUtils {
  static filterAgendamentosByStatus(agendamentos: Agendamento[], status?: string) {
    if (!status || status === 'todos') return agendamentos;
    return agendamentos.filter(a => a.status === status);
  }

  static filterAgendamentosByDate(agendamentos: Agendamento[], dataInicio?: string, dataFim?: string) {
    return agendamentos.filter(a => {
      if (dataInicio && a.data < dataInicio) return false;
      if (dataFim && a.data > dataFim) return false;
      return true;
    });
  }

  static filterAgendamentosByUser(agendamentos: Agendamento[], usuarioId?: number) {
    if (!usuarioId) return agendamentos;
    return agendamentos.filter(a => a.usuarioId === usuarioId);
  }

  static filterAgendamentosByEspaco(agendamentos: Agendamento[], espacoId?: number) {
    if (!espacoId) return agendamentos;
    return agendamentos.filter(a => a.espacoId === espacoId);
  }

  static searchAgendamentos(agendamentos: Agendamento[], searchTerm: string, espacos: Espaco[], usuarios: Usuario[]) {
    if (!searchTerm) return agendamentos;
    
    const term = DataIntegrityValidations.sanitizeString(searchTerm.toLowerCase());
    return agendamentos.filter(a => {
      const espaco = espacos.find(e => e.id === a.espacoId);
      const usuario = usuarios.find(u => u.id === a.usuarioId);
      
      return (
        espaco?.nome.toLowerCase().includes(term) ||
        usuario?.nome.toLowerCase().includes(term) ||
        a.observacoes?.toLowerCase().includes(term) ||
        a.data.includes(term) ||
        a.aulaInicio.toString().includes(term) ||
        a.aulaFim.toString().includes(term)
      );
    });
  }
}

// Type guards
export const isValidEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const isValidDate = (date: string): boolean => {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date).success;
};

export const isValidAula = (aula: number): boolean => {
  return aula >= 1 && aula <= 9;
}; 