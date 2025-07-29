import { describe, it, expect } from 'vitest';
import { BusinessValidations } from '../validations';
import { Usuario, Espaco } from '@/types';

describe('BusinessValidations - Testes Básicos', () => {
  const mockUsuarios: Usuario[] = [
    { id: 1, nome: 'João', email: 'joao@test.com', tipo: 'usuario', ativo: true },
    { id: 2, nome: 'Maria', email: 'maria@test.com', tipo: 'gestor', ativo: false }
  ];

  const mockEspacos: Espaco[] = [
    { id: 1, nome: 'Sala 1', capacidade: 30, ativo: true },
    { id: 2, nome: 'Sala 2', capacidade: 20, ativo: false }
  ];

  describe('validateUsuarioAtivo', () => {
    it('deve validar usuário ativo', () => {
      const result = BusinessValidations.validateUsuarioAtivo(1, mockUsuarios);
      expect(result).toBeNull();
    });

    it('deve rejeitar usuário inativo', () => {
      const result = BusinessValidations.validateUsuarioAtivo(2, mockUsuarios);
      expect(result).toContain('desativado');
    });

    it('deve rejeitar usuário inexistente', () => {
      const result = BusinessValidations.validateUsuarioAtivo(999, mockUsuarios);
      expect(result).toContain('não encontrado');
    });
  });

  describe('validateEspacoDisponivel', () => {
    it('deve validar espaço ativo', () => {
      const result = BusinessValidations.validateEspacoDisponivel(1, mockEspacos);
      expect(result).toBeNull();
    });

    it('deve rejeitar espaço inativo', () => {
      const result = BusinessValidations.validateEspacoDisponivel(2, mockEspacos);
      expect(result).toContain('desativado');
    });
  });

  describe('validateDataAgendamento', () => {
    it('deve validar data futura', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataAmanha = amanha.toISOString().split('T')[0];
      
      const result = BusinessValidations.validateDataAgendamento(dataAmanha);
      expect(result).toBeNull();
    });

    it('deve rejeitar data passada', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataOntem = ontem.toISOString().split('T')[0];
      
      const result = BusinessValidations.validateDataAgendamento(dataOntem);
      expect(result).toContain('passadas');
    });
  });

  describe('validateAulasSequencia', () => {
    it('deve validar sequência válida', () => {
      const result = BusinessValidations.validateAulasSequencia(2, 4);
      expect(result).toBeNull();
    });

    it('deve rejeitar sequência inválida', () => {
      const result = BusinessValidations.validateAulasSequencia(5, 3);
      expect(result).toContain('anterior ou igual');
    });

    it('deve validar aula única', () => {
      const result = BusinessValidations.validateAulasSequencia(3, 3);
      expect(result).toBeNull();
    });
  });
}); 