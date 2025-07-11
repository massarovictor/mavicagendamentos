import { emailService } from './emailService';
import { EmailTemplates, EmailNotificationData } from './emailTemplates';
import { Agendamento, Usuario, Espaco, NumeroAula } from '@/types';

export class NotificationService {
  /**
   * Notifica o gestor sobre uma nova solicitação de agendamento
   */
  static async notificarGestorNovaSolicitacao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.novaSolicitacao(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(gestor.email, subject, message, 'nova_solicitacao');
      
      if (sucesso) {
        console.log(`✅ Notificação enviada para gestor: ${gestor.email} sobre solicitação de ${usuario.nome}`);
      } else {
        console.error(`❌ Falha ao enviar notificação para gestor: ${gestor.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar gestor sobre nova solicitação:', error);
      return false;
    }
  }

  /**
   * Notifica o usuário sobre aprovação do agendamento
   */
  static async notificarUsuarioAprovacao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.agendamentoAprovado(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(usuario.email, subject, message, 'aprovacao');
      
      if (sucesso) {
        console.log(`✅ Notificação de aprovação enviada para: ${usuario.email}`);
      } else {
        console.error(`❌ Falha ao enviar notificação de aprovação para: ${usuario.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar usuário sobre aprovação:', error);
      return false;
    }
  }

  /**
   * Notifica o usuário sobre rejeição do agendamento
   */
  static async notificarUsuarioRejeicao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.agendamentoRejeitado(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(usuario.email, subject, message, 'rejeicao');
      
      if (sucesso) {
        console.log(`✅ Notificação de rejeição enviada para: ${usuario.email}`);
      } else {
        console.error(`❌ Falha ao enviar notificação de rejeição para: ${usuario.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar usuário sobre rejeição:', error);
      return false;
    }
  }

  /**
   * SOLUÇÃO DEFINITIVA: Encontra APENAS os gestores responsáveis por um espaço
   * REGRA CLARA: Administradores NÃO recebem notificações como gestores
   */
  static findGestoresDoEspaco(espacoId: number, usuarios: Usuario[]): Usuario[] {
    // IMPORTANTE: Filtrar APENAS gestores (tipo === 'gestor')
    // Administradores têm poder de aprovar tudo, mas NÃO devem receber emails
    const gestores = usuarios.filter(usuario => 
      usuario.tipo === 'gestor' && // APENAS gestores
      usuario.ativo === true && // APENAS ativos
      usuario.espacos?.includes(espacoId) // APENAS do espaço específico
    );

    console.log(`🔍 Buscando gestores para espaço ${espacoId}:`);
    console.log(`   - Total de usuários no sistema: ${usuarios.length}`);
    console.log(`   - Gestores encontrados: ${gestores.length}`);
    
    if (gestores.length > 0) {
      gestores.forEach(g => {
        console.log(`   ✅ ${g.nome} (${g.email}) - Gestor do espaço ${espacoId}`);
      });
    } else {
      console.log(`   ⚠️ NENHUM gestor encontrado para o espaço ${espacoId}`);
      
      // Listar admins para informação (mas NÃO incluí-los)
      const admins = usuarios.filter(u => u.tipo === 'admin');
      if (admins.length > 0) {
        console.log(`   ℹ️ Admins no sistema (NÃO receberão notificação):`);
        admins.forEach(a => {
          console.log(`      - ${a.nome} (${a.email})`);
        });
      }
    }

    return gestores;
  }

  /**
   * Notifica todos os gestores de um espaço sobre nova solicitação
   * NÃO notifica administradores
   */
  static async notificarTodosGestores(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    usuarios: Usuario[]
  ): Promise<boolean> {
    console.log('\n📧 INICIANDO PROCESSO DE NOTIFICAÇÃO');
    console.log(`   Espaço: ${espaco.nome} (ID: ${agendamento.espacoId})`);
    console.log(`   Solicitante: ${usuario.nome} (${usuario.email})`);
    
    // Usar a função definitiva que exclui admins
    const gestores = this.findGestoresDoEspaco(agendamento.espacoId, usuarios);
    
    if (gestores.length === 0) {
      console.warn(`⚠️ ATENÇÃO: Nenhum gestor encontrado para o espaço "${espaco.nome}"`);
      console.log(`💡 SOLUÇÃO: Execute o script 'analise_usuarios_espacos.sql' no Supabase para verificar`);
      console.log(`            e atribuir gestores aos espaços sem responsáveis.`);
      return false;
    }

    console.log(`\n📨 Enviando notificações para ${gestores.length} gestor(es)...`);
    
    const resultados = await Promise.all(
      gestores.map(gestor => 
        this.notificarGestorNovaSolicitacao(agendamento, usuario, espaco, gestor)
      )
    );

    const sucessos = resultados.filter(Boolean).length;
    const falhas = resultados.length - sucessos;

    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   ✅ Sucesso: ${sucessos} notificação(ões)`);
    if (falhas > 0) {
      console.log(`   ❌ Falhas: ${falhas} notificação(ões)`);
    }
    console.log(`   📍 Espaço: ${espaco.nome}`);
    console.log('   ✨ Processo concluído\n');
    
    return sucessos > 0; // Retorna true se pelo menos uma notificação foi enviada
  }

  /**
   * Testa a conectividade do serviço de email
   */
  static async testarConexao(): Promise<boolean> {
    return await emailService.verifyConnection();
  }
} 