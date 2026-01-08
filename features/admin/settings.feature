# language: pt
@admin @settings
Funcionalidade: Configurações do Studio
  Como um Admin/Owner do studio
  Eu quero gerenciar as configurações do meu studio
  Para personalizar o sistema de acordo com meu negócio

  Contexto:
    Dado que estou logado como admin
    E o studio possui as seguintes configurações atuais:
      | configuracao         | valor                    |
      | nome_studio          | Wellness Studio          |
      | tipo_negocio         | Pilates                  |
      | timezone             | America/Sao_Paulo        |
      | moeda                | BRL                      |
      | idioma               | pt-BR                    |

  # ==========================================
  # CENÁRIOS DE SUCESSO - INFORMAÇÕES BÁSICAS
  # ==========================================

  @sucesso @basico
  Cenário: Editar informações básicas do studio
    Quando eu acesso "Configurações" > "Informações do Studio"
    E eu altero os seguintes dados:
      | campo       | valor                    |
      | nome        | Wellness Center          |
      | telefone    | (11) 3333-4444           |
      | email       | contato@wellness.com     |
      | site        | www.wellnesscenter.com   |
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Configurações salvas com sucesso!"

  @sucesso @basico
  Cenário: Atualizar logo do studio
    Quando eu acesso "Configurações" > "Branding"
    E eu faço upload de uma nova logo
    E eu clico em "Salvar"
    Então a nova logo deve ser aplicada em todo o sistema
    E nos emails enviados aos clientes

  @sucesso @basico
  Cenário: Configurar cores do tema
    Quando eu acesso "Configurações" > "Branding"
    E eu seleciono as cores:
      | elemento       | cor       |
      | Cor primária   | #4A90D9   |
      | Cor secundária | #2ECC71   |
      | Cor de fundo   | #FFFFFF   |
    E eu clico em "Salvar"
    Então as cores devem ser aplicadas na interface do cliente

  # ==========================================
  # CENÁRIOS DE SUCESSO - TIPO DE NEGÓCIO
  # ==========================================

  @sucesso @negocio
  Cenário: Configurar tipo de negócio
    Quando eu acesso "Configurações" > "Tipo de Negócio"
    E eu seleciono o tipo "Academia de Crossfit"
    Então a nomenclatura deve ser atualizada:
      | termo_padrao | termo_negocio |
      | Cliente      | Atleta        |
      | Instrutor    | Coach         |
      | Aula         | WOD           |

  @sucesso @negocio
  Cenário: Personalizar terminologia
    Quando eu acesso "Configurações" > "Terminologia"
    E eu personalizo:
      | campo              | valor_padrao | valor_custom |
      | label_cliente      | Cliente      | Aluno        |
      | label_instrutor    | Instrutor    | Professor    |
      | label_aula         | Aula         | Sessão       |
    E eu clico em "Salvar"
    Então toda a interface deve usar a nova terminologia

  # ==========================================
  # CENÁRIOS DE SUCESSO - HORÁRIOS E FUNCIONAMENTO
  # ==========================================

  @sucesso @horarios
  Cenário: Configurar horário de funcionamento
    Quando eu acesso "Configurações" > "Horários"
    E eu defino os horários:
      | dia       | abertura | fechamento |
      | Segunda   | 06:00    | 22:00      |
      | Terça     | 06:00    | 22:00      |
      | Quarta    | 06:00    | 22:00      |
      | Quinta    | 06:00    | 22:00      |
      | Sexta     | 06:00    | 21:00      |
      | Sábado    | 08:00    | 14:00      |
      | Domingo   | Fechado  | Fechado    |
    E eu clico em "Salvar"
    Então os horários devem ser aplicados

  @sucesso @horarios
  Cenário: Configurar feriados
    Quando eu acesso "Configurações" > "Feriados"
    E eu adiciono os feriados:
      | data       | nome              | funcionamento |
      | 25/12/2024 | Natal             | Fechado       |
      | 01/01/2025 | Ano Novo          | Fechado       |
      | 04/03/2025 | Carnaval          | 10:00-14:00   |
    E eu clico em "Salvar"
    Então os feriados devem bloquear/limitar agendamentos

  @sucesso @horarios
  Cenário: Configurar fuso horário
    Quando eu acesso "Configurações" > "Regional"
    E eu altero o fuso horário para "America/Manaus"
    E eu clico em "Salvar"
    Então todos os horários devem ser exibidos no novo fuso

  # ==========================================
  # CENÁRIOS DE SUCESSO - NOTIFICAÇÕES
  # ==========================================

  @sucesso @notificacoes
  Cenário: Configurar notificações automáticas
    Quando eu acesso "Configurações" > "Notificações"
    E eu configuro:
      | evento                      | email | whatsapp | push  |
      | Confirmação de agendamento  | Sim   | Sim      | Sim   |
      | Lembrete de aula (24h)      | Não   | Sim      | Sim   |
      | Lembrete de aula (1h)       | Não   | Sim      | Sim   |
      | Lembrete de pagamento       | Sim   | Sim      | Não   |
      | Pagamento confirmado        | Sim   | Não      | Sim   |
    E eu clico em "Salvar"
    Então as preferências de notificação devem ser salvas

  @sucesso @notificacoes
  Cenário: Personalizar templates de notificação
    Quando eu acesso "Configurações" > "Templates de Notificação"
    E eu edito o template "Lembrete de Aula"
    E eu personalizo com o texto do studio
    E eu clico em "Salvar"
    Então o template personalizado deve ser usado

  @sucesso @notificacoes
  Cenário: Configurar horário de envio de notificações
    Quando eu configuro "Não enviar notificações entre 22:00 e 07:00"
    E eu clico em "Salvar"
    Então as notificações fora do horário devem ser enfileiradas

  # ==========================================
  # CENÁRIOS DE SUCESSO - AGENDAMENTO
  # ==========================================

  @sucesso @agendamento
  Cenário: Configurar regras de agendamento
    Quando eu acesso "Configurações" > "Agendamento"
    E eu configuro:
      | regra                           | valor    |
      | Antecedência mínima             | 2 horas  |
      | Antecedência máxima             | 30 dias  |
      | Cancelamento até                | 12 horas |
      | Permitir lista de espera        | Sim      |
      | Máximo na lista de espera       | 5        |
    E eu clico em "Salvar"
    Então as regras devem ser aplicadas aos agendamentos

  @sucesso @agendamento
  Cenário: Configurar política de no-show
    Quando eu acesso "Configurações" > "Política de Presença"
    E eu configuro:
      | regra                               | valor                |
      | Marcar no-show automaticamente      | Sim                  |
      | Tempo após início da aula           | 15 minutos           |
      | Penalidade por no-show              | Debitar 1 aula       |
      | No-shows permitidos antes de bloqueio| 3                   |
    E eu clico em "Salvar"
    Então a política deve ser aplicada automaticamente

  # ==========================================
  # CENÁRIOS DE SUCESSO - PLANOS E PAGAMENTOS
  # ==========================================

  @sucesso @planos
  Cenário: Configurar planos oferecidos
    Quando eu acesso "Configurações" > "Planos"
    E eu edito o plano "Mensal":
      | campo            | valor    |
      | Nome             | Mensal   |
      | Valor            | R$199,00 |
      | Aulas por mês    | 8        |
      | Validade         | 30 dias  |
      | Permite pausar   | Sim      |
    E eu clico em "Salvar"
    Então as alterações devem ser aplicadas a novos clientes

  @sucesso @planos
  Cenário: Criar novo plano
    Quando eu clico em "Novo Plano"
    E eu preencho:
      | campo            | valor        |
      | Nome             | Ilimitado    |
      | Valor            | R$399,00     |
      | Aulas por mês    | Ilimitado    |
      | Validade         | 30 dias      |
    E eu clico em "Criar"
    Então o novo plano deve estar disponível para venda

  @sucesso @planos
  Cenário: Configurar métodos de pagamento
    Quando eu acesso "Configurações" > "Pagamentos"
    E eu ativo/desativo os métodos:
      | metodo                | status  |
      | Cartão de crédito     | Ativo   |
      | PIX                   | Ativo   |
      | Boleto                | Ativo   |
      | Dinheiro              | Ativo   |
      | Transferência         | Inativo |
    E eu clico em "Salvar"
    Então apenas os métodos ativos devem aparecer no checkout

  # ==========================================
  # CENÁRIOS DE SUCESSO - SEGURANÇA
  # ==========================================

  @sucesso @seguranca
  Cenário: Configurar política de senhas
    Quando eu acesso "Configurações" > "Segurança"
    E eu configuro:
      | regra                       | valor      |
      | Mínimo de caracteres        | 8          |
      | Exigir maiúsculas           | Sim        |
      | Exigir números              | Sim        |
      | Exigir caracteres especiais | Não        |
      | Expiração de senha          | 90 dias    |
    E eu clico em "Salvar"
    Então a política deve ser aplicada a novos usuários

  @sucesso @seguranca
  Cenário: Configurar autenticação de dois fatores
    Quando eu acesso "Configurações" > "Segurança" > "2FA"
    E eu ativo "Exigir 2FA para administradores"
    E eu clico em "Salvar"
    Então admins devem configurar 2FA no próximo login

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Salvar configuração com campo obrigatório vazio
    Quando eu acesso as configurações básicas
    E eu apago o campo "nome do studio"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem de erro "Nome do studio é obrigatório"

  @erro
  Cenário: Upload de logo em formato inválido
    Quando eu tento fazer upload de uma logo em formato .gif
    Então eu devo ver a mensagem de erro "Formato não suportado. Use PNG, JPG ou SVG."

  @erro
  Cenário: Horário de funcionamento inválido
    Quando eu configuro horário de abertura 22:00 e fechamento 06:00 sem marcar como funcionamento noturno
    Então eu devo ver a mensagem de erro "Horário de fechamento deve ser após abertura"

  @erro
  Cenário: Plano com valor negativo
    Quando eu tento salvar um plano com valor "-50"
    Então eu devo ver a mensagem de erro "Valor deve ser positivo"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Alterar configuração com agendamentos futuros
    Dado que existem aulas agendadas para domingo
    Quando eu configuro domingo como "Fechado"
    Então eu devo ver um aviso "Existem 5 aulas agendadas para domingos"
    E eu devo escolher o que fazer com as aulas existentes

  @edge-case
  Cenário: Alterar valor de plano com assinaturas ativas
    Dado que existem 50 clientes com plano "Mensal" ativo
    Quando eu altero o valor do plano de R$199 para R$249
    Então eu devo ver opções:
      | opcao                                    |
      | Aplicar apenas a novos clientes          |
      | Aplicar a todos na próxima renovação     |
      | Manter preço atual para clientes antigos |

  @edge-case
  Cenário: Desativar método de pagamento com recorrências ativas
    Dado que existem cobranças recorrentes via boleto
    Quando eu tento desativar o método "Boleto"
    Então eu devo ver "Existem 20 cobranças recorrentes usando boleto"
    E eu devo primeiro migrar essas cobranças

  @edge-case
  Cenário: Alterar fuso horário com aulas agendadas
    Dado que existem aulas agendadas nos próximos dias
    Quando eu altero o fuso horário
    Então todas as aulas devem ser ajustadas automaticamente
    E os clientes devem ser notificados se houver mudança significativa

  @edge-case
  Cenário: Backup de configurações
    Quando eu clico em "Exportar Configurações"
    Então um arquivo JSON deve ser gerado com todas as configurações do studio

  @edge-case
  Cenário: Restaurar configurações de backup
    Quando eu clico em "Importar Configurações"
    E eu seleciono um arquivo de backup válido
    E eu confirmo a importação
    Então as configurações devem ser restauradas
    E as credenciais sensíveis devem exigir reconfiguração

  @edge-case
  Cenário: Configurações por estabelecimento
    Dado que tenho múltiplos estabelecimentos
    Quando eu acesso as configurações
    Então eu devo poder configurar individualmente cada estabelecimento ou aplicar configurações globalmente

  @edge-case
  Cenário: Histórico de alterações de configuração
    Quando eu acesso "Configurações" > "Histórico"
    Então eu devo ver o log de alterações:
      | data       | usuario    | alteracao                    |
      | 15/01 10:00| Admin      | Horário de funcionamento     |
      | 14/01 15:30| Admin      | Valor do plano Mensal        |
