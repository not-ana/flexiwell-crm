# language: pt
@auth @password
Funcionalidade: Gerenciamento de Senha
  Como um usuário do sistema
  Eu quero gerenciar minha senha
  Para manter minha conta segura

  # ==========================================
  # ESQUECI MINHA SENHA
  # ==========================================

  @sucesso @forgot-password
  Cenário: Solicitar recuperação de senha com email válido
    Dado que estou na página "Esqueci minha senha"
    Quando eu preencho o campo "email" com "cliente@email.com"
    E eu clico no botão "Enviar link de recuperação"
    Então eu devo ver a mensagem "Se este email estiver cadastrado, você receberá um link de recuperação."
    E um email com link de recuperação deve ser enviado para "cliente@email.com"
    E o link deve expirar em 1 hora

  @sucesso @forgot-password
  Cenário: Redefinir senha com link válido
    Dado que recebi um link de recuperação de senha válido
    Quando eu acesso o link de recuperação
    E eu preencho o campo "nova_senha" com "NovaSenha123!"
    E eu preencho o campo "confirmar_senha" com "NovaSenha123!"
    E eu clico no botão "Redefinir Senha"
    Então eu devo ver a mensagem "Senha alterada com sucesso!"
    E eu devo ser redirecionado para "/login"
    E um email de confirmação deve ser enviado

  @erro @forgot-password
  Cenário: Solicitar recuperação com email não cadastrado
    Dado que estou na página "Esqueci minha senha"
    Quando eu preencho o campo "email" com "naoexiste@email.com"
    E eu clico no botão "Enviar link de recuperação"
    Então eu devo ver a mensagem "Se este email estiver cadastrado, você receberá um link de recuperação."
    E nenhum email deve ser enviado

  @erro @forgot-password
  Cenário: Usar link de recuperação expirado
    Dado que recebi um link de recuperação há mais de 1 hora
    Quando eu acesso o link de recuperação
    Então eu devo ver a mensagem "Link de recuperação expirado. Solicite um novo."
    E eu devo ver um botão "Solicitar novo link"

  @erro @forgot-password
  Cenário: Usar link de recuperação já utilizado
    Dado que recebi um link de recuperação de senha válido
    E já utilizei o link para redefinir minha senha
    Quando eu acesso o link novamente
    Então eu devo ver a mensagem "Este link já foi utilizado."

  # ==========================================
  # ALTERAR SENHA (LOGADO)
  # ==========================================

  @sucesso @change-password @admin
  Cenário: Admin altera sua própria senha
    Dado que estou logado como admin
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho o campo "senha_atual" com "Admin123!"
    E eu preencho o campo "nova_senha" com "NovaAdmin123!"
    E eu preencho o campo "confirmar_senha" com "NovaAdmin123!"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Senha alterada com sucesso!"
    E um email de confirmação deve ser enviado

  @sucesso @change-password @teacher
  Cenário: Professor altera sua própria senha
    Dado que estou logado como professor
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho os campos de alteração de senha corretamente
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Senha alterada com sucesso!"

  @sucesso @change-password @client
  Cenário: Cliente altera sua própria senha
    Dado que estou logado como cliente
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho os campos de alteração de senha corretamente
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Senha alterada com sucesso!"

  @erro @change-password
  Cenário: Alterar senha com senha atual incorreta
    Dado que estou logado como cliente
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho o campo "senha_atual" com "SenhaErrada123!"
    E eu preencho o campo "nova_senha" com "NovaSenha123!"
    E eu preencho o campo "confirmar_senha" com "NovaSenha123!"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "Senha atual incorreta"

  @erro @change-password
  Cenário: Alterar para a mesma senha atual
    Dado que estou logado como cliente
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho o campo "senha_atual" com "Client123!"
    E eu preencho o campo "nova_senha" com "Client123!"
    E eu preencho o campo "confirmar_senha" com "Client123!"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "A nova senha deve ser diferente da atual"

  @erro @change-password
  Cenário: Nova senha não atende requisitos mínimos
    Dado que estou logado como cliente
    E estou na página de configurações
    Quando eu clico em "Alterar Senha"
    E eu preencho o campo "senha_atual" com "Client123!"
    E eu preencho o campo "nova_senha" com "fraca"
    E eu preencho o campo "confirmar_senha" com "fraca"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case @forgot-password
  Cenário: Múltiplas solicitações de recuperação
    Dado que estou na página "Esqueci minha senha"
    Quando eu solicito recuperação de senha 3 vezes em 5 minutos
    Então eu devo ver a mensagem "Muitas solicitações. Aguarde 15 minutos antes de tentar novamente."

  @edge-case @forgot-password
  Cenário: Link de recuperação com token manipulado
    Dado que recebi um link de recuperação válido
    Quando eu modifico o token no link
    E eu acesso o link modificado
    Então eu devo ver a mensagem "Link de recuperação inválido"

  @edge-case @change-password
  Cenário: Sessão expira durante alteração de senha
    Dado que estou logado como cliente
    E minha sessão expirou
    Quando eu tento alterar minha senha
    Então eu devo ser redirecionado para "/login"
    E eu devo ver a mensagem "Sessão expirada. Faça login novamente."

  @edge-case @change-password
  Cenário: Alteração de senha em múltiplos dispositivos
    Dado que estou logado como cliente em dois dispositivos
    Quando eu altero minha senha no dispositivo 1
    Então a sessão no dispositivo 2 deve ser encerrada
    E eu devo fazer login novamente no dispositivo 2

  @edge-case
  Cenário: Recuperação de senha para conta inativa
    Dado que minha conta está inativa
    Quando eu solicito recuperação de senha
    Então eu devo receber o email de recuperação
    E após redefinir a senha, devo entrar em contato com suporte para reativar

  @edge-case @brute-force
  Cenário: Proteção contra brute force na recuperação
    Dado que estou na página de redefinição de senha
    Quando eu tento 10 senhas incorretas no campo "nova_senha"
    Então o formulário deve ser bloqueado temporariamente
    E eu devo ver a mensagem "Muitas tentativas. Aguarde 15 minutos."

  @edge-case
  Cenário: Email de recuperação vai para pasta de spam
    Dado que solicitei recuperação de senha
    E o email foi para pasta de spam
    Quando eu clico em "Reenviar email"
    Então um novo email deve ser enviado
    E o link anterior deve ser invalidado
