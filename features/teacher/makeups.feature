# language: pt
@teacher @makeups
Funcionalidade: Gerenciamento de Reposições
  Como um Instrutor/Professor do studio
  Eu quero gerenciar as reposições dos meus alunos
  Para garantir que eles possam recuperar aulas perdidas

  Contexto:
    Dado que estou logado como instrutor "Maria Silva"
    E existem as seguintes reposições pendentes dos meus alunos:
      | aluno         | aula_original    | data_falta  | prazo        | status     |
      | Ana Souza     | Pilates Mat      | 2024-01-10  | 2024-02-10   | pendente   |
      | Bruno Costa   | Pilates Reformer | 2024-01-08  | 2024-02-08   | agendada   |
      | Carla Lima    | Yoga Flow        | 2024-01-05  | 2024-02-05   | pendente   |
      | Diego Santos  | Pilates Mat      | 2024-01-12  | 2024-02-12   | pendente   |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar reposições pendentes
    Quando eu acesso a página de reposições
    Então eu devo ver a lista de reposições pendentes:
      | campo            |
      | Nome do aluno    |
      | Aula original    |
      | Data da falta    |
      | Prazo limite     |
      | Status           |
      | Ações            |

  @sucesso @listagem
  Cenário: Filtrar reposições por status
    Quando eu seleciono o filtro "Status" com valor "Pendente"
    Então eu devo ver apenas as reposições ainda não agendadas

  @sucesso @listagem
  Cenário: Filtrar reposições por prazo
    Quando eu seleciono o filtro "Prazo" com valor "Vencendo esta semana"
    Então eu devo ver apenas as reposições com prazo próximo
    E elas devem estar destacadas em vermelho

  @sucesso @listagem
  Cenário: Buscar reposição por nome do aluno
    Quando eu digito "Ana" no campo de busca
    Então eu devo ver apenas a reposição de "Ana Souza"

  # ==========================================
  # CENÁRIOS DE SUCESSO - AGENDAMENTO
  # ==========================================

  @sucesso @agendamento
  Cenário: Agendar reposição para aluno
    Quando eu clico em "Agendar" na reposição de "Ana Souza"
    Então eu devo ver minhas aulas disponíveis com vagas
    E cada aula deve mostrar:
      | informacao        |
      | Data e horário    |
      | Tipo de aula      |
      | Vagas disponíveis |

  @sucesso @agendamento
  Cenário: Confirmar agendamento de reposição
    Quando eu seleciono a aula "Pilates Mat - 20/01 07:00"
    E eu clico em "Confirmar Agendamento"
    Então a reposição deve ser agendada
    E o status deve mudar para "Agendada"
    E o aluno deve receber notificação via WhatsApp/Email

  @sucesso @agendamento
  Cenário: Agendar reposição em aula de outro instrutor
    Dado que minhas aulas estão lotadas
    Quando eu clico em "Ver todas as aulas disponíveis"
    Então eu devo ver aulas de outros instrutores do mesmo tipo
    E eu posso agendar a reposição em qualquer uma disponível

  @sucesso @agendamento
  Cenário: Sugerir horários ao aluno
    Quando eu clico em "Sugerir Horários" para "Diego Santos"
    E eu seleciono 3 opções de aulas disponíveis
    E eu clico em "Enviar Sugestões"
    Então o aluno deve receber as sugestões
    E poderá escolher e confirmar pelo app/link

  # ==========================================
  # CENÁRIOS DE SUCESSO - ACOMPANHAMENTO
  # ==========================================

  @sucesso @acompanhamento
  Cenário: Visualizar reposição agendada
    Quando eu clico na reposição agendada de "Bruno Costa"
    Então eu devo ver os detalhes:
      | campo            | valor                 |
      | Status           | Agendada              |
      | Aula original    | Pilates Reformer      |
      | Data falta       | 08/01/2024            |
      | Reposição em     | 22/01/2024 09:00      |
      | Sala             | Sala 2                |

  @sucesso @acompanhamento
  Cenário: Reagendar reposição
    Dado que a reposição de "Bruno Costa" está agendada
    Quando eu clico em "Reagendar"
    E eu seleciono uma nova data/aula
    E eu confirmo
    Então a reposição deve ser reagendada
    E o aluno deve ser notificado da mudança

  @sucesso @acompanhamento
  Cenário: Cancelar reposição agendada
    Quando eu clico em "Cancelar" na reposição agendada
    E eu seleciono o motivo "Solicitação do aluno"
    E eu confirmo
    Então a reposição deve voltar ao status "Pendente"
    E o prazo deve continuar o mesmo

  # ==========================================
  # CENÁRIOS DE SUCESSO - REALIZAÇÃO
  # ==========================================

  @sucesso @realizacao
  Cenário: Marcar reposição como realizada
    Dado que a aula de reposição de "Bruno Costa" aconteceu
    E eu registrei presença dele
    Quando o sistema processa a presença
    Então a reposição deve ser marcada como "Realizada" automaticamente

  @sucesso @realizacao
  Cenário: Aluno falta na reposição
    Dado que a aula de reposição de "Bruno Costa" aconteceu
    E eu registrei ele como ausente
    Então a reposição deve ser marcada como "Não compareceu"
    E o aluno perde o direito (conforme política)

  # ==========================================
  # CENÁRIOS DE SUCESSO - COMUNICAÇÃO
  # ==========================================

  @sucesso @comunicacao
  Cenário: Enviar lembrete de prazo de reposição
    Dado que a reposição de "Carla Lima" vence em 3 dias
    Quando eu clico em "Enviar Lembrete"
    Então uma mensagem deve ser enviada ao aluno com o prazo limite e link para agendar

  @sucesso @comunicacao
  Cenário: Notificar sobre reposições prestes a vencer
    Dado que existem 3 reposições vencendo esta semana
    Quando eu acesso a página de reposições
    Então eu devo ver um alerta destacado com a lista de alunos e prazos

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @agendamento
  Cenário: Agendar reposição em aula lotada
    Quando eu tento agendar reposição em uma aula com 10/10 inscritos
    Então eu devo ver a mensagem "Aula lotada. Escolha outra opção."

  @erro @agendamento
  Cenário: Agendar reposição após prazo vencido
    Dado que o prazo da reposição de "Carla Lima" expirou
    Quando eu tento agendar
    Então eu devo ver a mensagem "Prazo de reposição expirado"
    E eu devo ver "Contate o administrador para extensão do prazo"

  @erro @agendamento
  Cenário: Agendar reposição em tipo de aula diferente
    Dado que a falta foi em "Pilates Mat"
    Quando eu tento agendar reposição em "Yoga Flow"
    Então eu devo ver um aviso "Tipo de aula diferente da original"
    E eu devo confirmar se deseja prosseguir

  @erro @agendamento
  Cenário: Aluno já inscrito na aula selecionada
    Dado que "Ana Souza" já está inscrita na aula de 20/01
    Quando eu tento agendar a reposição dela nessa aula
    Então eu devo ver a mensagem "Aluno já está inscrito nesta aula"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Reposição com prazo estendido pelo admin
    Dado que o admin estendeu o prazo de reposição de "Carla Lima"
    Quando eu visualizo a reposição
    Então eu devo ver o novo prazo
    E uma nota "Prazo estendido pelo administrador"

  @edge-case
  Cenário: Múltiplas reposições do mesmo aluno
    Dado que "Diego Santos" tem 3 reposições pendentes
    Quando eu visualizo suas reposições
    Então eu devo ver todas listadas com opção de agendar todas de uma vez

  @edge-case
  Cenário: Reposição transferida de outro instrutor
    Dado que a reposição original era com "João Santos"
    E foi transferida para mim
    Quando eu visualizo a reposição
    Então eu devo ver "Transferida de: João Santos"
    E poder agendar normalmente

  @edge-case
  Cenário: Aluno inativo com reposição pendente
    Dado que "Carla Lima" tornou-se inativa
    E ainda tem reposição pendente
    Quando eu visualizo as reposições
    Então ela deve estar marcada como "Aluno Inativo"
    E as ações devem estar bloqueadas

  @edge-case
  Cenário: Reposição em aula especial/workshop
    Dado que o aluno faltou em uma aula regular
    E há um workshop disponível
    Quando eu tento agendar a reposição no workshop
    Então eu devo ver aviso "Workshops podem ter regras especiais"
    E verificar se é permitido

  @edge-case
  Cenário: Reposição durante férias do instrutor
    Dado que entrei em férias
    E tenho reposições pendentes dos meus alunos
    Então outro instrutor deve poder agendar as reposições em aulas adequadas

  @edge-case
  Cenário: Relatório de reposições do período
    Quando eu acesso "Relatório de Reposições"
    E eu seleciono o período "Este mês"
    Então eu devo ver:
      | metrica                    | valor |
      | Total de reposições        | 15    |
      | Realizadas                 | 10    |
      | Pendentes                  | 4     |
      | Vencidas/não realizadas    | 1     |
