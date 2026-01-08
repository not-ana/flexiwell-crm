# language: pt
@admin @dashboard
Funcionalidade: Dashboard do Administrador
  Como um Admin/Owner do studio
  Eu quero visualizar o dashboard administrativo
  Para ter uma visão geral do meu negócio

  Contexto:
    Dado que estou logado como admin
    E o studio possui os seguintes dados:
      | metrica              | valor_atual | valor_anterior |
      | receita_mensal       | R$15.000    | R$12.000       |
      | clientes_ativos      | 150         | 120            |
      | aulas_agendadas      | 200         | 180            |
      | taxa_presenca        | 85%         | 80%            |

  # ==========================================
  # CENÁRIOS DE SUCESSO
  # ==========================================

  @sucesso
  Cenário: Visualizar métricas principais do dashboard
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a métrica "Receita Mensal" com valor "R$15.000"
    E eu devo ver o indicador de crescimento "+25%" em relação ao mês anterior
    E eu devo ver a métrica "Clientes Ativos" com valor "150"
    E eu devo ver a métrica "Aulas Agendadas" com valor "200"
    E eu devo ver a métrica "Taxa de Presença" com valor "85%"

  @sucesso
  Cenário: Visualizar comparativo com período anterior
    Quando eu acesso o dashboard administrativo
    E eu seleciono a comparação "Mesmo período ano anterior"
    Então eu devo ver os valores atuais comparados com o mesmo período do ano passado
    E os indicadores de crescimento devem ser atualizados

  @sucesso
  Cenário: Visualizar gráfico de receita mensal
    Quando eu acesso o dashboard administrativo
    Então eu devo ver o gráfico de receita dos últimos 12 meses
    E o mês atual deve estar destacado
    E eu devo poder passar o mouse para ver valores detalhados

  @sucesso
  Cenário: Visualizar aquisição de clientes
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a seção "Aquisição de Clientes"
    E eu devo ver o gráfico de novos clientes por mês
    E eu devo ver a taxa de retenção

  @sucesso
  Cenário: Visualizar agenda do dia
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a seção "Aulas de Hoje"
    E eu devo ver a lista de aulas agendadas para o dia com os seguintes dados:
      | horario | aula           | professor    | inscritos |
      | 07:00   | Pilates Mat    | Maria Silva  | 8/10      |
      | 09:00   | Yoga Flow      | João Santos  | 12/15     |
      | 18:00   | Pilates Ref.   | Ana Costa    | 6/8       |

  @sucesso
  Cenário: Visualizar destaques mensais
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a seção "Destaques do Mês"
    E eu devo ver os seguintes indicadores:
      | indicador         | valor |
      | Novos clientes    | 15    |
      | Taxa de retenção  | 92%   |
      | Crescimento       | +25%  |

  @sucesso
  Cenário: Filtrar dashboard por período
    Quando eu acesso o dashboard administrativo
    E eu seleciono o período "Últimos 30 dias"
    Então todas as métricas devem ser atualizadas para o período selecionado
    E os gráficos devem refletir o novo período

  @sucesso
  Cenário: Visualizar performance dos instrutores
    Quando eu acesso o dashboard administrativo
    E eu acesso a seção "Performance da Equipe"
    Então eu devo ver a lista de instrutores com suas métricas:
      | instrutor    | aulas_mes | taxa_presenca | avaliacao |
      | Maria Silva  | 40        | 92%           | 4.8       |
      | João Santos  | 35        | 88%           | 4.6       |

  @sucesso
  Cenário: Exportar relatório do dashboard
    Quando eu acesso o dashboard administrativo
    E eu clico em "Exportar Relatório"
    E eu seleciono o formato "PDF"
    Então um arquivo PDF deve ser gerado com todas as métricas
    E o arquivo deve ser baixado automaticamente

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Dashboard sem dados históricos
    Dado que o studio foi criado hoje
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a mensagem "Ainda não há dados suficientes para exibir métricas"
    E eu devo ver sugestões de próximos passos

  @erro
  Cenário: Erro ao carregar métricas
    Dado que há um erro de conexão com o banco de dados
    Quando eu acesso o dashboard administrativo
    Então eu devo ver a mensagem "Erro ao carregar dados. Tente novamente."
    E eu devo ver um botão "Tentar novamente"

  @erro
  Cenário: Acesso negado para usuário não-admin
    Dado que estou logado como professor
    Quando eu tento acessar "/admin"
    Então eu devo ser redirecionado para "/teacher"
    E eu devo ver a mensagem "Acesso não autorizado"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Dashboard com valores zerados
    Dado que não houve nenhuma atividade no período
    Quando eu acesso o dashboard administrativo
    Então todas as métricas devem exibir "0" ou "R$0,00"
    E os indicadores de crescimento devem mostrar "0%"

  @edge-case
  Cenário: Dashboard com crescimento negativo
    Dado que a receita atual é menor que o período anterior
    Quando eu acesso o dashboard administrativo
    Então o indicador de crescimento deve mostrar "-15%" em vermelho
    E deve haver um ícone de seta para baixo

  @edge-case
  Cenário: Visualizar dashboard em diferentes fusos horários
    Dado que meu fuso horário é diferente do servidor
    Quando eu acesso o dashboard administrativo
    Então as datas e horários devem ser exibidos no meu fuso horário local

  @edge-case
  Cenário: Atualização automática do dashboard
    Dado que estou visualizando o dashboard
    Quando uma nova reserva é feita por um cliente
    Então o contador de "Aulas Agendadas" deve ser atualizado automaticamente sem necessidade de recarregar a página

  @edge-case
  Cenário: Dashboard em dispositivo móvel
    Dado que estou acessando via dispositivo móvel
    Quando eu acesso o dashboard administrativo
    Então o layout deve ser responsivo
    E os gráficos devem ser exibidos em formato adequado para mobile

  @edge-case
  Cenário: Múltiplos estabelecimentos
    Dado que o admin possui 3 estabelecimentos
    Quando eu acesso o dashboard administrativo
    Então eu devo ver um seletor de estabelecimento
    E as métricas devem refletir o estabelecimento selecionado ou mostrar consolidado de todos

  @edge-case
  Cenário: Cache de dados do dashboard
    Dado que acessei o dashboard há menos de 5 minutos
    Quando eu acesso o dashboard novamente
    Então os dados devem ser carregados do cache
    E um indicador de "última atualização" deve ser exibido
