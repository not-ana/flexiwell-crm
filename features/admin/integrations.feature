# language: pt
@admin @integrations
Funcionalidade: Gerenciamento de Integrações
  Como um Admin/Owner do studio
  Eu quero gerenciar as integrações com serviços externos
  Para automatizar processos e melhorar a comunicação

  Contexto:
    Dado que estou logado como admin
    E as seguintes integrações estão disponíveis:
      | integracao        | status      | descricao                           |
      | Stripe            | connected   | Processamento de pagamentos         |
      | WhatsApp Business | connected   | Mensagens automatizadas via Twilio  |
      | Instagram         | disconnected| Mensagens diretas do Instagram      |
      | Google Calendar   | disconnected| Sincronização de agenda             |
      | Resend            | connected   | Envio de emails transacionais       |

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar lista de integrações disponíveis
    Quando eu acesso a página de integrações
    Então eu devo ver a lista de todas as integrações disponíveis
    E cada integração deve exibir:
      | campo           |
      | Nome            |
      | Descrição       |
      | Status          |
      | Última sync     |
      | Ações           |

  @sucesso @visualizacao
  Cenário: Visualizar detalhes de integração conectada
    Quando eu clico na integração "Stripe"
    Então eu devo ver os detalhes:
      | campo                 | valor                    |
      | Status                | Conectado                |
      | Conta                 | studio@email.com         |
      | Conectado em          | 01/01/2024               |
      | Última transação      | Há 2 horas               |
      | Transações no mês     | 45                       |

  # ==========================================
  # CENÁRIOS DE SUCESSO - STRIPE
  # ==========================================

  @sucesso @stripe
  Cenário: Conectar conta Stripe
    Dado que o Stripe não está conectado
    Quando eu clico em "Conectar" no Stripe
    Então eu devo ser redirecionado para o OAuth do Stripe
    E após autorizar, devo retornar ao FlexiWell
    E o status deve mudar para "Conectado"

  @sucesso @stripe
  Cenário: Configurar Stripe para cobranças automáticas
    Dado que o Stripe está conectado
    Quando eu acesso as configurações do Stripe
    E eu ativo "Cobranças Recorrentes Automáticas"
    E eu defino o dia de cobrança como 5
    E eu clico em "Salvar"
    Então as configurações devem ser salvas
    E as cobranças devem ocorrer automaticamente no dia 5

  @sucesso @stripe
  Cenário: Desconectar conta Stripe
    Quando eu clico em "Desconectar" no Stripe
    E eu confirmo a desconexão
    Então o Stripe deve ser desconectado
    E as cobranças automáticas devem ser desativadas
    E eu devo ver aviso sobre impacto nos pagamentos

  # ==========================================
  # CENÁRIOS DE SUCESSO - WHATSAPP
  # ==========================================

  @sucesso @whatsapp
  Cenário: Conectar WhatsApp Business via Twilio
    Dado que o WhatsApp não está conectado
    Quando eu clico em "Conectar" no WhatsApp Business
    E eu preencho as credenciais:
      | campo          | valor                    |
      | Account SID    | ACXXXXXXXXXXXXXXXX       |
      | Auth Token     | token_secreto            |
      | Phone Number   | +5511999999999           |
    E eu clico em "Conectar"
    Então a conexão deve ser testada
    E o status deve mudar para "Conectado"

  @sucesso @whatsapp
  Cenário: Configurar mensagens automáticas do WhatsApp
    Dado que o WhatsApp está conectado
    Quando eu acesso "Mensagens Automáticas"
    E eu configuro:
      | evento                    | mensagem                                    |
      | Confirmação de aula       | Olá {nome}, sua aula está confirmada!       |
      | Lembrete de aula          | Lembrete: sua aula é amanhã às {horario}    |
      | Lembrete de pagamento     | Seu pagamento vence em {dias} dias          |
    E eu clico em "Salvar"
    Então as mensagens automáticas devem ser configuradas

  @sucesso @whatsapp
  Cenário: Enviar mensagem de teste
    Dado que o WhatsApp está conectado
    Quando eu clico em "Enviar Mensagem de Teste"
    E eu insiro meu número
    E eu clico em "Enviar"
    Então eu devo receber a mensagem no meu WhatsApp
    E eu devo ver "Mensagem enviada com sucesso!"

  # ==========================================
  # CENÁRIOS DE SUCESSO - INSTAGRAM
  # ==========================================

  @sucesso @instagram
  Cenário: Conectar Instagram Business
    Quando eu clico em "Conectar" no Instagram
    Então eu devo ser redirecionado para autenticação do Facebook/Instagram
    E após autorizar, devo retornar ao FlexiWell
    E o status deve mudar para "Conectado"

  @sucesso @instagram
  Cenário: Configurar respostas automáticas do Instagram
    Dado que o Instagram está conectado
    Quando eu acesso as configurações
    E eu configuro resposta automática:
      | trigger                | resposta                                    |
      | horário                | Olá! Nossos horários são: Segunda a Sexta...|
      | preço                  | Nossos planos começam em R$199...           |
      | agendar                | Para agendar, acesse nosso site: link       |
    E eu clico em "Salvar"
    Então as respostas automáticas devem funcionar

  # ==========================================
  # CENÁRIOS DE SUCESSO - GOOGLE CALENDAR
  # ==========================================

  @sucesso @calendar
  Cenário: Conectar Google Calendar
    Quando eu clico em "Conectar" no Google Calendar
    E eu autorizo o acesso via Google OAuth
    Então a conexão deve ser estabelecida
    E eu devo escolher qual calendário sincronizar

  @sucesso @calendar
  Cenário: Sincronizar aulas com Google Calendar
    Dado que o Google Calendar está conectado
    Quando eu ativo "Sincronizar Aulas"
    E eu seleciono "Criar eventos no calendário"
    E eu clico em "Salvar"
    Então as aulas devem aparecer no Google Calendar dos instrutores
    E alterações devem ser sincronizadas bidirecionalmente

  # ==========================================
  # CENÁRIOS DE SUCESSO - EMAIL (RESEND)
  # ==========================================

  @sucesso @email
  Cenário: Configurar Resend para emails
    Dado que o Resend não está conectado
    Quando eu clico em "Conectar" no Resend
    E eu insiro a API Key do Resend
    E eu configuro o domínio de envio "studio@meudominio.com"
    E eu clico em "Conectar"
    Então a conexão deve ser estabelecida
    E um email de teste deve ser enviado

  @sucesso @email
  Cenário: Personalizar templates de email
    Dado que o Resend está conectado
    Quando eu acesso "Templates de Email"
    E eu edito o template "Boas-vindas"
    E eu personalizo com a logo e cores do studio
    E eu clico em "Salvar"
    Então o template personalizado deve ser usado nos envios

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @stripe
  Cenário: Falha na conexão com Stripe
    Quando eu tento conectar o Stripe
    E ocorre um erro de autenticação
    Então eu devo ver a mensagem "Falha ao conectar com o Stripe"
    E eu devo ver instruções para resolver o problema

  @erro @whatsapp
  Cenário: Credenciais inválidas do Twilio
    Quando eu tento conectar o WhatsApp com credenciais inválidas
    Então eu devo ver a mensagem "Credenciais inválidas. Verifique o Account SID e Auth Token"

  @erro @whatsapp
  Cenário: Número de telefone não verificado
    Quando eu tento conectar com um número não verificado no Twilio
    Então eu devo ver a mensagem "Número de telefone não está verificado no Twilio"
    E eu devo ver link para verificar o número

  @erro @instagram
  Cenário: Conta Instagram não é Business
    Quando eu tento conectar uma conta pessoal do Instagram
    Então eu devo ver a mensagem "É necessário uma conta Instagram Business"
    E eu devo ver instruções para converter a conta

  @erro @email
  Cenário: Domínio de email não verificado
    Quando eu configuro um domínio de email não verificado
    Então eu devo ver a mensagem "Domínio não verificado no Resend"
    E eu devo ver instruções de configuração DNS

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Reconectar integração expirada
    Dado que o token do Google Calendar expirou
    Quando eu acesso a página de integrações
    Então eu devo ver o status "Requer Reautenticação"
    E eu devo ter opção de reconectar

  @edge-case
  Cenário: Limite de mensagens WhatsApp atingido
    Dado que atingi o limite mensal de mensagens do Twilio
    Quando eu tento enviar mais mensagens
    Então eu devo ver aviso de limite atingido
    E eu devo ter opção de upgrade do plano Twilio

  @edge-case
  Cenário: Webhook do Stripe com retry
    Dado que um webhook do Stripe falhou
    Quando o Stripe reenvia o webhook
    Então o sistema deve processar corretamente
    E não deve duplicar transações

  @edge-case
  Cenário: Sincronização de calendário com conflitos
    Dado que há conflitos entre FlexiWell e Google Calendar
    Quando a sincronização é executada
    Então o sistema deve detectar os conflitos
    E eu devo ser notificado para resolver manualmente

  @edge-case
  Cenário: Taxa de entrega de emails baixa
    Dado que a taxa de entrega de emails caiu para 60%
    Quando eu acesso as métricas do Resend
    Então eu devo ver alerta sobre taxa de entrega
    E eu devo ver sugestões para melhorar

  @edge-case
  Cenário: Múltiplas contas Stripe
    Dado que quero usar contas Stripe diferentes por estabelecimento
    Quando eu configuro as integrações
    Então cada estabelecimento pode ter sua própria conta Stripe
    E os pagamentos são direcionados corretamente

  @edge-case
  Cenário: Backup de configurações de integração
    Quando eu clico em "Exportar Configurações"
    Então as configurações de todas as integrações devem ser exportadas sem incluir tokens ou credenciais sensíveis

  @edge-case
  Cenário: Logs de integração para debugging
    Quando eu acesso "Logs" de uma integração
    Então eu devo ver os últimos eventos:
      | timestamp   | tipo    | status  | detalhes           |
      | 10:30:00    | webhook | success | payment.completed  |
      | 10:25:00    | api     | error   | rate_limit_exceeded|
    E eu posso filtrar e buscar nos logs
