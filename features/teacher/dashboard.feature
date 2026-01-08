# language: pt
@teacher @dashboard
Funcionalidade: Dashboard do Instrutor
  Como um Instrutor/Professor do studio
  Eu quero visualizar meu dashboard
  Para ter uma visão geral das minhas atividades e aulas

  Contexto:
    Dado que estou logado como instrutor
    E meu nome é "Maria Silva"
    E tenho as seguintes métricas no mês atual:
      | metrica               | valor |
      | aulas_completadas     | 38    |
      | total_aulas_agendadas | 45    |
      | alunos_atendidos      | 120   |
      | taxa_presenca_media   | 92%   |
      | horas_trabalhadas     | 57    |
      | reposicoes_pendentes  | 3     |

  # ==========================================
  # CENÁRIOS DE SUCESSO
  # ==========================================

  @sucesso
  Cenário: Visualizar métricas principais do dashboard
    Quando eu acesso o dashboard do instrutor
    Então eu devo ver a métrica "Aulas Completadas" com valor "38"
    E eu devo ver a métrica "Total Agendadas" com valor "45"
    E eu devo ver a métrica "Alunos Atendidos" com valor "120"
    E eu devo ver a métrica "Taxa de Presença" com valor "92%"
    E eu devo ver a métrica "Horas Trabalhadas" com valor "57h"

  @sucesso
  Cenário: Visualizar agenda do dia
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Aulas de Hoje"
    E eu devo ver a lista de minhas aulas do dia:
      | horario | aula             | sala   | inscritos |
      | 07:00   | Pilates Mat      | Sala 1 | 8/10      |
      | 09:00   | Pilates Reformer | Sala 2 | 6/6       |
      | 18:00   | Yoga Flow        | Sala 1 | 12/15     |

  @sucesso
  Cenário: Visualizar próximas aulas da semana
    Quando eu acesso o dashboard
    E eu acesso a seção "Próximas Aulas"
    Então eu devo ver as aulas dos próximos 7 dias com data, horário, tipo de aula e número de inscritos

  @sucesso
  Cenário: Visualizar distribuição semanal de aulas
    Quando eu acesso o dashboard
    Então eu devo ver o gráfico de distribuição semanal mostrando quantas aulas tenho em cada dia da semana

  @sucesso
  Cenário: Visualizar breakdown por tipo de aula
    Quando eu acesso o dashboard
    Então eu devo ver a distribuição por tipo de aula:
      | tipo             | quantidade | percentual |
      | Pilates Mat      | 20         | 44%        |
      | Pilates Reformer | 15         | 33%        |
      | Yoga Flow        | 10         | 23%        |

  @sucesso
  Cenário: Visualizar alunos com reposição pendente
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Reposições Pendentes"
    E eu devo ver a lista de alunos aguardando reposição:
      | aluno         | aula_original | data_falta |
      | Ana Souza     | Pilates Mat   | 10/01      |
      | Bruno Costa   | Yoga Flow     | 12/01      |

  @sucesso
  Cenário: Visualizar notificações importantes
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Notificações" com alertas sobre:
      | tipo              | mensagem                                  |
      | Cancelamento      | Aula de amanhã às 18h foi cancelada       |
      | Substituição      | Você foi designado para aula das 10h      |
      | Reposição         | 3 alunos aguardam agendamento de reposição|

  @sucesso
  Cenário: Acessar atalhos rápidos
    Quando eu acesso o dashboard
    Então eu devo ver os atalhos rápidos:
      | atalho                    |
      | Ver Minhas Aulas          |
      | Registrar Presença        |
      | Agendar Reposição         |
      | Ver Meus Alunos           |

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Dashboard sem dados históricos
    Dado que sou um instrutor novo sem aulas ministradas
    Quando eu acesso o dashboard
    Então eu devo ver a mensagem "Bem-vindo! Suas métricas aparecerão após suas primeiras aulas."
    E eu devo ver sugestões de próximos passos

  @erro
  Cenário: Acesso negado para usuário não-instrutor
    Dado que estou logado como cliente
    Quando eu tento acessar "/teacher"
    Então eu devo ser redirecionado para "/dashboard"
    E eu devo ver a mensagem "Acesso não autorizado"

  @erro
  Cenário: Erro ao carregar dados do dashboard
    Dado que há um erro de conexão com o servidor
    Quando eu acesso o dashboard
    Então eu devo ver a mensagem "Erro ao carregar dados. Tente novamente."
    E eu devo ver um botão "Tentar novamente"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Dashboard em dia sem aulas
    Dado que hoje é domingo e não tenho aulas
    Quando eu acesso o dashboard
    Então a seção "Aulas de Hoje" deve mostrar "Nenhuma aula agendada para hoje"
    E eu devo ver as próximas aulas da semana

  @edge-case
  Cenário: Visualizar dashboard em dispositivo móvel
    Dado que estou acessando via smartphone
    Quando eu acesso o dashboard
    Então o layout deve ser responsivo
    E as métricas principais devem estar visíveis primeiro

  @edge-case
  Cenário: Atualização em tempo real do dashboard
    Dado que estou visualizando o dashboard
    Quando um aluno cancela inscrição em uma das minhas aulas
    Então o número de inscritos deve ser atualizado automaticamente
    E eu devo receber uma notificação

  @edge-case
  Cenário: Instrutor com múltiplas especialidades
    Dado que sou instrutor de Pilates, Yoga e Funcional
    Quando eu acesso o dashboard
    Então eu devo ver o breakdown por todas as especialidades
    E poder filtrar por tipo de aula

  @edge-case
  Cenário: Comparativo com período anterior
    Quando eu clico em "Ver Comparativo"
    Então eu devo ver minhas métricas comparadas com o mês anterior:
      | metrica           | atual | anterior | variacao |
      | Aulas completadas | 38    | 35       | +8.5%    |
      | Taxa de presença  | 92%   | 89%      | +3%      |

  @edge-case
  Cenário: Dashboard durante férias programadas
    Dado que estou em período de férias configurado
    Quando eu acesso o dashboard
    Então eu devo ver um banner "Você está em período de férias"
    E as métricas do período devem estar zeradas normalmente
