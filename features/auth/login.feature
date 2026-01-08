# language: pt
@auth @login
Funcionalidade: Login de Usuários
  Como um usuário do sistema FlexiWell
  Eu quero fazer login na plataforma
  Para acessar as funcionalidades de acordo com meu perfil

  Contexto:
    Dado que estou na página de login
    E o sistema possui os seguintes usuários cadastrados:
      | email                    | senha       | role    | status |
      | admin@studio.com         | Admin123!   | admin   | active |
      | teacher@studio.com       | Teacher123! | teacher | active |
      | client@studio.com        | Client123!  | client  | active |
      | inactive@studio.com      | Inactive1!  | client  | inactive |

  # ==========================================
  # CENÁRIOS DE SUCESSO
  # ==========================================

  @sucesso @admin
  Cenário: Login bem-sucedido como Admin/Owner
    Quando eu preencho o campo "email" com "admin@studio.com"
    E eu preencho o campo "senha" com "Admin123!"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para "/admin"
    E eu devo ver o dashboard de administrador
    E o token de acesso deve ser armazenado
    E o token de refresh deve ser armazenado

  @sucesso @teacher
  Cenário: Login bem-sucedido como Teacher/Instructor
    Quando eu preencho o campo "email" com "teacher@studio.com"
    E eu preencho o campo "senha" com "Teacher123!"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para "/teacher"
    E eu devo ver o dashboard de professor
    E o token de acesso deve ser armazenado

  @sucesso @client
  Cenário: Login bem-sucedido como Client/Student
    Quando eu preencho o campo "email" com "client@studio.com"
    E eu preencho o campo "senha" com "Client123!"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para "/dashboard"
    E eu devo ver o dashboard de cliente
    E o token de acesso deve ser armazenado

  @sucesso
  Cenário: Manter sessão ativa com "Lembrar-me"
    Quando eu preencho o campo "email" com "client@studio.com"
    E eu preencho o campo "senha" com "Client123!"
    E eu marco a opção "Lembrar-me"
    E eu clico no botão "Entrar"
    Então o refresh token deve ter validade de 30 dias

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Login com email não cadastrado
    Quando eu preencho o campo "email" com "naoexiste@studio.com"
    E eu preencho o campo "senha" com "Qualquer123!"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Credenciais inválidas"
    E eu devo permanecer na página de login

  @erro
  Cenário: Login com senha incorreta
    Quando eu preencho o campo "email" com "admin@studio.com"
    E eu preencho o campo "senha" com "SenhaErrada123!"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Credenciais inválidas"
    E eu devo permanecer na página de login

  @erro
  Cenário: Login com campos vazios
    Quando eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Email é obrigatório"
    E eu devo ver a mensagem de erro "Senha é obrigatória"

  @erro
  Cenário: Login com email em formato inválido
    Quando eu preencho o campo "email" com "email-invalido"
    E eu preencho o campo "senha" com "Qualquer123!"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Formato de email inválido"

  @erro
  Cenário: Login com usuário inativo
    Quando eu preencho o campo "email" com "inactive@studio.com"
    E eu preencho o campo "senha" com "Inactive1!"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Conta inativa. Entre em contato com o suporte."

  @erro @seguranca
  Cenário: Bloqueio após múltiplas tentativas falhas
    Quando eu tento fazer login 5 vezes com credenciais incorretas
    Então eu devo ver a mensagem de erro "Conta temporariamente bloqueada. Tente novamente em 15 minutos."
    E o usuário deve receber um email de alerta de segurança

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Login com email em maiúsculas
    Quando eu preencho o campo "email" com "ADMIN@STUDIO.COM"
    E eu preencho o campo "senha" com "Admin123!"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para "/admin"

  @edge-case
  Cenário: Login com espaços extras no email
    Quando eu preencho o campo "email" com "  admin@studio.com  "
    E eu preencho o campo "senha" com "Admin123!"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para "/admin"

  @edge-case
  Cenário: Token expirado deve ser renovado automaticamente
    Dado que estou logado como "client@studio.com"
    E meu token de acesso expirou
    Quando eu acesso uma página protegida
    Então o sistema deve renovar o token automaticamente
    E eu devo permanecer na página solicitada

  @edge-case
  Cenário: Refresh token expirado deve redirecionar para login
    Dado que estou logado como "client@studio.com"
    E meu refresh token expirou
    Quando eu acesso uma página protegida
    Então eu devo ser redirecionado para "/login"
    E eu devo ver a mensagem "Sua sessão expirou. Faça login novamente."

  @edge-case
  Cenário: Tentativa de acesso a rota de outro role
    Dado que estou logado como "client@studio.com"
    Quando eu tento acessar "/admin"
    Então eu devo ser redirecionado para "/dashboard"
    E eu devo ver a mensagem "Acesso não autorizado"

  @edge-case
  Cenário: Login durante manutenção do sistema
    Dado que o sistema está em modo de manutenção
    Quando eu tento fazer login
    Então eu devo ver a mensagem "Sistema em manutenção. Tente novamente mais tarde."

  @edge-case @sql-injection
  Cenário: Tentativa de SQL Injection no campo email
    Quando eu preencho o campo "email" com "admin@studio.com'; DROP TABLE users;--"
    E eu preencho o campo "senha" com "Admin123!"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Formato de email inválido"
    E nenhuma operação maliciosa deve ser executada no banco

  @edge-case @xss
  Cenário: Tentativa de XSS no campo email
    Quando eu preencho o campo "email" com "<script>alert('xss')</script>"
    E eu preencho o campo "senha" com "Admin123!"
    E eu clico no botão "Entrar"
    Então o conteúdo deve ser sanitizado
    E eu devo ver a mensagem de erro "Formato de email inválido"
