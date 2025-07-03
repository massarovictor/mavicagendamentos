export type TipoUsuario = 'admin' | 'gestor' | 'usuario';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
  ativo: boolean;
  espacos?: number[]; // IDs dos espaços que o gestor gerencia
  telefone?: string;
}

export interface Espaco {
  id: number;
  nome: string;
  capacidade: number;
  descricao?: string;
  equipamentos?: string[];
  ativo: boolean;
}

export interface Agendamento {
  id: number;
  espacoId: number;
  usuarioId: number;
  data: string;
  aulaInicio: number; // Aula de 1 a 9
  aulaFim: number; // Aula de 1 a 9
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  criadoEm: string;
  agendamentoFixoId?: number; // Referência ao agendamento fixo que gerou este agendamento
}

export interface AgendamentoFixo {
  id: number;
  espacoId: number;
  usuarioId: number;
  dataInicio: string;
  dataFim: string;
  aulaInicio: number; // Aula de 1 a 9
  aulaFim: number; // Aula de 1 a 9
  diasSemana: number[]; // 0-6 (domingo-sábado)
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthState {
  usuario: Usuario | null;
  isLoggedIn: boolean;
}

// Mapeamento de aulas para horários
export const AULAS_HORARIOS = {
  1: { inicio: '07:20', fim: '08:10' },
  2: { inicio: '08:10', fim: '09:00' },
  3: { inicio: '09:20', fim: '10:10' },
  4: { inicio: '10:10', fim: '11:00' },
  5: { inicio: '11:00', fim: '11:50' },
  6: { inicio: '13:20', fim: '14:10' },
  7: { inicio: '14:10', fim: '15:00' },
  8: { inicio: '15:20', fim: '16:10' },
  9: { inicio: '16:10', fim: '17:00' }
} as const;

export type NumeroAula = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
