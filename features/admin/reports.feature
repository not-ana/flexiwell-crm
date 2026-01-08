# language: pt
@admin @reports
Funcionalidade: Relatórios e Analytics
  Como um Admin/Owner do studio
  Eu quero acessar relatórios e análises do meu negócio
  Para tomar decisões baseadas em dados

  Contexto:
    Dado que estou logado como admin
    E existem dados históricos de pelo menos 12 meses
    E o período atual é Janeiro/2024

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS FINANCEIROS
  # ==========================================

  @sucesso @financeiro
  Cenário: Visualizar relatório de receita mensal
    Quando eu acesso "Relatórios" > "Financeiro"
    E eu seleciono o período "Este mês"
    Então eu devo ver:
      | metrica              | valor       |
      | Receita total        | R$15.000,00 |
      | Ticket médio         | R$200,00    |
      | Pagamentos recebidos | 75          |
      | Inadimplência        | 5%          |

  @sucesso @financeiro
  Cenário: Comparar receita entre períodos
    Quando eu acesso o relatório financeiro
    E eu seleciono "Comparar com período anterior"
    E eu seleciono "Mesmo mês ano anterior"
    Então eu devo ver o gráfico comparativo
    E os indicadores de crescimento/queda

  @sucesso @financeiro
  Cenário: Visualizar receita por tipo de plano
    Quando eu acesso o relatório financeiro
    E eu visualizo "Receita por Plano"
    Então eu devo ver a distribuição:
      | plano      | receita     | percentual |
      | Mensal     | R$8.000,00  | 53%        |
      | Trimestral | R$4.000,00  | 27%        |
      | Anual      | R$2.500,00  | 17%        |
      | Avulso     | R$500,00    | 3%         |

  @sucesso @financeiro
  Cenário: Projeção de receita futura
    Quando eu acesso "Projeções"
    Então eu devo ver a projeção para os próximos 3 meses baseada em:
      | fator                    |
      | Recorrências ativas      |
      | Taxa de renovação média  |
      | Sazonalidade histórica   |

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS DE CLIENTES
  # ==========================================

  @sucesso @clientes
  Cenário: Visualizar relatório de aquisição de clientes
    Quando eu acesso "Relatórios" > "Clientes"
    Então eu devo ver:
      | metrica              | valor |
      | Novos clientes       | 15    |
      | Clientes perdidos    | 3     |
      | Taxa de churn        | 2%    |
      | Taxa de retenção     | 92%   |
      | LTV médio            | R$2.400|

  @sucesso @clientes
  Cenário: Análise de cohort de clientes
    Quando eu acesso "Análise de Cohort"
    Então eu devo ver a tabela de retenção por mês de entrada:
      | cohort   | m1   | m2   | m3   | m6   | m12  |
      | Jan/23   | 100% | 85%  | 78%  | 65%  | 52%  |
      | Fev/23   | 100% | 88%  | 80%  | 68%  | -    |
      | Mar/23   | 100% | 82%  | 75%  | -    | -    |

  @sucesso @clientes
  Cenário: Visualizar funil de conversão
    Quando eu acesso "Funil de Conversão"
    Então eu devo ver as etapas:
      | etapa              | quantidade | conversao |
      | Visitantes site    | 1000       | 100%      |
      | Leads capturados   | 150        | 15%       |
      | Aulas experimentais| 50         | 33%       |
      | Matrículas         | 25         | 50%       |

  @sucesso @clientes
  Cenário: Identificar clientes em risco de churn
    Quando eu acesso "Clientes em Risco"
    Então eu devo ver a lista de clientes com sinais de risco:
      | cliente       | ultimo_comparecimento | sinais                    |
      | Ana Silva     | Há 15 dias            | Frequência caindo         |
      | Bruno Costa   | Há 20 dias            | Cancelamentos recorrentes |

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS DE AULAS
  # ==========================================

  @sucesso @aulas
  Cenário: Visualizar taxa de ocupação das aulas
    Quando eu acesso "Relatórios" > "Aulas"
    Então eu devo ver a taxa de ocupação:
      | tipo_aula        | ocupacao | media_inscritos |
      | Pilates Reformer | 95%      | 5.7/6           |
      | Pilates Mat      | 82%      | 8.2/10          |
      | Yoga Flow        | 75%      | 11.2/15         |

  @sucesso @aulas
  Cenário: Visualizar horários mais populares
    Quando eu acesso "Análise de Horários"
    Então eu devo ver o mapa de calor de ocupação por dia/hora
    E os horários de pico devem estar destacados

  @sucesso @aulas
  Cenário: Taxa de no-show por tipo de aula
    Quando eu acesso "Relatório de Presença"
    Então eu devo ver:
      | tipo_aula        | presenca | no_show | cancelamentos |
      | Pilates Reformer | 92%      | 5%      | 3%            |
      | Pilates Mat      | 85%      | 10%     | 5%            |
      | Yoga Flow        | 88%      | 7%      | 5%            |

  @sucesso @aulas
  Cenário: Análise de sazonalidade
    Quando eu acesso "Sazonalidade"
    Então eu devo ver o gráfico de ocupação por mês identificando períodos de alta e baixa demanda

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS DE EQUIPE
  # ==========================================

  @sucesso @equipe
  Cenário: Visualizar performance dos instrutores
    Quando eu acesso "Relatórios" > "Equipe"
    Então eu devo ver a performance de cada instrutor:
      | instrutor    | aulas_mes | ocupacao | avaliacao | retenção_alunos |
      | Maria Silva  | 40        | 92%      | 4.8       | 95%             |
      | João Santos  | 35        | 85%      | 4.5       | 88%             |

  @sucesso @equipe
  Cenário: Ranking de instrutores
    Quando eu acesso "Ranking de Instrutores"
    E eu seleciono o critério "Avaliação dos Alunos"
    Então eu devo ver o ranking ordenado por avaliação

  @sucesso @equipe
  Cenário: Carga horária dos instrutores
    Quando eu acesso "Carga Horária"
    Então eu devo ver as horas trabalhadas por instrutor
    E comparativo com meta/contrato

  # ==========================================
  # CENÁRIOS DE SUCESSO - EXPORTAÇÃO
  # ==========================================

  @sucesso @exportacao
  Cenário: Exportar relatório em PDF
    Quando eu estou visualizando um relatório
    E eu clico em "Exportar" > "PDF"
    Então o relatório deve ser gerado em PDF com gráficos e tabelas formatados

  @sucesso @exportacao
  Cenário: Exportar dados em Excel
    Quando eu clico em "Exportar" > "Excel"
    Então o arquivo Excel deve ser gerado com todos os dados brutos disponíveis

  @sucesso @exportacao
  Cenário: Agendar envio automático de relatório
    Quando eu clico em "Agendar Relatório"
    E eu configuro:
      | campo      | valor                |
      | frequencia | Semanal              |
      | dia        | Segunda-feira        |
      | hora       | 08:00                |
      | formato    | PDF                  |
      | emails     | admin@studio.com     |
    E eu clico em "Salvar"
    Então o relatório será enviado automaticamente

  # ==========================================
  # CENÁRIOS DE SUCESSO - RELATÓRIOS CUSTOMIZADOS
  # ==========================================

  @sucesso @customizado
  Cenário: Criar relatório customizado
    Quando eu acesso "Relatórios Customizados"
    E eu clico em "Novo Relatório"
    E eu seleciono as métricas:
      | metrica               |
      | Receita mensal        |
      | Novos clientes        |
      | Taxa de ocupação      |
      | NPS                   |
    E eu defino os filtros e agrupamentos
    E eu salvo o relatório como "Meu Dashboard Mensal"
    Então o relatório customizado deve ser salvo
    E deve aparecer nos meus relatórios salvos

  @sucesso @customizado
  Cenário: Editar relatório customizado
    Dado que tenho um relatório customizado salvo
    Quando eu edito e adiciono novas métricas
    E eu salvo
    Então as alterações devem ser aplicadas

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Período sem dados disponíveis
    Quando eu seleciono um período futuro
    Então eu devo ver a mensagem "Não há dados disponíveis para este período"

  @erro
  Cenário: Exportação de relatório muito grande
    Quando eu tento exportar um relatório com dados de 5 anos
    Então eu devo ver a mensagem "Período muito extenso. Selecione no máximo 2 anos."

  @erro
  Cenário: Filtros incompatíveis
    Quando eu aplico filtros que não retornam dados
    Então eu devo ver "Nenhum dado encontrado com os filtros aplicados"
    E eu devo poder limpar os filtros

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Relatório com dados de múltiplos estabelecimentos
    Dado que tenho 3 estabelecimentos
    Quando eu acesso os relatórios
    Então eu devo poder filtrar por estabelecimento ou ver dados consolidados de todos

  @edge-case
  Cenário: Primeiro mês de operação (dados limitados)
    Dado que o studio abriu há 2 semanas
    Quando eu acesso os relatórios
    Então eu devo ver os dados disponíveis
    E mensagens informativas sobre dados limitados
    E projeções devem estar indisponíveis

  @edge-case
  Cenário: Comparação com período inexistente
    Dado que o studio abriu em Junho/2023
    Quando eu tento comparar Janeiro/2024 com Janeiro/2023
    Então eu devo ver "Dados não disponíveis para Janeiro/2023"
    E sugerir comparação com outro período

  @edge-case
  Cenário: Anomalia nos dados
    Dado que houve um pico anormal de cancelamentos em um dia
    Quando eu visualizo o relatório
    Então o sistema deve sinalizar a anomalia
    E permitir adicionar nota explicativa

  @edge-case
  Cenário: Relatório em tempo real
    Quando eu acesso o dashboard em tempo real
    Então os dados devem atualizar a cada 30 segundos
    E eu devo ver indicador de "última atualização"

  @edge-case
  Cenário: Drill-down nos dados
    Quando eu clico em uma barra do gráfico de receita mensal
    Então eu devo ver o detalhamento dia a dia
    E poder fazer drill-down até transações individuais

  @edge-case
  Cenário: Meta vs Realizado
    Dado que defini metas para o período
    Quando eu acesso os relatórios
    Então eu devo ver comparativo meta vs realizado com indicadores visuais de atingimento
