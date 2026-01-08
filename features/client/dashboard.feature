# language: pt
@client @dashboard
Funcionalidade: Dashboard do Cliente
  Como um Cliente/Aluno do studio
  Eu quero visualizar meu dashboard
  Para ter uma visão geral do meu plano, aulas e progresso

  Contexto:
    Dado que estou logado como cliente "Ana Souza"
    E possuo o seguinte plano:
      | campo           | valor          |
      | tipo            | Mensal         |
      | valor           | R$199,00       |
      | aulas_mes       | 8              |
      | aulas_restantes | 5              |
      | aulas_usadas    | 3              |
      | data_inicio     | 01/01/2024     |
      | data_fim        | 31/01/2024     |
    E tenho os seguintes dados:
      | metrica              | valor        |
      | membro_desde         | Março/2023   |
      | total_aulas          | 95           |
      | streak_atual         | 12 aulas     |
      | instrutor_favorito   | Maria Silva  |
      | proximo_pagamento    | 01/02/2024   |

  # ==========================================
  # CENÁRIOS DE SUCESSO
  # ==========================================

  @sucesso
  Cenário: Visualizar informações do plano
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Meu Plano" com:
      | informacao       | valor      |
      | Plano            | Mensal     |
      | Aulas restantes  | 5          |
      | Aulas usadas     | 3          |
      | Validade até     | 31/01/2024 |

  @sucesso
  Cenário: Visualizar indicador visual de aulas restantes
    Quando eu acesso o dashboard
    Então eu devo ver um indicador circular mostrando 5/8 aulas
    E a barra de progresso deve estar em 62.5%

  @sucesso
  Cenário: Visualizar métricas de engajamento
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Meu Progresso" com:
      | metrica            | valor      |
      | Total de aulas     | 95         |
      | Streak atual       | 12 aulas   |
      | Membro desde       | Março/2023 |

  @sucesso
  Cenário: Visualizar próximas aulas agendadas
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Minhas Próximas Aulas":
      | data       | horario | aula             | instrutor    |
      | 16/01      | 07:00   | Pilates Mat      | Maria Silva  |
      | 18/01      | 09:00   | Pilates Reformer | João Santos  |

  @sucesso
  Cenário: Visualizar instrutor favorito
    Quando eu acesso o dashboard
    Então eu devo ver "Instrutor Favorito: Maria Silva" com base nas aulas que mais frequentei

  @sucesso
  Cenário: Visualizar próximo pagamento
    Quando eu acesso o dashboard
    Então eu devo ver a seção "Pagamento":
      | informacao        | valor       |
      | Próximo pagamento | 01/02/2024  |
      | Valor             | R$199,00    |
      | Status            | Pendente    |

  @sucesso
  Cenário: Acessar atalhos rápidos
    Quando eu acesso o dashboard
    Então eu devo ver os atalhos:
      | atalho              |
      | Agendar Aula        |
      | Minhas Aulas        |
      | Meu Perfil          |
      | Suporte             |

  @sucesso
  Cenário: Visualizar notificações importantes
    Quando eu acesso o dashboard
    Então eu devo ver notificações relevantes:
      | tipo               | mensagem                           |
      | Lembrete           | Sua aula de amanhã às 07:00        |
      | Plano              | Restam apenas 5 aulas no seu plano |
      | Pagamento          | Pagamento vence em 15 dias         |

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Dashboard sem dados de aulas
    Dado que sou um cliente novo sem aulas agendadas
    Quando eu acesso o dashboard
    Então eu devo ver "Nenhuma aula agendada"
    E um botão "Agendar sua primeira aula"

  @erro
  Cenário: Acesso negado para usuário não-cliente
    Dado que estou logado como admin
    Quando eu tento acessar "/dashboard"
    Então eu devo ser redirecionado para "/admin"

  @erro
  Cenário: Erro ao carregar dados
    Dado que há um erro de conexão
    Quando eu acesso o dashboard
    Então eu devo ver "Erro ao carregar dados"
    E um botão "Tentar novamente"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Plano com poucas aulas restantes
    Dado que tenho apenas 1 aula restante
    Quando eu acesso o dashboard
    Então eu devo ver um alerta destacado "Última aula disponível!"
    E uma sugestão de renovação

  @edge-case
  Cenário: Plano expirado
    Dado que meu plano expirou ontem
    Quando eu acesso o dashboard
    Então eu devo ver um banner "Seu plano expirou"
    E um botão "Renovar Agora"
    E as funcionalidades de agendamento devem estar bloqueadas

  @edge-case
  Cenário: Pagamento atrasado
    Dado que meu pagamento está atrasado há 5 dias
    Quando eu acesso o dashboard
    Então eu devo ver um alerta de pagamento pendente
    E um botão "Regularizar Pagamento"

  @edge-case
  Cenário: Plano ilimitado
    Dado que possuo plano "Ilimitado"
    Quando eu acesso o dashboard
    Então eu devo ver "Aulas Ilimitadas"
    E não deve haver contador de aulas restantes

  @edge-case
  Cenário: Streak de aulas quebrado
    Dado que quebrei meu streak de frequência
    Quando eu acesso o dashboard
    Então eu devo ver "Streak: Reiniciado"
    E uma mensagem motivacional "Comece uma nova sequência!"

  @edge-case
  Cenário: Novo badge/conquista desbloqueado
    Dado que completei 100 aulas
    Quando eu acesso o dashboard
    Então eu devo ver uma notificação de conquista "Parabéns! Você completou 100 aulas!"
    E um badge especial deve aparecer no perfil

  @edge-case
  Cenário: Dashboard em dispositivo móvel
    Dado que estou acessando via smartphone
    Quando eu acesso o dashboard
    Então o layout deve ser responsivo
    E as informações principais devem estar visíveis primeiro

  @edge-case
  Cenário: Reposição pendente
    Dado que tenho 2 reposições pendentes
    Quando eu acesso o dashboard
    Então eu devo ver um card "Reposições Disponíveis: 2"
    E um link para agendar as reposições
