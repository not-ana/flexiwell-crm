# language: pt
@admin @support
Funcionalidade: Gerenciamento de Suporte
  Como um Admin/Owner do studio
  Eu quero gerenciar os tickets de suporte
  Para resolver problemas e dúvidas dos clientes e equipe

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes tickets de suporte:
      | id    | titulo                      | cliente       | categoria  | prioridade | status     | criado      |
      | #001  | Dúvida sobre cancelamento   | Ana Souza     | billing    | medium     | open       | Há 1 hora   |
      | #002  | Erro no agendamento         | Bruno Costa   | technical  | high       | in_progress| Há 3 horas  |
      | #003  | Alterar horário da aula     | Carla Lima    | schedule   | low        | open       | Há 1 dia    |
      | #004  | Problema de acesso          | Diego Santos  | technical  | high       | resolved   | Há 2 dias   |
      | #005  | Reclamação sobre instrutor  | Elena Rocha   | feedback   | medium     | open       | Há 5 horas  |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de tickets
    Quando eu acesso a página de suporte
    Então eu devo ver a lista de todos os tickets
    E cada ticket deve exibir:
      | campo        |
      | ID           |
      | Título       |
      | Cliente      |
      | Categoria    |
      | Prioridade   |
      | Status       |
      | Criado há    |

  @sucesso @listagem
  Cenário: Filtrar tickets por status
    Quando eu seleciono o filtro "Status" com valor "Abertos"
    Então eu devo ver apenas os tickets com status "open"

  @sucesso @listagem
  Cenário: Filtrar tickets por prioridade
    Quando eu seleciono o filtro "Prioridade" com valor "Alta"
    Então eu devo ver apenas os tickets de alta prioridade

  @sucesso @listagem
  Cenário: Filtrar tickets por categoria
    Quando eu seleciono o filtro "Categoria" com valor "Técnico"
    Então eu devo ver apenas os tickets da categoria "technical"

  @sucesso @listagem
  Cenário: Buscar ticket por ID ou conteúdo
    Quando eu digito "#002" no campo de busca
    Então eu devo ver apenas o ticket "#002"

  @sucesso @listagem
  Cenário: Ordenar tickets por urgência
    Quando eu ordeno por "Mais urgentes primeiro"
    Então os tickets de alta prioridade mais antigos devem aparecer primeiro

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar detalhes do ticket
    Quando eu clico no ticket "#001"
    Então eu devo ver os detalhes completos:
      | campo             | valor                       |
      | Título            | Dúvida sobre cancelamento   |
      | Descrição         | Texto completo...           |
      | Cliente           | Ana Souza                   |
      | Categoria         | Billing                     |
      | Prioridade        | Média                       |
      | Status            | Aberto                      |
      | Criado em         | 15/01/2024 10:00            |
      | Última atualização| 15/01/2024 11:00            |

  @sucesso @visualizacao
  Cenário: Visualizar histórico de mensagens do ticket
    Quando eu acesso o ticket "#002"
    Então eu devo ver o histórico de mensagens com cada mensagem exibindo:
      | campo      |
      | Autor      |
      | Conteúdo   |
      | Data/hora  |
      | Anexos     |

  @sucesso @visualizacao
  Cenário: Visualizar informações do cliente no ticket
    Quando eu acesso um ticket
    Então eu devo ver o painel lateral com dados do cliente:
      | informacao       |
      | Nome             |
      | Email            |
      | Telefone         |
      | Plano            |
      | Histórico        |

  # ==========================================
  # CENÁRIOS DE SUCESSO - RESPOSTA
  # ==========================================

  @sucesso @resposta
  Cenário: Responder ticket
    Quando eu acesso o ticket "#001"
    E eu digito uma resposta "Olá Ana, para cancelar..."
    E eu clico em "Enviar Resposta"
    Então a resposta deve ser adicionada ao ticket
    E o cliente deve ser notificado via email

  @sucesso @resposta
  Cenário: Responder com template
    Quando eu clico em "Usar Template"
    E eu seleciono "Cancelamento de Plano"
    Então o template deve preencher o campo de resposta
    E eu posso editar antes de enviar

  @sucesso @resposta
  Cenário: Adicionar anexo à resposta
    Quando eu clico em "Anexar Arquivo"
    E eu seleciono um documento PDF
    E eu envio a resposta
    Então o anexo deve ser incluído na resposta
    E o cliente deve poder baixar o arquivo

  @sucesso @resposta
  Cenário: Adicionar nota interna (não visível ao cliente)
    Quando eu clico em "Nota Interna"
    E eu digito "Verificar com financeiro"
    E eu salvo
    Então a nota deve ser adicionada
    E não deve ser visível para o cliente

  # ==========================================
  # CENÁRIOS DE SUCESSO - GERENCIAMENTO
  # ==========================================

  @sucesso @gerenciamento
  Cenário: Alterar status do ticket
    Quando eu acesso o ticket "#001"
    E eu altero o status para "Em Andamento"
    Então o status deve ser atualizado
    E o cliente deve ser notificado da atualização

  @sucesso @gerenciamento
  Cenário: Alterar prioridade do ticket
    Quando eu altero a prioridade do ticket "#003" para "Alta"
    Então a prioridade deve ser atualizada
    E o ticket deve subir na lista de urgentes

  @sucesso @gerenciamento
  Cenário: Alterar categoria do ticket
    Quando eu altero a categoria do ticket "#001" de "billing" para "technical"
    Então a categoria deve ser atualizada

  @sucesso @gerenciamento
  Cenário: Atribuir ticket a membro da equipe
    Quando eu clico em "Atribuir"
    E eu seleciono "Maria Recepcionista"
    E eu confirmo
    Então o ticket deve ser atribuído a Maria
    E ela deve ser notificada

  @sucesso @gerenciamento
  Cenário: Resolver ticket
    Quando eu acesso o ticket "#002"
    E eu clico em "Marcar como Resolvido"
    E eu adiciono uma nota de resolução
    E eu confirmo
    Então o status deve mudar para "resolved"
    E o cliente deve receber pesquisa de satisfação

  @sucesso @gerenciamento
  Cenário: Reabrir ticket resolvido
    Quando eu acesso o ticket "#004" (resolvido)
    E eu clico em "Reabrir Ticket"
    E eu adiciono o motivo "Cliente reportou mesmo problema"
    Então o ticket deve ser reaberto
    E o histórico deve registrar a reabertura

  # ==========================================
  # CENÁRIOS DE SUCESSO - CRIAÇÃO
  # ==========================================

  @sucesso @criacao
  Cenário: Criar ticket em nome do cliente
    Quando eu clico em "Novo Ticket"
    E eu preencho:
      | campo       | valor                      |
      | cliente     | Bruno Costa                |
      | titulo      | Reagendamento de aula      |
      | categoria   | schedule                   |
      | prioridade  | medium                     |
      | descricao   | Cliente ligou solicitando..|
    E eu clico em "Criar"
    Então o ticket deve ser criado
    E o cliente deve receber confirmação

  # ==========================================
  # CENÁRIOS DE SUCESSO - MÉTRICAS
  # ==========================================

  @sucesso @metricas
  Cenário: Visualizar métricas de suporte
    Quando eu acesso o dashboard de suporte
    Então eu devo ver:
      | metrica                    | valor    |
      | Tickets abertos            | 12       |
      | Tempo médio de resposta    | 2h       |
      | Tempo médio de resolução   | 24h      |
      | Taxa de satisfação         | 4.5/5    |
      | Tickets resolvidos no mês  | 45       |

  @sucesso @metricas
  Cenário: Visualizar tickets por categoria
    Quando eu acesso o gráfico de categorias
    Então eu devo ver a distribuição:
      | categoria  | percentual |
      | Technical  | 35%        |
      | Billing    | 25%        |
      | Schedule   | 20%        |
      | Feedback   | 15%        |
      | Other      | 5%         |

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Responder ticket já fechado
    Dado que o ticket "#004" está resolvido há mais de 7 dias
    Quando eu tento responder
    Então eu devo ver "Este ticket está fechado. Deseja reabrir?"

  @erro
  Cenário: Criar ticket sem campos obrigatórios
    Quando eu tento criar um ticket sem preencher o título
    Então eu devo ver a mensagem de erro "Título é obrigatório"

  @erro
  Cenário: Anexo com formato não permitido
    Quando eu tento anexar um arquivo .exe
    Então eu devo ver a mensagem de erro "Formato de arquivo não permitido"

  @erro
  Cenário: Atribuir ticket a usuário sem permissão
    Quando eu tento atribuir um ticket a um instrutor (sem permissão de suporte)
    Então eu devo ver a mensagem de erro "Este usuário não tem permissão para suporte"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Ticket duplicado
    Dado que o cliente já abriu um ticket similar há 2 dias
    Quando eu visualizo o novo ticket
    Então eu devo ver um alerta "Possível ticket duplicado"
    E link para o ticket anterior

  @edge-case
  Cenário: SLA prestes a ser violado
    Dado que um ticket de alta prioridade está aberto há 23 horas
    E o SLA é de 24 horas
    Quando eu acesso a lista de tickets
    Então o ticket deve estar destacado em vermelho
    E eu devo receber notificação de SLA

  @edge-case
  Cenário: Escalonamento automático
    Dado que um ticket de alta prioridade está sem resposta há 4 horas
    Quando o sistema verifica tickets pendentes
    Então o ticket deve ser escalonado para o admin
    E uma notificação urgente deve ser enviada

  @edge-case
  Cenário: Ticket de equipe interna (professor)
    Dado que um professor abriu um ticket sobre o sistema
    Quando eu visualizo o ticket
    Então deve estar marcado como "Ticket Interno"
    E ter tratamento diferenciado

  @edge-case
  Cenário: Fusão de tickets duplicados
    Dado que existem 2 tickets do mesmo cliente sobre o mesmo assunto
    Quando eu clico em "Mesclar Tickets"
    E eu seleciono os tickets a mesclar
    E eu confirmo
    Então os tickets devem ser unidos
    E o histórico de ambos deve ser preservado

  @edge-case
  Cenário: Ticket com informação sensível (LGPD)
    Dado que um ticket contém dados pessoais sensíveis
    Quando eu marco como "Informação Sensível"
    Então o ticket deve ter acesso restrito
    E deve ser mascarado em relatórios

  @edge-case
  Cenário: Resposta automática por IA
    Dado que a funcionalidade de IA está ativa
    Quando um cliente abre um ticket comum
    Então o sistema deve sugerir uma resposta baseada em tickets similares
    E eu posso aprovar, editar ou rejeitar a sugestão

  @edge-case
  Cenário: Ticket convertido de conversa WhatsApp
    Dado que uma conversa do WhatsApp precisa de acompanhamento formal
    Quando eu clico em "Converter em Ticket"
    Então um ticket deve ser criado com o histórico da conversa anexado
