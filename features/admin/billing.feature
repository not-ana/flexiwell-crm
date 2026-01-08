# language: pt
@admin @billing
Funcionalidade: Gerenciamento de Assinatura do Studio (Billing)
  Como um Admin/Owner do studio
  Eu quero gerenciar a assinatura do meu studio na plataforma FlexiWell
  Para manter meu acesso aos recursos do sistema

  Contexto:
    Dado que estou logado como admin
    E meu studio possui a seguinte assinatura:
      | plano       | valor     | status | periodo          | clientes_ativos |
      | Professional| R$299/mês | active | 01/01 - 31/01    | 150             |
    E os planos disponíveis são:
      | plano        | valor     | clientes_max | recursos                          |
      | Starter      | R$99/mês  | 50           | Básico                            |
      | Professional | R$299/mês | 200          | Integrações, Relatórios           |
      | Enterprise   | R$599/mês | Ilimitado    | Todos os recursos, Suporte Premium|

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar detalhes da assinatura atual
    Quando eu acesso a página de billing
    Então eu devo ver os detalhes da assinatura:
      | campo                | valor            |
      | Plano atual          | Professional     |
      | Valor mensal         | R$299,00         |
      | Status               | Ativo            |
      | Próximo vencimento   | 01/02/2024       |
      | Clientes ativos      | 150/200          |

  @sucesso @visualizacao
  Cenário: Visualizar histórico de faturas
    Quando eu acesso a aba "Histórico de Faturas"
    Então eu devo ver a lista de faturas anteriores
    E cada fatura deve exibir:
      | campo       |
      | Período     |
      | Valor       |
      | Status      |
      | Download    |

  @sucesso @visualizacao
  Cenário: Baixar fatura/nota fiscal
    Quando eu clico em "Download" na fatura de Janeiro/2024
    Então o arquivo PDF deve ser baixado com os dados fiscais completos

  # ==========================================
  # CENÁRIOS DE SUCESSO - UPGRADE
  # ==========================================

  @sucesso @upgrade
  Cenário: Fazer upgrade de plano
    Quando eu clico em "Alterar Plano"
    E eu seleciono o plano "Enterprise"
    Então eu devo ver a prévia:
      | item                        | valor    |
      | Novo valor mensal           | R$599,00 |
      | Valor proporcional do ciclo | R$150,00 |
      | Recursos adicionais         | Listados |
    Quando eu confirmo o upgrade
    E eu autorizo o pagamento da diferença
    Então o plano deve ser atualizado imediatamente
    E os novos recursos devem estar disponíveis

  @sucesso @upgrade
  Cenário: Visualizar comparativo de planos
    Quando eu clico em "Comparar Planos"
    Então eu devo ver uma tabela comparativa com:
      | recurso                 | Starter | Professional | Enterprise |
      | Clientes               | 50      | 200          | Ilimitado  |
      | Integrações            | 1       | 5            | Ilimitado  |
      | Relatórios avançados   | Não     | Sim          | Sim        |
      | Suporte prioritário    | Não     | Não          | Sim        |
      | WhatsApp Business      | Não     | Sim          | Sim        |
      | Multi-estabelecimento  | Não     | Não          | Sim        |

  # ==========================================
  # CENÁRIOS DE SUCESSO - DOWNGRADE
  # ==========================================

  @sucesso @downgrade
  Cenário: Fazer downgrade de plano
    Quando eu clico em "Alterar Plano"
    E eu seleciono o plano "Starter"
    Então eu devo ver o aviso de limitações:
      | limitacao                                      |
      | Máximo de 50 clientes (você tem 150)          |
      | Integrações limitadas a 1                      |
      | Relatórios avançados não disponíveis          |
    E eu devo ver a mensagem "O downgrade será aplicado no próximo ciclo"

  @sucesso @downgrade
  Cenário: Confirmar downgrade com ajustes necessários
    Dado que quero fazer downgrade para Starter
    E tenho 150 clientes (acima do limite de 50)
    Quando eu tento confirmar o downgrade
    Então eu devo ver "Você precisa reduzir para 50 clientes antes do downgrade"
    E eu devo ver opções para gerenciar clientes

  # ==========================================
  # CENÁRIOS DE SUCESSO - PAGAMENTO
  # ==========================================

  @sucesso @pagamento
  Cenário: Atualizar método de pagamento
    Quando eu acesso "Formas de Pagamento"
    E eu clico em "Adicionar Cartão"
    E eu preencho os dados do novo cartão
    E eu clico em "Salvar"
    Então o novo cartão deve ser salvo
    E eu posso defini-lo como método principal

  @sucesso @pagamento
  Cenário: Alterar cartão principal
    Dado que tenho 2 cartões cadastrados
    Quando eu seleciono o segundo cartão como principal
    E eu confirmo
    Então as próximas cobranças devem usar o novo cartão

  @sucesso @pagamento
  Cenário: Pagar fatura pendente
    Dado que existe uma fatura pendente
    Quando eu clico em "Pagar Agora"
    E eu confirmo o pagamento
    Então a fatura deve ser paga
    E meu acesso deve ser normalizado

  # ==========================================
  # CENÁRIOS DE SUCESSO - ADD-ONS
  # ==========================================

  @sucesso @addons
  Cenário: Adicionar módulo extra (add-on)
    Quando eu acesso "Add-ons"
    E eu seleciono "WhatsApp Business Extra"
    E eu clico em "Adicionar"
    Então o valor proporcional deve ser cobrado
    E o add-on deve estar disponível imediatamente

  @sucesso @addons
  Cenário: Remover add-on
    Dado que tenho o add-on "Relatórios Personalizados" ativo
    Quando eu clico em "Remover" no add-on
    E eu confirmo
    Então o add-on será removido no próximo ciclo
    E o valor não será mais cobrado

  # ==========================================
  # CENÁRIOS DE SUCESSO - CANCELAMENTO
  # ==========================================

  @sucesso @cancelamento
  Cenário: Cancelar assinatura
    Quando eu acesso "Cancelar Assinatura"
    Então eu devo ver:
      | informacao                              |
      | Sua assinatura fica ativa até 31/01     |
      | Você perderá acesso em 01/02            |
      | Seus dados serão mantidos por 30 dias   |
    Quando eu seleciono o motivo do cancelamento
    E eu confirmo o cancelamento
    Então a assinatura deve ser marcada para cancelamento
    E eu devo receber email de confirmação

  @sucesso @cancelamento
  Cenário: Reativar assinatura cancelada
    Dado que minha assinatura foi cancelada
    E ainda estou no período de graça
    Quando eu clico em "Reativar Assinatura"
    E eu confirmo
    Então a assinatura deve ser reativada
    E uma nova cobrança deve ser processada

  # ==========================================
  # CENÁRIOS DE SUCESSO - TRIAL
  # ==========================================

  @sucesso @trial
  Cenário: Período de trial ativo
    Dado que estou no período de trial de 14 dias
    Quando eu acesso a página de billing
    Então eu devo ver "Trial: 7 dias restantes"
    E eu devo ver opção de "Ativar Plano Agora"

  @sucesso @trial
  Cenário: Converter trial para plano pago
    Dado que estou no período de trial
    Quando eu clico em "Escolher Plano"
    E eu seleciono "Professional"
    E eu cadastro meu cartão de crédito
    E eu confirmo
    Então o trial deve ser convertido em assinatura paga
    E a cobrança deve começar após o fim do trial

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @pagamento
  Cenário: Cartão recusado na cobrança
    Dado que a cobrança mensal foi recusada
    Quando eu acesso a página de billing
    Então eu devo ver o alerta "Pagamento recusado"
    E eu devo ter opção de tentar novamente ou usar outro cartão

  @erro @pagamento
  Cenário: Tentativas múltiplas de cobrança falha
    Dado que a cobrança falhou 3 vezes consecutivas
    Quando eu acesso o sistema
    Então eu devo ver um banner de alerta
    E algumas funcionalidades podem estar limitadas

  @erro @upgrade
  Cenário: Upgrade sem cartão válido
    Quando eu tento fazer upgrade sem cartão cadastrado
    Então eu devo ver a mensagem "Cadastre um método de pagamento primeiro"

  @erro @cancelamento
  Cenário: Cancelar durante período contratual
    Dado que minha assinatura é anual com compromisso
    Quando eu tento cancelar antes do fim do período
    Então eu devo ver o valor da multa de cancelamento antecipado
    E eu devo confirmar se desejo prosseguir

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Assinatura suspensa por inadimplência
    Dado que meu pagamento está 15 dias atrasado
    Quando eu acesso o sistema
    Então eu devo ver modo de "Acesso Limitado"
    E eu só posso acessar a página de billing
    E eu devo regularizar para recuperar acesso total

  @edge-case
  Cenário: Cupom de desconto na assinatura
    Quando eu acesso "Aplicar Cupom"
    E eu insiro o código "FLEXIWELL20"
    E o cupom é válido
    Então 20% de desconto deve ser aplicado por 3 meses conforme regras do cupom

  @edge-case
  Cenário: Migração de plano legado
    Dado que estou em um plano que não existe mais
    Quando eu acesso billing
    Então eu devo ver opção de migrar para planos atuais com benefício de manter condições especiais

  @edge-case
  Cenário: Limite de clientes prestes a ser atingido
    Dado que estou com 195/200 clientes no plano Professional
    Quando eu acesso o dashboard
    Então eu devo ver um alerta "Você está próximo do limite de clientes"
    E uma sugestão de upgrade deve ser exibida

  @edge-case
  Cenário: Cobrança proporcional em upgrade mid-cycle
    Dado que estou no dia 15 do ciclo de cobrança
    Quando eu faço upgrade de Starter (R$99) para Professional (R$299)
    Então o valor proporcional deve ser calculado:
      | item                              | valor   |
      | Crédito restante Starter          | -R$49,50|
      | Proporcional Professional (15 dias)| R$149,50|
      | Total a pagar agora               | R$100,00|

  @edge-case
  Cenário: Dados fiscais para nota fiscal
    Quando eu acesso "Dados Fiscais"
    E eu preencho CNPJ, razão social e endereço
    E eu clico em "Salvar"
    Então as próximas notas fiscais devem usar esses dados

  @edge-case
  Cenário: Assinatura em moeda estrangeira
    Dado que sou um studio internacional
    Quando eu visualizo os valores
    Então os preços devem ser exibidos em USD
    E a conversão deve ser feita no momento do pagamento
