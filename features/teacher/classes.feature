# language: pt
@teacher @classes
Funcionalidade: Aulas do Instrutor
  Como um Instrutor/Professor do studio
  Eu quero visualizar e gerenciar minhas aulas
  Para organizar minha agenda e atender meus alunos

  Contexto:
    Dado que estou logado como instrutor "Maria Silva"
    E tenho as seguintes aulas atribuídas:
      | aula             | data       | horario | sala   | inscritos | status    |
      | Pilates Mat      | 2024-01-15 | 07:00   | Sala 1 | 8/10      | scheduled |
      | Pilates Reformer | 2024-01-15 | 09:00   | Sala 2 | 6/6       | scheduled |
      | Yoga Flow        | 2024-01-15 | 18:00   | Sala 1 | 10/15     | scheduled |
      | Pilates Mat      | 2024-01-16 | 07:00   | Sala 1 | 7/10      | scheduled |
      | Pilates Mat      | 2024-01-14 | 07:00   | Sala 1 | 9/10      | completed |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar minhas aulas da semana
    Quando eu acesso a página de aulas
    Então eu devo ver minhas aulas organizadas por dia
    E cada aula deve exibir:
      | campo         |
      | Horário       |
      | Tipo de aula  |
      | Sala          |
      | Inscritos     |
      | Status        |

  @sucesso @listagem
  Cenário: Visualizar aulas em modo calendário
    Quando eu seleciono a visualização "Calendário"
    Então eu devo ver minhas aulas no formato de calendário
    E as aulas devem estar coloridas por tipo

  @sucesso @listagem
  Cenário: Filtrar aulas por tipo
    Quando eu seleciono o filtro "Tipo" com valor "Pilates Mat"
    Então eu devo ver apenas as aulas de Pilates Mat

  @sucesso @listagem
  Cenário: Visualizar histórico de aulas passadas
    Quando eu acesso a aba "Histórico"
    Então eu devo ver as aulas já realizadas com data, taxa de presença e observações

  # ==========================================
  # CENÁRIOS DE SUCESSO - DETALHES DA AULA
  # ==========================================

  @sucesso @detalhes
  Cenário: Visualizar detalhes de uma aula
    Quando eu clico na aula "Pilates Mat" do dia 15/01 às 07:00
    Então eu devo ver os detalhes:
      | campo           | valor              |
      | Tipo            | Pilates Mat        |
      | Data            | 15/01/2024         |
      | Horário         | 07:00 - 08:00      |
      | Sala            | Sala 1             |
      | Capacidade      | 10 alunos          |
      | Inscritos       | 8 alunos           |
      | Vagas           | 2 disponíveis      |

  @sucesso @detalhes
  Cenário: Visualizar lista de alunos inscritos na aula
    Quando eu acesso os detalhes da aula
    E eu acesso a aba "Alunos Inscritos"
    Então eu devo ver a lista de alunos:
      | aluno         | plano      | frequencia | status      |
      | Ana Souza     | Mensal     | 85%        | confirmado  |
      | Bruno Costa   | Trimestral | 92%        | confirmado  |
      | Carla Lima    | Avulso     | -          | pendente    |

  @sucesso @detalhes
  Cenário: Visualizar observações sobre alunos
    Quando eu acesso a lista de alunos da aula
    E um aluno tem observação cadastrada
    Então eu devo ver um ícone de alerta no aluno
    E ao clicar, ver a observação (ex: "Lesão no joelho - evitar exercícios de impacto")

  # ==========================================
  # CENÁRIOS DE SUCESSO - PRESENÇA
  # ==========================================

  @sucesso @presenca
  Cenário: Registrar presença dos alunos
    Dado que a aula está em andamento ou recém-terminada
    Quando eu acesso a aula "Pilates Mat"
    E eu clico em "Registrar Presença"
    Então eu devo ver a lista de alunos para marcar:
      | aluno         | opcoes                         |
      | Ana Souza     | Presente / Ausente / Atrasado  |
      | Bruno Costa   | Presente / Ausente / Atrasado  |
      | Carla Lima    | Presente / Ausente / Atrasado  |

  @sucesso @presenca
  Cenário: Marcar todos como presentes
    Quando eu acesso o registro de presença
    E eu clico em "Marcar Todos Presentes"
    Então todos os alunos devem ser marcados como presentes
    E eu posso ajustar individualmente se necessário

  @sucesso @presenca
  Cenário: Registrar no-show
    Quando eu marco "Ausente" para "Carla Lima"
    E eu salvo o registro de presença
    Então o sistema deve:
      | acao                                      |
      | Registrar ausência no histórico do aluno  |
      | Debitar aula do plano (conforme política) |
      | Gerar direito a reposição (se aplicável)  |
      | Notificar aluno sobre ausência            |

  @sucesso @presenca
  Cenário: Adicionar observação na presença
    Quando eu marco presença para "Ana Souza"
    E eu adiciono a observação "Aluna sentiu desconforto no ombro"
    E eu salvo
    Então a observação deve ficar vinculada ao registro de presença

  # ==========================================
  # CENÁRIOS DE SUCESSO - CANCELAMENTO
  # ==========================================

  @sucesso @cancelamento
  Cenário: Solicitar cancelamento de aula
    Quando eu acesso a aula "Yoga Flow"
    E eu clico em "Solicitar Cancelamento"
    E eu seleciono o motivo "Indisposição"
    E eu adiciono detalhes
    E eu confirmo
    Então a solicitação deve ser enviada ao admin
    E eu devo ver a mensagem "Solicitação de cancelamento enviada"

  @sucesso @cancelamento
  Cenário: Solicitar substituição por outro instrutor
    Quando eu preciso faltar em uma aula
    E eu clico em "Solicitar Substituição"
    E eu indico o motivo
    Então a solicitação deve ser enviada ao admin
    E outros instrutores disponíveis devem ser notificados

  # ==========================================
  # CENÁRIOS DE SUCESSO - WALK-IN
  # ==========================================

  @sucesso @walkin
  Cenário: Adicionar aluno walk-in à aula
    Dado que um aluno chegou sem reserva
    Quando eu acesso a aula em andamento
    E eu clico em "Adicionar Walk-in"
    E eu busco o cliente "Diego Santos"
    E eu confirmo a adição
    Então o aluno deve ser adicionado à lista de presença
    E a aula do plano deve ser debitada

  @sucesso @walkin
  Cenário: Adicionar walk-in com aula avulsa
    Dado que o aluno não tem créditos no plano
    Quando eu tento adicionar como walk-in
    Então eu devo ver a opção "Cobrar aula avulsa"
    E ao confirmar, o pagamento deve ser registrado

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @presenca
  Cenário: Registrar presença de aula futura
    Dado que a aula é amanhã
    Quando eu tento registrar presença
    Então eu devo ver a mensagem "Presença só pode ser registrada no dia da aula"

  @erro @presenca
  Cenário: Registrar presença muito tempo após a aula
    Dado que a aula foi há 3 dias e presença não foi registrada
    Quando eu tento registrar presença
    Então eu devo ver a mensagem "Prazo para registro de presença expirado. Contate o administrador."

  @erro @walkin
  Cenário: Adicionar walk-in em aula lotada
    Dado que a aula tem 10/10 inscritos
    Quando eu tento adicionar um walk-in
    Então eu devo ver a mensagem "Aula lotada. Não é possível adicionar mais alunos."

  @erro @cancelamento
  Cenário: Solicitar cancelamento com pouca antecedência
    Dado que a aula é em 1 hora
    Quando eu tento solicitar cancelamento
    Então eu devo ver a mensagem "Cancelamento com menos de 2 horas requer aprovação urgente do admin"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Aula com todos os alunos ausentes
    Dado que nenhum aluno compareceu à aula
    Quando eu registro presença
    Então eu devo marcar todos como ausentes
    E adicionar observação geral sobre a aula

  @edge-case
  Cenário: Aluno chega após início da aula
    Dado que a aula começou há 15 minutos
    Quando eu adiciono o aluno "Ana Souza" como presente
    Então eu posso marcá-la como "Atrasada"
    E registrar o tempo de atraso

  @edge-case
  Cenário: Aula com equipamento danificado
    Dado que durante a aula um equipamento quebrou
    Quando eu acesso as observações da aula
    E eu registro "Reformer #3 com defeito"
    E eu marco como "Requer manutenção"
    Então o admin deve ser notificado
    E o equipamento deve ser bloqueado para próximas aulas

  @edge-case
  Cenário: Substituição de último minuto
    Dado que fui designado para substituir outro instrutor
    Quando eu acesso a aula
    Então eu devo ver um alerta "Você está substituindo João Santos"
    E ter acesso às observações sobre os alunos

  @edge-case
  Cenário: Aula durante feriado
    Dado que há uma aula agendada durante feriado
    Quando eu acesso minhas aulas
    Então a aula deve estar destacada com ícone de feriado
    E eu posso confirmar se será realizada ou não

  @edge-case
  Cenário: Visualizar feedback dos alunos
    Dado que alunos avaliaram minha aula anterior
    Quando eu acesso o histórico dessa aula
    Então eu devo ver a avaliação média
    E os comentários (anônimos) dos alunos
