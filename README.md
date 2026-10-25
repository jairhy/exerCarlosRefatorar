# PixelFix Games - Sistema Web de Gestão de Oficina de Games

API REST (Node.js + Express + Sequelize + MySQL) e frontend em HTML/CSS/JS.

## Estrutura
```
backend/    API Node.js, banco, modelos, testes e requisições REST Client
frontend/   Telas HTML, estilos CSS e scripts do navegador
docs/       Documentação do sistema e diagramas
```

> Instale dependências, execute testes e faça alterações da API dentro de `backend/`.

## Como rodar
1. Instale Node.js 20+ e MySQL 8 (ou MariaDB 10.6+) e inicie o banco.
2. Crie o banco, tabelas e dados de exemplo (o script apaga e recria `db_pixelfix`):
   `mysql -u root -p < backend/db/db_pixelfix.sql`
3. Em `backend/`, copie `.env.example` para `.env` e ajuste usuário e senha do banco; depois:
   ```
   npm install
   npm start        # http://localhost:3000
   ```
4. Em outro terminal, na pasta raiz: `npx http-server frontend -p 5500`
5. Abra http://localhost:5500/login.html
   - Login de teste: `carlos@gmail.com` / `123456` (também mariana@ e rafael@gmail.com)

## Testes de integração
- Automatizados: dentro de `backend/`, execute `npm test` (29 casos; precisa do banco criado)
- Manuais: abra `backend/teste.http` no VS Code (extensão REST Client) e execute na ordem.

## Segurança
- Senha: bcrypt | CPF e nº de série: AES-256-CBC | Sessão: JWT de 90 min
- Troque `JWT_SECRET` e `CRYPTO_KEY` em produção. Se trocar `CRYPTO_KEY`, os dados de exemplo
  do script SQL deixam de ser decifráveis (recadastre pelo sistema).
