# language: pt
@teacher @students
Funcionalidade: Gestão de Alunos pelo Instrutor
  Como um Instrutor/Professor do studio
  Eu quero visualizar informações sobre meus alunos
  Para oferecer um atendimento personalizado e acompanhar seu progresso

  Contexto:
    Dado que estou logado como instrutor "Maria Silva"
    E tenho os seguintes alunos em minhas aulas:
      | aluno         | plano      | aulas_restantes | frequencia | aulas_comigo |
      | Ana Souza     | Mensal     | 5               | 85%        | 24           |
      | Bruno Costa   | Trimestral | 18              | 92%        | 36           |
      | Carla Lima    | Avulso     | 1               | -          | 3            |
      | Diego Santos  | Mensal     | 0               | 78%        | 15           |
      | Elena Rocha   | Anual      | 45              | 95%        | 50           |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de meus alunos
    Quando eu acesso a página de alunos
    Então eu devo ver a lista de todos os alunos que frequentam minhas aulas
    E cada aluno deve exibir:
      | campo             |
      | Nome              |
      | Foto              |
      | Plano             |
      | Frequência        |
      | Última aula       |
      | Observações       |

  @sucesso @listagem
  Cenário: Filtrar alunos por frequência
    Quando eu seleciono o filtro "Frequência" com valor "Baixa (<80%)"
    Então eu devo ver apenas os alunos com frequência abaixo de 80%
    E "Diego Santos" deve estar na lista

  @sucesso @listagem
  Cenário: Filtrar alunos por tipo de aula
    Quando eu seleciono o filtro "Tipo de Aula" com valor "Pilates Reformer"
    Então eu devo ver apenas os alunos que frequentam Pilates Reformer comigo

  @sucesso @listagem
  Cenário: Buscar aluno por nome
    Quando eu digito "Elena" no campo de busca
    Então eu devo ver apenas "Elena Rocha" na lista

  @sucesso @listagem
  Cenário: Ordenar alunos por diferentes critérios
    Quando eu ordeno por "Aulas comigo"
    Então os alunos devem estar ordenados por número de aulas assistidas
    E "Elena Rocha" deve aparecer primeiro (50 aulas)

  # ==========================================
  # CENÁRIOS DE SUCESSO - DETALHES DO ALUNO
  # ==========================================

  @sucesso @detalhes
  Cenário: Visualizar perfil do aluno
    Quando eu clico no aluno "Ana Souza"
    Então eu devo ver o perfil com:
      | informacao         | valor                |
      | Nome               | Ana Souza            |
      | Plano              | Mensal               |
      | Aulas restantes    | 5                    |
      | Frequência média   | 85%                  |
      | Aulas comigo       | 24                   |
      | Membro desde       | Março/2023           |

  @sucesso @detalhes
  Cenário: Visualizar histórico de aulas do aluno comigo
    Quando eu acesso o perfil do aluno "Ana Souza"
    E eu acesso a aba "Histórico de Aulas"
    Então eu devo ver as aulas que ela fez comigo:
      | data       | aula            | presenca  | observacao |
      | 15/01      | Pilates Mat     | Presente  | -          |
      | 12/01      | Pilates Mat     | Presente  | -          |
      | 10/01      | Pilates Reformer| Ausente   | Reposição pendente |

  @sucesso @detalhes
  Cenário: Visualizar observações sobre o aluno
    Quando eu acesso o perfil do aluno "Bruno Costa"
    E eu acesso a aba "Observações"
    Então eu devo ver as observações cadastradas:
      | data       | autor         | observacao                          |
      | 10/01      | Maria Silva   | Dor no ombro direito - cuidado      |
      | 05/01      | João Santos   | Evoluindo bem no Reformer           |

  @sucesso @detalhes
  Cenário: Visualizar progresso do aluno
    Quando eu acesso o perfil do aluno "Elena Rocha"
    E eu acesso a aba "Progresso"
    Então eu devo ver indicadores de evolução:
      | indicador          | valor                |
      | Frequência         | Aumentou 10% vs trim anterior |
      | Consistência       | 4 aulas/semana       |
      | Tempo de prática   | 10 meses             |

  # ==========================================
  # CENÁRIOS DE SUCESSO - OBSERVAÇÕES
  # ==========================================

  @sucesso @observacoes
  Cenário: Adicionar observação sobre aluno
    Quando eu acesso o perfil do aluno "Ana Souza"
    E eu clico em "Adicionar Observação"
    E eu digito "Sentiu desconforto no quadril hoje. Sugerir avaliação médica."
    E eu seleciono a categoria "Saúde"
    E eu clico em "Salvar"
    Então a observação deve ser adicionada ao perfil
    E deve estar visível para outros instrutores

  @sucesso @observacoes
  Cenário: Marcar observação como importante
    Quando eu adiciono uma observação
    E eu marco como "Importante"
    Então a observação deve aparecer em destaque
    E um alerta deve aparecer quando o aluno for inscrito em aulas

  @sucesso @observacoes
  Cenário: Adicionar restrição de exercícios
    Quando eu acesso o perfil do aluno
    E eu clico em "Adicionar Restrição"
    E eu seleciono "Evitar exercícios de impacto"
    E eu adiciono o motivo "Lesão no joelho em recuperação"
    E eu defino validade "Até 28/02/2024"
    E eu clico em "Salvar"
    Então a restrição deve aparecer em destaque no perfil

  # ==========================================
  # CENÁRIOS DE SUCESSO - REPOSIÇÕES
  # ==========================================

  @sucesso @reposicoes
  Cenário: Visualizar alunos com reposição pendente
    Quando eu acesso a seção "Reposições Pendentes"
    Então eu devo ver os alunos que faltaram e têm direito a reposição:
      | aluno         | aula_original   | data_falta | prazo_reposicao |
      | Ana Souza     | Pilates Mat     | 10/01      | 10/02           |
      | Diego Santos  | Yoga Flow       | 08/01      | 08/02           |

  @sucesso @reposicoes
  Cenário: Agendar reposição para aluno
    Quando eu clico em "Agendar Reposição" para "Ana Souza"
    E eu seleciono a aula "Pilates Mat - 20/01 07:00"
    E eu confirmo
    Então a reposição deve ser agendada
    E o aluno deve ser notificado
    E o direito a reposição deve ser baixado

  # ==========================================
  # CENÁRIOS DE SUCESSO - COMUNICAÇÃO
  # ==========================================

  @sucesso @comunicacao
  Cenário: Enviar mensagem para aluno
    Quando eu acesso o perfil do aluno "Bruno Costa"
    E eu clico em "Enviar Mensagem"
    E eu seleciono "WhatsApp"
    E eu digito "Olá Bruno! Lembrete: amanhã temos aula às 9h"
    E eu clico em "Enviar"
    Então a mensagem deve ser enviada via WhatsApp

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @detalhes
  Cenário: Tentar acessar perfil de aluno que não é meu
    Dado que "Fernando Silva" não frequenta minhas aulas
    Quando eu tento acessar seu perfil
    Então eu devo ver a mensagem "Você não tem permissão para ver este aluno"

  @erro @observacoes
  Cenário: Adicionar observação vazia
    Quando eu tento salvar uma observação sem texto
    Então eu devo ver a mensagem de erro "Observação não pode estar vazia"

  @erro @reposicoes
  Cenário: Agendar reposição em aula lotada
    Quando eu tento agendar reposição em uma aula com capacidade máxima
    Então eu devo ver a mensagem "Aula lotada. Escolha outra data/horário."

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Aluno com plano prestes a vencer
    Dado que "Diego Santos" tem 0 aulas restantes
    Quando eu visualizo seu perfil
    Então eu devo ver um alerta "Plano esgotado"
    E eu devo poder informar ao aluno sobre renovação

  @edge-case
  Cenário: Aluno inativo há muito tempo
    Dado que "Carla Lima" não frequenta aulas há 30 dias
    Quando eu acesso a lista de alunos
    Então ela deve estar marcada como "Inativa"
    E deve haver sugestão de contato para reativação

  @edge-case
  Cenário: Novo aluno sem histórico
    Dado que um aluno acabou de se matricular
    Quando eu acesso seu perfil
    Então eu devo ver "Novo Aluno" destacado
    E as métricas de frequência devem mostrar "Sem dados"

  @edge-case
  Cenário: Aluno com múltiplos instrutores
    Dado que "Elena Rocha" faz aulas com 3 instrutores diferentes
    Quando eu acesso seu perfil
    Então eu devo ver apenas o histórico de aulas comigo
    Mas as observações devem ser compartilhadas entre instrutores

  @edge-case
  Cenário: Observação confidencial (apenas admin)
    Dado que o admin adicionou uma observação confidencial sobre o aluno
    Quando eu acesso o perfil do aluno
    Então eu não devo ver a observação confidencial
    Mas devo ver um indicador de que há informações restritas

  @edge-case
  Cenário: Aluno com necessidades especiais
    Dado que o aluno tem necessidades especiais cadastradas
    Quando eu acesso seu perfil
    Então eu devo ver um ícone de atenção especial
    E as informações sobre adaptações necessárias

  @edge-case
  Cenário: Exportar dados dos meus alunos
    Quando eu clico em "Exportar Lista de Alunos"
    Então eu devo poder baixar uma lista dos meus alunos com métricas básicas sem dados sensíveis
