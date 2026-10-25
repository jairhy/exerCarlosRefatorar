const jwt = require('jsonwebtoken')
const { Cliente } = require('../models')
const { conferirSenha } = require('../utils/crypto')
const { gerarToken } = require('../middleware/auth')
const { emailValido } = require('../utils/validacao')

// POST /login
const login = async (req, res) => {
    const { email, senha } = req.body || {}

    if (!email || !senha) {
        return res.status(400).json({ message: 'Informe e-mail e senha!' })
    }
    if (!emailValido(email)) {
        return res.status(400).json({ message: 'E-mail inválido!' })
    }

    const cliente = await Cliente.findOne({ where: { email: String(email).trim().toLowerCase() } })
    // mensagem genérica: não revela se o e-mail existe
    if (!cliente || !conferirSenha(senha, cliente.senha)) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos!' })
    }

    const token = gerarToken(cliente)
    const { exp } = jwt.decode(token)
    return res.status(200).json({
        message: 'Login realizado com sucesso!',
        token,
        expiraEm: new Date(exp * 1000).toISOString(),
        cliente: { codCliente: cliente.codCliente, nome: cliente.nome, email: cliente.email }
    })
}

// GET /me  (rota protegida: devolve o cliente logado)
const me = async (req, res) => {
    const cliente = await Cliente.findByPk(req.usuario.codCliente, {
        attributes: ['codCliente', 'nome', 'email']
    })
    if (!cliente) return res.status(401).json({ message: 'Usuário da sessão não existe mais!' })
    return res.status(200).json(cliente)
}

module.exports = { login, me }
