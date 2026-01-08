# language: pt
@client @profile
Funcionalidade: Perfil do Cliente
  Como um Cliente/Aluno do studio
  Eu quero gerenciar meu perfil
  Para manter minhas informações atualizadas e acompanhar meu progresso

  Contexto:
    Dado que estou logado como cliente "Ana Souza"
    E possuo o seguinte perfil:
      | campo             | valor                |
      | nome              | Ana Souza            |
      | email             | ana@email.com        |
      | telefone          | (11) 99999-8888      |
      | data_nascimento   | 15/05/1990           |
      | cpf               | 123.456.789-00       |
      | endereco          | Rua das Flores, 100  |

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar meu perfil
    Quando eu acesso "Meu Perfil"
    Então eu devo ver minhas informações:
      | campo             | valor                |
      | Nome              | Ana Souza            |
      | Email             | ana@email.com        |
      | Telefone          | (11) 99999-8888      |
      | Data de Nascimento| 15/05/1990           |
      | Membro desde      | Março/2023           |

  @sucesso @visualizacao
  Cenário: Visualizar informações do plano
    Quando eu acesso a aba "Meu Plano"
    Então eu devo ver:
      | informacao         | valor          |
      | Plano atual        | Mensal         |
      | Valor              | R$199,00/mês   |
      | Aulas restantes    | 5 de 8         |
      | Válido até         | 31/01/2024     |
      | Próxima renovação  | 01/02/2024     |

  @sucesso @visualizacao
  Cenário: Visualizar histórico de aulas
    Quando eu acesso a aba "Histórico"
    Então eu devo ver minhas aulas anteriores:
      | data       | aula            | instrutor    | status   |
      | 15/01      | Pilates Mat     | Maria Silva  | Presente |
      | 12/01      | Pilates Reformer| João Santos  | Presente |
      | 10/01      | Yoga Flow       | Ana Costa    | Ausente  |

  @sucesso @visualizacao
  Cenário: Visualizar histórico de pagamentos
    Quando eu acesso a aba "Pagamentos"
    Então eu devo ver meus pagamentos:
      | data       | descricao           | valor     | status |
      | 01/01/2024 | Plano Mensal - Jan  | R$199,00  | Pago   |
      | 01/12/2023 | Plano Mensal - Dez  | R$199,00  | Pago   |

  @sucesso @visualizacao
  Cenário: Visualizar estatísticas de frequência
    Quando eu acesso a aba "Estatísticas"
    Então eu devo ver:
      | metrica                | valor     |
      | Total de aulas         | 95        |
      | Taxa de presença       | 92%       |
      | Streak atual           | 12 aulas  |
      | Maior streak           | 20 aulas  |
      | Tipo favorito          | Pilates   |
      | Instrutor favorito     | Maria Silva|

  # ==========================================
  # CENÁRIOS DE SUCESSO - EDIÇÃO
  # ==========================================

  @sucesso @edicao
  Cenário: Atualizar dados pessoais
    Quando eu acesso "Meu Perfil"
    E eu clico em "Editar"
    E eu altero o campo "telefone" para "(11) 88888-7777"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Perfil atualizado com sucesso!"
    E o novo telefone deve estar exibido

  @sucesso @edicao
  Cenário: Atualizar foto de perfil
    Quando eu clico em "Alterar Foto"
    E eu faço upload de uma nova foto
    E eu ajusto o recorte
    E eu confirmo
    Então a nova foto deve ser exibida no perfil

  @sucesso @edicao
  Cenário: Atualizar endereço
    Quando eu edito meu perfil
    E eu altero o endereço para "Av. Paulista, 1000"
    E eu salvo
    Então o endereço deve ser atualizado

  @sucesso @edicao
  Cenário: Adicionar contato de emergência
    Quando eu acesso "Contato de Emergência"
    E eu preencho:
      | campo      | valor            |
      | Nome       | Maria Mãe        |
      | Telefone   | (11) 99999-7777  |
      | Parentesco | Mãe              |
    E eu salvo
    Então o contato de emergência deve ser adicionado

  # ==========================================
  # CENÁRIOS DE SUCESSO - PREFERÊNCIAS
  # ==========================================

  @sucesso @preferencias
  Cenário: Configurar preferências de notificação
    Quando eu acesso "Configurações" > "Notificações"
    E eu configuro:
      | notificacao                | email | whatsapp | push  |
      | Lembrete de aula (24h)     | Não   | Sim      | Sim   |
      | Lembrete de aula (1h)      | Não   | Sim      | Sim   |
      | Confirmação de agendamento | Sim   | Sim      | Sim   |
      | Lembrete de pagamento      | Sim   | Não      | Não   |
      | Promoções e novidades      | Não   | Não      | Não   |
    E eu salvo
    Então minhas preferências devem ser atualizadas

  @sucesso @preferencias
  Cenário: Definir preferências de aulas
    Quando eu acesso "Preferências de Aulas"
    E eu seleciono:
      | preferencia         | valor              |
      | Horário preferido   | Manhã (6h-12h)     |
      | Tipo favorito       | Pilates            |
      | Instrutor preferido | Maria Silva        |
    E eu salvo
    Então as preferências devem ser salvas
    E afetarão sugestões de aulas e lista de espera

  # ==========================================
  # CENÁRIOS DE SUCESSO - PLANO
  # ==========================================

  @sucesso @plano
  Cenário: Solicitar upgrade de plano
    Quando eu acesso "Meu Plano"
    E eu clico em "Alterar Plano"
    E eu seleciono o plano "Trimestral"
    Então eu devo ver o comparativo:
      | item                | atual   | novo       |
      | Plano               | Mensal  | Trimestral |
      | Valor               | R$199   | R$549      |
      | Aulas               | 8/mês   | 24/trim    |
      | Economia            | -       | R$48       |
    E eu posso confirmar a mudança

  @sucesso @plano
  Cenário: Pausar plano temporariamente
    Dado que o studio permite pausa de plano
    Quando eu acesso "Meu Plano"
    E eu clico em "Pausar Plano"
    E eu seleciono o período "15/01 a 15/02"
    E eu informo o motivo "Viagem"
    E eu confirmo
    Então meu plano deve ser pausado
    E o período de validade deve ser estendido

  @sucesso @plano
  Cenário: Solicitar cancelamento de plano
    Quando eu acesso "Meu Plano"
    E eu clico em "Cancelar Plano"
    Então eu devo ver informações sobre o cancelamento
    E eu devo selecionar o motivo
    E eu devo confirmar para prosseguir

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @edicao
  Cenário: Atualizar email para um já existente
    Quando eu tento alterar meu email para "outro@email.com"
    E esse email já está cadastrado
    Então eu devo ver a mensagem de erro "Este email já está em uso"

  @erro @edicao
  Cenário: Upload de foto em formato inválido
    Quando eu tento fazer upload de um arquivo .pdf como foto
    Então eu devo ver a mensagem "Formato não suportado. Use JPG, PNG ou GIF"

  @erro @edicao
  Cenário: Telefone em formato inválido
    Quando eu tento salvar telefone "123"
    Então eu devo ver a mensagem de erro "Telefone inválido"

  @erro @plano
  Cenário: Pausar plano sem permissão
    Dado que meu plano não permite pausa
    Quando eu tento pausar
    Então eu devo ver a mensagem "Seu plano atual não permite pausas"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Solicitar exclusão de dados (LGPD)
    Quando eu acesso "Privacidade"
    E eu clico em "Solicitar Exclusão de Dados"
    E eu confirmo com minha senha
    Então a solicitação deve ser registrada
    E eu devo receber instruções sobre o processo

  @edge-case
  Cenário: Exportar meus dados (LGPD)
    Quando eu acesso "Privacidade"
    E eu clico em "Exportar Meus Dados"
    Então um arquivo deve ser gerado com todos os meus dados pessoais em formato legível

  @edge-case
  Cenário: Visualizar conquistas/badges
    Quando eu acesso "Conquistas"
    Então eu devo ver meus badges:
      | badge              | descricao                  | data       |
      | Primeira Aula      | Completou primeira aula    | 10/03/2023 |
      | 50 Aulas           | Completou 50 aulas         | 15/08/2023 |
      | Streak 10          | 10 aulas consecutivas      | 01/01/2024 |

  @edge-case
  Cenário: Perfil com informações incompletas
    Dado que não preenchei meu endereço
    Quando eu acesso o perfil
    Então eu devo ver um indicador de "Perfil incompleto"
    E sugestão para completar os dados

  @edge-case
  Cenário: Alterar email com verificação
    Quando eu altero meu email para "novoemail@email.com"
    E eu salvo
    Então um email de verificação deve ser enviado para o novo endereço
    E o email só será atualizado após confirmação

  @edge-case
  Cenário: Histórico de alterações de plano
    Quando eu acesso "Histórico de Planos"
    Então eu devo ver todas as mudanças de plano:
      | data       | plano_anterior | plano_novo  | motivo    |
      | 01/01/2024 | Trimestral     | Mensal      | Downgrade |
      | 01/10/2023 | Mensal         | Trimestral  | Upgrade   |
