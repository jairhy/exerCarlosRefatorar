const { Op } = require('sequelize')
const { Cliente, Console } = require('../models')
const { criptografar, descriptografar } = require('../utils/crypto')

const mascararSerie = (s) => (s && s.length > 4 ? '*'.repeat(s.length - 4) + s.slice(-4) : '****')

const formatar = (c, completo = false) => {
    const serie = descriptografar(c.numeroSerie)
    return {
        codConsole: c.codConsole,
        modelo: c.modelo,
        marca: c.marca,
        numeroSerie: completo ? serie : mascararSerie(serie),
        tipoServico: c.tipoServico,
        codCliente: c.codCliente,
        cliente: c.cliente ? c.cliente.nome : undefined
    }
}

const incluirCliente = [{ model: Cliente, attributes: ['codCliente', 'nome'] }]

// POST /console
const cadastrarConsole = async (req, res) => {
    const v = req.body || {}
    const modelo = String(v.modelo || '').trim()
    const marca = String(v.marca || '').trim()
    const serie = String(v.numeroSerie || '').trim().toUpperCase()
    const tipoServico = String(v.tipoServico || '').trim()

    if (!modelo || !marca || !serie || !tipoServico || !v.codCliente) {
        return res.status(400).json({ message: 'Informe modelo, marca, número de série, tipo de serviço e cliente!' })
    }
    if (!/^[A-Z0-9-]{5,30}$/.test(serie)) {
        return res.status(400).json({ message: 'Número de série inválido! Use 5 a 30 letras, números ou hífen.' })
    }

    // RN: console precisa estar vinculado a um cliente existente
    const cliente = await Cliente.findByPk(v.codCliente)
    if (!cliente) return res.status(404).json({ message: 'Cliente informado não existe!' })

    // RN: número de série único (evita troca/duplicidade de aparelhos)
    const serieCifrada = criptografar(serie)
    if (await Console.findOne({ where: { numeroSerie: serieCifrada } })) {
        return res.status(409).json({ message: 'Já existe um console com este número de série!' })
    }

    const novo = await Console.create({
        modelo, marca, numeroSerie: serieCifrada, tipoServico, codCliente: cliente.codCliente
    })
    return res.status(201).json({ message: 'Console cadastrado com sucesso!', console: formatar(novo) })
}

// GET /consoles?termo=...&codCliente=...
const listarConsoles = async (req, res) => {
    const where = {}
    if (req.query.codCliente) where.codCliente = req.query.codCliente

    const termo = String(req.query.termo || '').trim()
    if (termo) {
        const ou = [
            { numeroSerie: criptografar(termo.toUpperCase()) }, // busca exata pelo nº de série (cifrado)
            { modelo: { [Op.like]: `%${termo}%` } },
            { marca: { [Op.like]: `%${termo}%` } }
        ]
        if (/^\d+$/.test(termo)) ou.push({ codConsole: Number(termo) }) // nº do console (código)
        where[Op.or] = ou
    }

    const consoles = await Console.findAll({ where, include: incluirCliente, order: [['codConsole', 'ASC']] })
    return res.status(200).json(consoles.map((c) => formatar(c)))
}

// GET /consoles/:id
const consultarConsole = async (req, res) => {
    const c = await Console.findByPk(req.params.id, { include: incluirCliente })
    if (!c) return res.status(404).json({ message: 'Console não encontrado!' })
    return res.status(200).json(formatar(c, true))
}

module.exports = { cadastrarConsole, listarConsoles, consultarConsole }
