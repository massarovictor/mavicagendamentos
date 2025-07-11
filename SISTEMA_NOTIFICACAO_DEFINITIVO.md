# Sistema de Notificação por Email - Solução Definitiva

## 📋 Visão Geral

Sistema simples de notificação por email para o Easy Arrange App que:
- **Notifica APENAS gestores** sobre novas solicitações de agendamento
- **Administradores NÃO recebem emails** (evita spam, mas podem aprovar tudo)
- **Usuários recebem confirmação** quando seu agendamento é aprovado/rejeitado

## 🎯 Regras de Negócio Claras

### 1. Tipos de Usuário e Suas Funções

| Tipo | Função | Recebe Email? | Pode Aprovar? |
|------|--------|---------------|---------------|
| **Admin** | Superusuário do sistema | ❌ NÃO | ✅ TODOS os espaços |
| **Gestor** | Responsável por espaços específicos | ✅ SIM | ✅ Apenas SEUS espaços |
| **Usuário** | Solicita agendamentos | ✅ Apenas confirmações | ❌ NÃO |

### 2. Fluxo de Notificações

```
1. Usuário solicita agendamento
   └─> Email enviado para: Gestor(es) do espaço específico
   
2. Gestor/Admin aprova ou rejeita
   └─> Email enviado para: Usuário solicitante
```

## 🚀 Como Configurar

### 1. Configurar Gestores no Banco de Dados

Execute o script `configurar_gestores_definitivo.sql` no Supabase:

```sql
-- Exemplo: Criar gestor para o Auditório
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos, senha) 
VALUES (
    gen_random_uuid(), 
    'Maria Silva - Gestor Auditório', 
    'maria.silva@escola.com', 
    'gestor', 
    true, 
    ARRAY[1], -- ID do espaço
    '123456'
);
```

### 2. Configurar Servidor de Email

1. Configure as variáveis no arquivo `.env`:
```env
VITE_SMTP_SERVER=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USERNAME=seu-email@gmail.com
VITE_SMTP_PASSWORD=sua-senha-de-app
VITE_FROM_EMAIL=seu-email@gmail.com
```

2. Inicie o servidor de email:
```bash
npm run email-server
```

3. Inicie a aplicação:
```bash
npm run dev
```

## 🧪 Como Testar

### 1. Verificar Configuração
Acesse: `http://localhost:8081/teste-notificacao-completo`

Esta página mostra:
- Quais espaços têm gestores
- Quais gestores receberão notificações
- Status do sistema de email

### 2. Testar Envio de Email
1. Clique em "Testar" ao lado de qualquer espaço
2. Verifique o console para logs detalhados
3. Verifique a caixa de entrada do gestor

## 🔍 Diagnóstico de Problemas

### Problema: "Nenhum gestor encontrado"
**Solução**: Execute `analise_usuarios_espacos.sql` para verificar e depois `configurar_gestores_definitivo.sql` para corrigir.

### Problema: "Email não chega"
**Verificar**:
1. Servidor de email está rodando? (`npm run email-server`)
2. Credenciais corretas no `.env`?
3. Usar senha de app do Gmail (não a senha normal)

### Problema: "Admin está recebendo emails"
**Solução**: Execute no Supabase:
```sql
UPDATE usuarios SET espacos = NULL WHERE tipo = 'admin';
```

## 📁 Arquivos Importantes

- **`src/lib/notificationService.ts`** - Lógica de notificações (exclui admins)
- **`server.js`** - Servidor de email com nodemailer
- **`configurar_gestores_definitivo.sql`** - Script para configurar gestores
- **`analise_usuarios_espacos.sql`** - Script para diagnosticar problemas

## ✅ Checklist de Implementação

- [ ] Executar `configurar_gestores_definitivo.sql` no Supabase
- [ ] Configurar variáveis de ambiente (`.env`)
- [ ] Iniciar servidor de email (`npm run email-server`)
- [ ] Testar em `/teste-notificacao-completo`
- [ ] Verificar que admins NÃO recebem emails
- [ ] Verificar que gestores SÓ recebem emails dos seus espaços

## 💡 Dicas

1. **Um gestor por espaço** é mais simples e evita spam
2. **Admins não precisam de notificação** - eles veem tudo no painel
3. **Use emails reais** dos gestores para produção
4. **Teste sempre** após mudanças no banco de dados 