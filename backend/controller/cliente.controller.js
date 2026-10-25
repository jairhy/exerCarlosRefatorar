const { Op } = require('sequelize')
const { Cliente, Console } = require('../models')
const { criptografar, descriptografar, hashSenha } = require('../utils/crypto')
const { somenteDigitos, cpfValido, emailValido, celularValido, mascararCpf } = require('../utils/validacao')

const paraLista = (c) => ({
    codCliente: c.codCliente,
    nome: c.nome,
    email: c.email,
    cpf: mascararCpf(descriptografar(c.cpf)),
    telefone: c.telefone
})

const paraDetalhe = (c) => ({
    codCliente: c.codCliente,
    nome: c.nome,
    email: c.email,
    cpf: descriptografar(c.cpf),
    telefone: c.telefone
})

// valida campos; `parcial` = true na atualização (senha opcional)
const validar = (v, parcial = false) => {
    if (!v.nome || String(v.nome).trim().length < 3) return 'Nome é obrigatório (mín. 3 caracteres)!'
    if (!emailValido(v.email)) return 'E-mail inválido!'
    if (!cpfValido(v.cpf)) return 'CPF inválido!'
    if (!celularValido(v.telefone)) return 'Telefone celular inválido! Use DDD + 9 dígitos.'
    if (!parcial || v.senha) {
        if (!v.senha || String(v.senha).length < 6) return 'Senha é obrigatória (mín. 6 caracteres)!'
    }
    return null
}

// Verifica duplicidade de e-mail/CPF (ignora o próprio cliente na edição)
const duplicado = async (email, cpfCifrado, ignorarId = null) => {
    const filtroId = ignorarId ? { codCliente: { [Op.ne]: ignorarId } } : {}
    if (await Cliente.findOne({ where: { email, ...filtroId } })) return 'E-mail já cadastrado!'
    if (await Cliente.findOne({ where: { cpf: cpfCifrado, ...filtroId } })) return 'CPF já cadastrado!'
    return null
}

// POST /cliente  (público: auto-cadastro)
const cadastrarCliente = async (req, res) => {
    const v = req.body || {}
    const erro = validar(v)
    if (erro) return res.status(400).json({ message: erro })

    const email = String(v.email).trim().toLowerCase()
    const cpfCifrado = criptografar(somenteDigitos(v.cpf))

    const dup = await duplicado(email, cpfCifrado)
    if (dup) return res.status(409).json({ message: dup })

    const novo = await Cliente.create({
        nome: String(v.nome).trim(),
        email,
        senha: hashSenha(v.senha),
        cpf: cpfCifrado,
        telefone: somenteDigitos(v.telefone)
    })
    return res.status(201).json({ message: 'Cliente cadastrado com sucesso!', cliente: paraLista(novo) })
}

// GET /clientes
const listarClientes = async (req, res) => {
    const clientes = await Cliente.findAll({ order: [['nome', 'ASC']] })
    return res.status(200).json(clientes.map(paraLista))
}

// GET /clientes/:id
const buscarCliente = async (req, res) => {
    const c = await Cliente.findByPk(req.params.id)
    if (!c) return res.status(404).json({ message: 'Cliente não encontrado!' })
    return res.status(200).json(paraDetalhe(c))
}

// PUT /clientes/:id
const atualizarCliente = async (req, res) => {
    const c = await Cliente.findByPk(req.params.id)
    if (!c) return res.status(404).json({ message: 'Cliente não encontrado!' })

    const v = req.body || {}
    const erro = validar(v, true)
    if (erro) return res.status(400).json({ message: erro })

    const email = String(v.email).trim().toLowerCase()
    const cpfCifrado = criptografar(somenteDigitos(v.cpf))

    const dup = await duplicado(email, cpfCifrado, c.codCliente)
    if (dup) return res.status(409).json({ message: dup })

    c.nome = String(v.nome).trim()
    c.email = email
    c.cpf = cpfCifrado
    c.telefone = somenteDigitos(v.telefone)
    if (v.senha) c.senha = hashSenha(v.senha)
    await c.save()

    return res.status(200).json({ message: 'Cliente atualizado com sucesso!', cliente: paraLista(c) })
}

// DELETE /clientes/:id
const excluirCliente = async (req, res) => {
    const c = await Cliente.findByPk(req.params.id)
    if (!c) return res.status(404).json({ message: 'Cliente não encontrado!' })

    if (c.codCliente === req.usuario.codCliente) {
        return res.status(409).json({ message: 'Não é possível excluir o próprio usuário logado!' })
    }
    // RN: preservar histórico de reparos
    const qtd = await Console.count({ where: { codCliente: c.codCliente } })
    if (qtd > 0) {
        return res.status(409).json({ message: 'Cliente possui consoles vinculados e não pode ser excluído!' })
    }

    await c.destroy()
    return res.status(200).json({ message: 'Cliente excluído com sucesso!' })
}

module.exports = { cadastrarCliente, listarClientes, buscarCliente, atualizarCliente, excluirCliente }
