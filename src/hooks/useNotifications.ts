import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export const useNotifications = () => {
  const { toast } = useToast();

  const success = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'default',
    });
  }, [toast]);

  const error = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive',
    });
  }, [toast]);

  const warning = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'default',
    });
  }, [toast]);

  const info = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'default',
    });
  }, [toast]);

  // Notificações específicas do domínio
  const agendamento = {
    created: () => success('Agendamento criado!', 'Seu agendamento foi criado e está aguardando aprovação.'),
    approved: () => success('Agendamento aprovado!', 'O agendamento foi aprovado com sucesso.'),
    rejected: () => error('Agendamento rejeitado!', 'O agendamento foi rejeitado.'),
    updated: () => success('Agendamento atualizado!', 'As alterações foram salvas com sucesso.'),
    deleted: () => success('Agendamento cancelado!', 'O agendamento foi cancelado com sucesso.'),
    conflict: () => error('Conflito de horário!', 'Já existe um agendamento para este horário.'),
    conflictResolved: () => success('Conflito resolvido!', 'O conflito de agendamento foi resolvido com sucesso.'),
    fixedConflict: () => error('Horário bloqueado!', 'Este horário está ocupado por um agendamento fixo.'),
    pendingConflict: () => warning('Conflito pendente', 'Outros usuários também solicitaram este horário. O gestor decidirá.'),
    invalidTime: () => error('Horário inválido!', 'Verifique o horário selecionado.'),
    pastDate: () => error('Data inválida!', 'Não é possível agendar para datas passadas.'),
    outsideWorkingHours: () => error('Fora do horário de funcionamento!', 'Agendamentos são permitidos apenas entre 7h e 22h.'),
  };

  const espaco = {
    created: () => success('Espaço criado!', 'O novo espaço foi adicionado com sucesso.'),
    updated: () => success('Espaço atualizado!', 'As alterações foram salvas com sucesso.'),
    deactivated: () => success('Espaço desativado!', 'O espaço foi desativado com sucesso.'),
    activated: () => success('Espaço ativado!', 'O espaço foi ativado com sucesso.'),
    reactivated: () => success('Espaço reativado!', 'O espaço foi reativado com sucesso.'),
    deleted: () => success('Espaço removido!', 'O espaço foi removido com sucesso.'),
    notFound: () => error('Espaço não encontrado!', 'O espaço selecionado não existe.'),
    unauthorized: () => error('Acesso negado!', 'Você não tem permissão para gerenciar este espaço.'),
  };

  const usuario = {
    created: () => success('Usuário criado!', 'O novo usuário foi adicionado com sucesso.'),
    updated: () => success('Usuário atualizado!', 'As alterações foram salvas com sucesso.'),
    deleted: () => success('Usuário removido!', 'O usuário foi removido com sucesso.'),
    activated: () => success('Usuário ativado!', 'O usuário foi ativado com sucesso.'),
    deactivated: () => success('Usuário desativado!', 'O usuário foi desativado com sucesso.'),
    invalidEmail: () => error('Email inválido!', 'Por favor, insira um email válido.'),
    duplicateEmail: () => error('Email já existe!', 'Este email já está sendo usado por outro usuário.'),
  };

  const auth = {
    loginSuccess: (nome: string) => success('Login realizado!', `Bem-vindo, ${nome}!`),
    loginError: () => error('Erro no login!', 'Usuário não encontrado ou credenciais inválidas.'),
    logout: () => info('Logout realizado!', 'Você foi desconectado com sucesso.'),
    sessionExpired: () => warning('Sessão expirada!', 'Por favor, faça login novamente.'),
  };

  const system = {
    dataLoaded: () => info('Dados carregados!', 'Informações atualizadas com sucesso.'),
    dataError: () => error('Erro ao carregar dados!', 'Tente novamente em alguns momentos.'),
    saving: () => info('Salvando...', 'Aguarde enquanto salvamos suas alterações.'),
    saved: () => success('Salvo!', 'Suas alterações foram salvas com sucesso.'),
    saveError: () => error('Erro ao salvar!', 'Não foi possível salvar as alterações.'),
  };

  return {
    success,
    error,
    warning,
    info,
    agendamento,
    espaco,
    usuario,
    auth,
    system
  };
}; 