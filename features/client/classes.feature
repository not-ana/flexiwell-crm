# language: pt
@client @classes
Funcionalidade: Visualização e Agendamento de Aulas
  Como um Cliente/Aluno do studio
  Eu quero visualizar e agendar aulas
  Para participar das atividades do studio

  Contexto:
    Dado que estou logado como cliente "Ana Souza"
    E possuo plano "Mensal" com 5 aulas restantes
    E existem as seguintes aulas disponíveis:
      | aula             | data       | horario | instrutor    | sala   | vagas  |
      | Pilates Mat      | 2024-01-16 | 07:00   | Maria Silva  | Sala 1 | 2/10   |
      | Pilates Reformer | 2024-01-16 | 09:00   | João Santos  | Sala 2 | 0/6    |
      | Yoga Flow        | 2024-01-16 | 18:00   | Ana Costa    | Sala 1 | 5/15   |
      | Funcional        | 2024-01-17 | 07:00   | Pedro Lima   | Sala 3 | 8/12   |

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar grade de aulas disponíveis
    Quando eu acesso a página de aulas
    Então eu devo ver a grade de aulas organizadas por dia
    E cada aula deve exibir:
      | campo         |
      | Horário       |
      | Tipo de aula  |
      | Instrutor     |
      | Vagas         |
      | Botão Agendar |

  @sucesso @visualizacao
  Cenário: Visualizar aulas em modo calendário
    Quando eu seleciono a visualização "Calendário"
    Então eu devo ver as aulas no formato de calendário
    E as aulas com vagas devem estar em verde
    E as aulas lotadas devem estar em vermelho

  @sucesso @visualizacao
  Cenário: Filtrar aulas por tipo
    Quando eu seleciono o filtro "Tipo" com valor "Pilates"
    Então eu devo ver apenas as aulas de Pilates
    E eu não devo ver "Yoga Flow" e "Funcional"

  @sucesso @visualizacao
  Cenário: Filtrar aulas por instrutor
    Quando eu seleciono o filtro "Instrutor" com valor "Maria Silva"
    Então eu devo ver apenas as aulas da Maria Silva

  @sucesso @visualizacao
  Cenário: Filtrar aulas por horário
    Quando eu seleciono o filtro "Horário" com valor "Manhã"
    Então eu devo ver apenas as aulas até 12:00

  @sucesso @visualizacao
  Cenário: Visualizar detalhes da aula
    Quando eu clico na aula "Pilates Mat - 16/01 07:00"
    Então eu devo ver os detalhes:
      | campo          | valor           |
      | Tipo           | Pilates Mat     |
      | Data           | 16/01/2024      |
      | Horário        | 07:00 - 08:00   |
      | Instrutor      | Maria Silva     |
      | Sala           | Sala 1          |
      | Vagas          | 8 disponíveis   |
      | Descrição      | Aula de pilates no solo... |

  # ==========================================
  # CENÁRIOS DE SUCESSO - AGENDAMENTO
  # ==========================================

  @sucesso @agendamento
  Cenário: Agendar aula disponível
    Quando eu acesso a aula "Pilates Mat - 16/01 07:00"
    E eu clico em "Agendar"
    E eu confirmo o agendamento
    Então eu devo ver a mensagem "Aula agendada com sucesso!"
    E 1 aula deve ser debitada do meu plano
    E eu devo receber confirmação por email/WhatsApp

  @sucesso @agendamento
  Cenário: Visualizar minhas aulas agendadas
    Quando eu acesso "Minhas Aulas"
    Então eu devo ver a lista das aulas que agendei:
      | data       | horario | aula         | instrutor   | status     |
      | 16/01      | 07:00   | Pilates Mat  | Maria Silva | Confirmada |
      | 18/01      | 09:00   | Yoga Flow    | Ana Costa   | Confirmada |

  @sucesso @agendamento
  Cenário: Entrar na lista de espera
    Dado que a aula "Pilates Reformer" está lotada (0 vagas)
    Quando eu acesso a aula
    E eu clico em "Entrar na Lista de Espera"
    E eu confirmo
    Então eu devo ser adicionado à lista de espera
    E eu devo ver minha posição na fila

  @sucesso @agendamento
  Cenário: Receber notificação de vaga na lista de espera
    Dado que estou na lista de espera de "Pilates Reformer"
    E uma vaga abriu
    Quando eu recebo a notificação
    Então eu devo ter um link para confirmar a vaga
    E eu devo confirmar dentro de 2 horas

  # ==========================================
  # CENÁRIOS DE SUCESSO - CANCELAMENTO
  # ==========================================

  @sucesso @cancelamento
  Cenário: Cancelar aula agendada dentro do prazo
    Dado que agendei a aula "Pilates Mat - 16/01 07:00"
    E faltam mais de 12 horas para a aula
    Quando eu acesso "Minhas Aulas"
    E eu clico em "Cancelar" na aula
    E eu confirmo o cancelamento
    Então a aula deve ser cancelada
    E 1 aula deve ser creditada de volta ao meu plano

  @sucesso @cancelamento
  Cenário: Cancelar com menos de 12h de antecedência
    Dado que agendei uma aula para daqui a 6 horas
    Quando eu tento cancelar
    Então eu devo ver um aviso "Cancelamento com menos de 12h"
    E a aula será cancelada mas não será creditada de volta conforme política do studio

  @sucesso @cancelamento
  Cenário: Sair da lista de espera
    Dado que estou na lista de espera de "Pilates Reformer"
    Quando eu acesso "Minhas Aulas"
    E eu clico em "Sair da Lista"
    E eu confirmo
    Então eu devo ser removido da lista de espera

  # ==========================================
  # CENÁRIOS DE SUCESSO - REPOSIÇÃO
  # ==========================================

  @sucesso @reposicao
  Cenário: Visualizar reposições disponíveis
    Dado que tenho 2 reposições pendentes
    Quando eu acesso "Minhas Reposições"
    Então eu devo ver as reposições disponíveis:
      | aula_original | data_falta | prazo_limite |
      | Pilates Mat   | 10/01      | 10/02        |
      | Yoga Flow     | 08/01      | 08/02        |

  @sucesso @reposicao
  Cenário: Agendar aula como reposição
    Dado que tenho uma reposição disponível
    Quando eu acesso uma aula disponível
    E eu clico em "Usar como Reposição"
    E eu confirmo
    Então a aula deve ser agendada
    E a reposição deve ser baixada
    E não deve debitar aula do plano

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @agendamento
  Cenário: Agendar aula sem créditos disponíveis
    Dado que não tenho mais aulas no meu plano
    Quando eu tento agendar uma aula
    Então eu devo ver a mensagem "Você não tem aulas disponíveis"
    E eu devo ver opção de "Renovar Plano" ou "Comprar Aula Avulsa"

  @erro @agendamento
  Cenário: Agendar aula em conflito de horário
    Dado que já tenho uma aula agendada às 07:00 do dia 16/01
    Quando eu tento agendar outra aula no mesmo horário
    Então eu devo ver a mensagem "Você já tem uma aula neste horário"

  @erro @agendamento
  Cenário: Agendar aula lotada
    Dado que a aula está com 10/10 inscritos
    Quando eu tento agendar
    Então eu devo ver a mensagem "Aula lotada"
    E eu devo ver opção de "Entrar na Lista de Espera"

  @erro @agendamento
  Cenário: Agendar aula muito próxima
    Dado que a aula começa em 30 minutos
    Quando eu tento agendar
    Então eu devo ver a mensagem "Agendamento deve ser feito com pelo menos 2 horas de antecedência"

  @erro @cancelamento
  Cenário: Cancelar aula que já passou
    Dado que a aula já aconteceu
    Quando eu tento cancelar
    Então eu devo ver a mensagem "Não é possível cancelar aulas passadas"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Aula cancelada pelo studio
    Dado que agendei uma aula
    E o studio cancelou a aula
    Quando eu acesso "Minhas Aulas"
    Então eu devo ver a aula marcada como "Cancelada pelo Studio"
    E a aula deve ter sido creditada de volta automaticamente

  @edge-case
  Cenário: Substituição de instrutor
    Dado que agendei aula com "Maria Silva"
    E houve substituição para "João Santos"
    Quando eu acesso os detalhes da aula
    Então eu devo ver "Instrutor: João Santos (substituindo Maria Silva)"
    E eu devo ter recebido notificação da mudança

  @edge-case
  Cenário: Aula experimental
    Dado que sou um cliente novo em período de experiência
    Quando eu agendo uma aula
    Então a aula deve ser marcada como "Experimental"
    E não deve debitar do plano

  @edge-case
  Cenário: Agendamento recorrente
    Quando eu acesso uma aula
    E eu clico em "Agendar Recorrência"
    E eu seleciono "Toda segunda-feira às 07:00"
    E eu defino o período "Janeiro e Fevereiro"
    E eu confirmo
    Então todas as aulas do período devem ser agendadas
    E as aulas disponíveis no plano devem ser verificadas

  @edge-case
  Cenário: Aula em feriado
    Dado que há uma aula agendada durante feriado
    Quando eu visualizo a aula
    Então eu devo ver um indicador de feriado
    E uma nota sobre possível alteração

  @edge-case
  Cenário: Check-in via QR Code
    Dado que cheguei ao studio
    Quando eu acesso o app e escaneio o QR Code da recepção
    Então meu check-in deve ser registrado
    E eu devo ver confirmação na tela

  @edge-case
  Cenário: Aula com requisito de nível
    Dado que a aula "Pilates Avançado" requer experiência prévia
    E eu sou iniciante
    Quando eu tento agendar
    Então eu devo ver um aviso sobre o nível recomendado
    E eu posso prosseguir ou escolher outra aula
