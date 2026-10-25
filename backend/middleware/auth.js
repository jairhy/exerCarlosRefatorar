require('dotenv').config()
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'segredo-dev'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90m' // RN: sessão expira em 90 minutos

const gerarToken = (cliente) =>
    jwt.sign({ codCliente: cliente.codCliente, nome: cliente.nome }, SECRET, { expiresIn: EXPIRES_IN })

// Exige "Authorization: Bearer <token>"
const authMiddleware = (req, res, next) => {
    const header = req.headers['authorization'] || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido!' })
    }
    try {
        req.usuario = jwt.verify(token, SECRET)
        next()
    } catch (err) {
        const expirou = err.name === 'TokenExpiredError'
        return res.status(401).json({
            message: expirou ? 'Sessão expirada! Faça login novamente.' : 'Token inválido!',
            expirado: expirou
        })
    }
}

module.exports = { authMiddleware, gerarToken }
