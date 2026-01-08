# language: pt
@teacher @attendance
Funcionalidade: Registro de Presença
  Como um Instrutor/Professor do studio
  Eu quero registrar a presença dos alunos nas aulas
  Para manter o controle de frequência e gerar dados para reposições

  Contexto:
    Dado que estou logado como instrutor "Maria Silva"
    E tenho a aula "Pilates Mat" agendada para hoje às 07:00
    E a aula possui os seguintes alunos inscritos:
      | aluno         | plano      | confirmacao |
      | Ana Souza     | Mensal     | confirmado  |
      | Bruno Costa   | Trimestral | confirmado  |
      | Carla Lima    | Avulso     | pendente    |
      | Diego Santos  | Mensal     | confirmado  |
      | Elena Rocha   | Anual      | confirmado  |

  # ==========================================
  # CENÁRIOS DE SUCESSO - REGISTRO
  # ==========================================

  @sucesso @registro
  Cenário: Acessar tela de registro de presença
    Dado que a aula está acontecendo ou acabou de terminar
    Quando eu acesso a aula "Pilates Mat"
    E eu clico em "Registrar Presença"
    Então eu devo ver a lista de alunos inscritos com opções de marcar Presente, Ausente ou Atrasado

  @sucesso @registro
  Cenário: Marcar aluno como presente
    Quando eu acesso o registro de presença
    E eu marco "Ana Souza" como "Presente"
    Então o status deve ser atualizado para "Presente"
    E um check verde deve aparecer ao lado do nome

  @sucesso @registro
  Cenário: Marcar aluno como ausente (no-show)
    Quando eu acesso o registro de presença
    E eu marco "Carla Lima" como "Ausente"
    Então o status deve ser atualizado para "Ausente"
    E o sistema deve processar conforme política de no-show:
      | acao                           |
      | Debitar aula do plano          |
      | Registrar ausência no histórico|
      | Gerar direito a reposição      |

  @sucesso @registro
  Cenário: Marcar aluno como atrasado
    Quando eu marco "Diego Santos" como "Atrasado"
    E eu informo o tempo de atraso "15 minutos"
    Então o status deve ser "Atrasado (15min)"
    E a presença deve ser contabilizada

  @sucesso @registro
  Cenário: Marcar todos como presentes
    Quando eu clico em "Marcar Todos Presentes"
    Então todos os alunos devem ser marcados como "Presente"
    E eu posso ajustar individualmente depois

  @sucesso @registro
  Cenário: Salvar registro de presença
    Quando eu marco a presença de todos os alunos
    E eu clico em "Salvar Presença"
    Então o registro deve ser salvo
    E eu devo ver a mensagem "Presença registrada com sucesso!"
    E as métricas da aula devem ser atualizadas

  @sucesso @registro
  Cenário: Adicionar observação na presença
    Quando eu marco presença para "Ana Souza"
    E eu clico no ícone de observação
    E eu digito "Aluna relatou dor no ombro"
    E eu salvo
    Então a observação deve ser vinculada a este registro de presença

  # ==========================================
  # CENÁRIOS DE SUCESSO - EDIÇÃO
  # ==========================================

  @sucesso @edicao
  Cenário: Editar presença já registrada (mesmo dia)
    Dado que já registrei a presença da aula
    E ainda é o mesmo dia
    Quando eu acesso o registro de presença
    E eu altero "Bruno Costa" de "Presente" para "Ausente"
    E eu adiciono justificativa "Saiu mais cedo por mal-estar"
    E eu salvo
    Então a presença deve ser atualizada
    E o histórico de alteração deve ser registrado

  @sucesso @edicao
  Cenário: Adicionar aluno que chegou depois do registro
    Dado que já registrei a presença
    E "Elena Rocha" chegou depois
    Quando eu clico em "Adicionar Presença"
    E eu busco "Elena Rocha"
    E eu marco como "Atrasada - 20min"
    E eu salvo
    Então a presença deve ser adicionada ao registro

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar resumo de presença da aula
    Quando eu acesso a aula após registrar presença
    Então eu devo ver o resumo:
      | metrica     | valor |
      | Presentes   | 4     |
      | Ausentes    | 1     |
      | Atrasados   | 0     |
      | Taxa        | 80%   |

  @sucesso @visualizacao
  Cenário: Visualizar histórico de presença de aulas anteriores
    Quando eu acesso "Histórico de Presenças"
    E eu seleciono uma aula passada
    Então eu devo ver o registro completo de presença daquela aula

  @sucesso @visualizacao
  Cenário: Visualizar taxa de presença por período
    Quando eu acesso "Relatório de Presença"
    E eu seleciono o período "Este mês"
    Então eu devo ver a taxa de presença média das minhas aulas
    E um gráfico de evolução

  # ==========================================
  # CENÁRIOS DE SUCESSO - NOTIFICAÇÕES
  # ==========================================

  @sucesso @notificacao
  Cenário: Notificar aluno ausente
    Quando eu registro "Carla Lima" como ausente
    Então o sistema deve enviar notificação automática:
      | canal     | mensagem                                        |
      | WhatsApp  | Sentimos sua falta na aula de hoje!            |
      | Email     | Você tem direito a uma reposição até 10/02     |

  @sucesso @notificacao
  Cenário: Notificar admin sobre alta taxa de ausências
    Dado que 4 dos 5 alunos faltaram à aula
    Quando eu registro a presença
    Então o admin deve receber um alerta sobre a alta taxa de ausências

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Registrar presença antes do horário da aula
    Dado que a aula é às 18:00
    E são 16:00 agora
    Quando eu tento registrar presença
    Então eu devo ver a mensagem "A presença só pode ser registrada a partir do horário da aula"

  @erro
  Cenário: Registrar presença de aula muito antiga
    Dado que a aula foi há 5 dias e presença não foi registrada
    Quando eu tento registrar presença
    Então eu devo ver a mensagem "Prazo para registro de presença expirado (máximo 48h)"
    E eu devo ver "Contate o administrador para registro retroativo"

  @erro
  Cenário: Salvar presença sem marcar todos os alunos
    Quando eu marco presença apenas para alguns alunos
    E eu tento salvar
    Então eu devo ver a mensagem "Existem alunos sem presença marcada"
    E os alunos pendentes devem estar destacados

  @erro
  Cenário: Editar presença após prazo de edição
    Dado que registrei presença há 3 dias
    Quando eu tento editar
    Então eu devo ver a mensagem "Prazo para edição expirado"
    E eu devo ver "Solicite alteração ao administrador"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Aluno inscrito cancela no último minuto
    Dado que "Bruno Costa" cancelou 30 minutos antes da aula
    Quando eu acesso o registro de presença
    Então ele deve aparecer como "Cancelamento - não contabilizar"
    E não deve afetar a taxa de presença da aula

  @edge-case
  Cenário: Walk-in adicionado durante a aula
    Dado que adicionei "Fernando Lima" como walk-in
    Quando eu acesso o registro de presença
    Então ele deve aparecer na lista marcado automaticamente como "Presente"

  @edge-case
  Cenário: Aula cancelada após alguns alunos chegarem
    Dado que 2 alunos já chegaram
    E a aula precisa ser cancelada por motivo de força maior
    Quando eu registro "Aula Cancelada"
    Então os alunos presentes devem receber crédito extra
    E os ausentes não devem ser penalizados

  @edge-case
  Cenário: Registro de presença offline
    Dado que estou sem conexão com a internet
    Quando eu registro a presença
    Então o registro deve ser salvo localmente
    E sincronizado quando a conexão retornar

  @edge-case
  Cenário: Aluno com restrição médica falta por indicação
    Dado que "Elena Rocha" tem restrição médica ativa
    E faltou por recomendação médica
    Quando eu registro a ausência
    E eu seleciono "Ausência Justificada - Médica"
    Então a falta não deve debitar do plano
    E não deve afetar a estatística de frequência

  @edge-case
  Cenário: Presença em aula experimental
    Dado que "Novo Aluno" está em aula experimental
    Quando eu registro presença
    Então ele deve aparecer com tag "Experimental"
    E a presença deve ser registrada sem débito de plano

  @edge-case
  Cenário: Múltiplas aulas no mesmo horário (substituição)
    Dado que estou substituindo outro instrutor
    Quando eu acesso a aula para registrar presença
    Então eu devo ver indicador "Aula em substituição"
    E o registro deve funcionar normalmente

  @edge-case
  Cenário: Registro de presença via QR Code
    Dado que o studio usa check-in via QR Code
    Quando o aluno faz scan do QR Code na recepção
    Então a presença deve ser pré-registrada automaticamente
    E eu apenas confirmo no final da aula
