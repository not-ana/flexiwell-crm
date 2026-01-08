# language: pt
@admin @payments
Funcionalidade: Gerenciamento de Pagamentos
  Como um Admin/Owner do studio
  Eu quero gerenciar os pagamentos dos clientes
  Para ter controle financeiro do meu negócio

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes pagamentos registrados:
      | cliente       | valor     | data       | status    | metodo         | plano      |
      | Ana Souza     | R$199,00  | 2024-01-05 | paid      | credit_card    | Mensal     |
      | Bruno Costa   | R$549,00  | 2024-01-03 | paid      | pix            | Trimestral |
      | Carla Lima    | R$45,00   | 2024-01-10 | pending   | boleto         | Avulso     |
      | Diego Santos  | R$199,00  | 2024-01-01 | overdue   | credit_card    | Mensal     |
      | Elena Rocha   | R$1999,00 | 2024-01-08 | refunded  | credit_card    | Anual      |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de pagamentos
    Quando eu acesso a página de pagamentos
    Então eu devo ver a lista de todos os pagamentos
    E cada pagamento deve exibir:
      | campo        |
      | Cliente      |
      | Valor        |
      | Data         |
      | Status       |
      | Método       |
      | Plano        |
      | Ações        |

  @sucesso @listagem
  Cenário: Filtrar pagamentos por status
    Quando eu seleciono o filtro "Status" com valor "Pendente"
    Então eu devo ver apenas os pagamentos pendentes
    E "Carla Lima" deve estar na lista

  @sucesso @listagem
  Cenário: Filtrar pagamentos por período
    Quando eu seleciono o filtro "Período" de "01/01/2024" até "10/01/2024"
    Então eu devo ver apenas os pagamentos do período selecionado

  @sucesso @listagem
  Cenário: Filtrar pagamentos por método
    Quando eu seleciono o filtro "Método" com valor "PIX"
    Então eu devo ver apenas os pagamentos via PIX
    E "Bruno Costa" deve estar na lista

  @sucesso @listagem
  Cenário: Buscar pagamento por cliente
    Quando eu digito "Ana" no campo de busca
    Então eu devo ver apenas os pagamentos de "Ana Souza"

  # ==========================================
  # CENÁRIOS DE SUCESSO - REGISTRO
  # ==========================================

  @sucesso @registro
  Cenário: Registrar pagamento manual
    Quando eu clico no botão "Novo Pagamento"
    E eu preencho os seguintes dados:
      | campo       | valor          |
      | cliente     | Carla Lima     |
      | valor       | R$199,00       |
      | metodo      | Dinheiro       |
      | plano       | Mensal         |
      | referencia  | Janeiro/2024   |
    E eu clico no botão "Registrar"
    Então eu devo ver a mensagem "Pagamento registrado com sucesso!"
    E as aulas do plano devem ser creditadas ao cliente

  @sucesso @registro
  Cenário: Registrar pagamento parcial
    Quando eu registro um pagamento de R$100,00 para uma fatura de R$199,00
    E eu marco como "Pagamento Parcial"
    E eu clico no botão "Registrar"
    Então o pagamento deve ser registrado
    E um saldo devedor de R$99,00 deve ficar pendente

  @sucesso @registro
  Cenário: Aplicar desconto no pagamento
    Quando eu registro um novo pagamento
    E eu aplico um desconto de 10%
    E eu preencho o motivo "Desconto fidelidade"
    E eu clico no botão "Registrar"
    Então o valor final deve refletir o desconto aplicado
    E o desconto deve ser registrado no histórico

  # ==========================================
  # CENÁRIOS DE SUCESSO - AÇÕES
  # ==========================================

  @sucesso @acoes
  Cenário: Marcar pagamento como pago
    Quando eu clico na fatura pendente de "Carla Lima"
    E eu clico em "Marcar como Pago"
    E eu seleciono o método "PIX"
    E eu confirmo
    Então o status deve mudar para "Pago"
    E as aulas devem ser creditadas ao cliente

  @sucesso @acoes
  Cenário: Enviar lembrete de pagamento
    Quando eu clico em "Enviar Lembrete" para "Carla Lima"
    Então um lembrete deve ser enviado via:
      | canal       |
      | WhatsApp    |
      | Email       |
    E eu devo ver a mensagem "Lembrete enviado com sucesso!"

  @sucesso @acoes
  Cenário: Gerar segunda via de boleto
    Dado que o pagamento de "Carla Lima" é via boleto
    Quando eu clico em "Gerar Segunda Via"
    Então um novo boleto deve ser gerado
    E deve ser enviado para o email do cliente

  @sucesso @acoes
  Cenário: Processar estorno/reembolso
    Quando eu clico no pagamento de "Ana Souza"
    E eu clico em "Processar Estorno"
    E eu seleciono o motivo "Solicitação do cliente"
    E eu escolho "Estorno total"
    E eu confirmo
    Então o status deve mudar para "Estornado"
    E o cliente deve ser notificado
    E as aulas creditadas devem ser removidas

  @sucesso @acoes
  Cenário: Processar estorno parcial
    Quando eu processo um estorno parcial de R$50,00 no pagamento de "Bruno Costa"
    E eu seleciono o motivo "Crédito não utilizado"
    E eu confirmo
    Então R$50,00 devem ser estornados
    E o histórico deve registrar o estorno parcial

  # ==========================================
  # CENÁRIOS DE SUCESSO - RECORRÊNCIA
  # ==========================================

  @sucesso @recorrencia
  Cenário: Configurar cobrança recorrente
    Quando eu acesso o perfil de "Ana Souza"
    E eu clico em "Configurar Cobrança Automática"
    E eu seleciono:
      | campo           | valor                    |
      | plano           | Mensal                   |
      | dia_cobranca    | 5                        |
      | metodo          | Cartão de crédito        |
    E eu clico em "Ativar"
    Então a cobrança recorrente deve ser configurada
    E o cliente deve ser cobrado automaticamente todo dia 5

  @sucesso @recorrencia
  Cenário: Cancelar cobrança recorrente
    Dado que "Ana Souza" tem cobrança recorrente ativa
    Quando eu cancelo a cobrança recorrente
    E eu seleciono o motivo "Solicitação do cliente"
    E eu confirmo
    Então a recorrência deve ser cancelada
    E o cliente deve ser notificado

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS
  # ==========================================

  @sucesso @relatorios
  Cenário: Visualizar resumo financeiro
    Quando eu acesso a página de pagamentos
    Então eu devo ver o resumo:
      | metrica              | valor       |
      | Receita do mês       | R$15.000,00 |
      | Pagamentos pendentes | R$2.500,00  |
      | Em atraso            | R$800,00    |
      | Estornos             | R$199,00    |

  @sucesso @relatorios
  Cenário: Exportar relatório de pagamentos
    Quando eu clico em "Exportar Relatório"
    E eu seleciono o período "Janeiro/2024"
    E eu seleciono o formato "Excel"
    E eu clico em "Exportar"
    Então o arquivo deve ser gerado e baixado com todos os pagamentos do período

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @registro
  Cenário: Registrar pagamento sem cliente selecionado
    Quando eu tento registrar um pagamento sem selecionar cliente
    Então eu devo ver a mensagem de erro "Selecione um cliente"

  @erro @registro
  Cenário: Registrar pagamento com valor zerado
    Quando eu tento registrar um pagamento com valor R$0,00
    Então eu devo ver a mensagem de erro "O valor deve ser maior que zero"

  @erro @acoes
  Cenário: Estorno de pagamento já estornado
    Dado que o pagamento de "Elena Rocha" já foi estornado
    Quando eu tento processar outro estorno
    Então eu devo ver a mensagem de erro "Este pagamento já foi estornado"

  @erro @acoes
  Cenário: Estorno após prazo limite
    Dado que o pagamento tem mais de 120 dias
    Quando eu tento processar estorno
    Então eu devo ver a mensagem de erro "Prazo para estorno expirado (máximo 120 dias)"

  @erro @recorrencia
  Cenário: Cartão recusado na cobrança recorrente
    Dado que a cobrança recorrente de "Ana Souza" foi recusada
    Quando o sistema tenta cobrar novamente
    Então após 3 tentativas falhas, o admin deve ser notificado
    E o cliente deve receber aviso de pendência

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Pagamento com múltiplos métodos
    Quando eu registro um pagamento
    E eu seleciono "Pagamento dividido"
    E eu defino:
      | metodo         | valor    |
      | PIX            | R$100,00 |
      | Cartão Crédito | R$99,00  |
    E eu clico em "Registrar"
    Então o pagamento deve ser registrado com ambos os métodos

  @edge-case
  Cenário: Pagamento antecipado com desconto
    Quando um cliente paga 3 meses antecipadamente
    E o sistema oferece 10% de desconto automático
    Então o valor final deve ter desconto aplicado
    E as 3 mensalidades devem ser creditadas

  @edge-case
  Cenário: Conversão de moeda (clientes internacionais)
    Dado que o cliente está pagando em dólares
    Quando o pagamento é processado
    Então o sistema deve converter para reais
    E registrar a taxa de câmbio utilizada

  @edge-case
  Cenário: Pagamento em atraso com multa e juros
    Dado que o pagamento de "Diego Santos" está 10 dias atrasado
    Quando eu acesso o pagamento
    Então devo ver o cálculo de:
      | item          | valor    |
      | Valor original| R$199,00 |
      | Multa (2%)    | R$3,98   |
      | Juros (1%/mês)| R$0,66   |
      | Total         | R$203,64 |

  @edge-case
  Cenário: Disputa/chargeback no cartão
    Dado que o cliente abriu disputa no pagamento
    Quando o banco notifica via webhook
    Então o pagamento deve ser marcado como "Em Disputa"
    E o admin deve ser alertado imediatamente
    E as aulas do cliente devem ser bloqueadas

  @edge-case
  Cenário: Pagamento de cliente inativo
    Dado que "Diego Santos" está inativo
    Quando eu registro um pagamento para ele
    Então o sistema deve perguntar se desejo reativar o cliente
    E se confirmado, o status deve mudar para ativo

  @edge-case
  Cenário: Conciliação bancária
    Quando eu acesso "Conciliação Bancária"
    E eu faço upload do extrato do banco
    Então o sistema deve identificar os pagamentos correspondentes
    E sinalizar pagamentos não conciliados

  @edge-case
  Cenário: Fatura de pacote familiar
    Dado que a família Silva tem 3 membros com planos
    Quando eu gero uma fatura única para a família
    Então todos os planos devem estar na mesma fatura
    E um desconto familiar pode ser aplicado
