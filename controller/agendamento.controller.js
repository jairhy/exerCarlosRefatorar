const { Op } = require('sequelize')
const { Cliente, Console, Agendamento } = require('../models')

const INTERVALO_MIN = 60 // RN: uma bancada => mínimo de 60 min entre agendamentos
const HORA_ABRE = 8
const HORA_FECHA = 18

// "YYYY-MM-DDTHH:mm" (ou data + hora) -> Date em "horário de parede" (UTC sem conversão)
const lerDataHora = (v) => {
    const texto = v.dataHora || (v.data && v.hora ? `${v.data}T${v.hora}` : '')
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(texto))
    if (!m) return null
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]))
    return isNaN(d) ? null : d
}

// "agora" no horário de Brasília, na mesma representação (parede em UTC)
const agoraBrasil = () => new Date(Date.now() - 3 * 60 * 60 * 1000)

const formatar = (a) => ({
    codAgendamento: a.codAgendamento,
    dataHora: a.dataHora.toISOString().slice(0, 16),
    codCliente: a.codCliente,
    cliente: a.cliente ? a.cliente.nome : undefined,
    codConsole: a.codConsole,
    console: a.console ? `${a.console.marca} ${a.console.modelo}` : undefined,
    tipoServico: a.console ? a.console.tipoServico : undefined
})

const incluir = [
    { model: Cliente, attributes: ['codCliente', 'nome'] },
    { model: Console, attributes: ['codConsole', 'modelo', 'marca', 'tipoServico'] }
]

// Valida regras comuns a cadastro e atualização. Retorna {status, message} ou null.
const validarRegras = async (v, dataHora, ignorarId = null, exigirFuturo = true) => {
    if (!dataHora) return { status: 400, message: 'Data e hora inválidas! Use o formato AAAA-MM-DDTHH:mm.' }
    if (!v.codCliente || !v.codConsole) return { status: 400, message: 'Informe cliente e console!' }

    if (exigirFuturo && dataHora <= agoraBrasil()) {
        return { status: 400, message: 'O agendamento deve ser em data/hora futura!' }
    }

    const dia = dataHora.getUTCDay()
    const hora = dataHora.getUTCHours() + dataHora.getUTCMinutes() / 60
    if (dia === 0 || hora < HORA_ABRE || hora >= HORA_FECHA) {
        return { status: 400, message: 'Atendimento de segunda a sábado, das 08:00 às 18:00!' }
    }

    const cliente = await Cliente.findByPk(v.codCliente)
    if (!cliente) return { status: 404, message: 'Cliente informado não existe!' }

    const console_ = await Console.findByPk(v.codConsole)
    if (!console_) return { status: 404, message: 'Console informado não existe!' }

    // RN: o console precisa pertencer ao cliente do agendamento
    if (console_.codCliente !== cliente.codCliente) {
        return { status: 409, message: 'O console informado não pertence a este cliente!' }
    }

    // RN: sem conflito de horário na bancada
    const ini = new Date(dataHora.getTime() - (INTERVALO_MIN - 1) * 60000)
    const fim = new Date(dataHora.getTime() + (INTERVALO_MIN - 1) * 60000)
    const where = { dataHora: { [Op.between]: [ini, fim] } }
    if (ignorarId) where.codAgendamento = { [Op.ne]: ignorarId }
    if (await Agendamento.findOne({ where })) {
        return { status: 409, message: 'Já existe agendamento neste horário (intervalo mínimo de 60 min)!' }
    }
    return null
}

// POST /agendamento
const cadastrarAgendamento = async (req, res) => {
    const v = req.body || {}
    const dataHora = lerDataHora(v)
    const erro = await validarRegras(v, dataHora)
    if (erro) return res.status(erro.status).json({ message: erro.message })

    const novo = await Agendamento.create({ dataHora, codCliente: v.codCliente, codConsole: v.codConsole })
    const completo = await Agendamento.findByPk(novo.codAgendamento, { include: incluir })
    return res.status(201).json({ message: 'Agendamento cadastrado com sucesso!', agendamento: formatar(completo) })
}

// GET /agendamentos  -> ordenado por data agendada (crescente)
const listarAgendamentos = async (req, res) => {
    const lista = await Agendamento.findAll({ include: incluir, order: [['dataHora', 'ASC']] })
    return res.status(200).json(lista.map(formatar))
}

// GET /agendamentos/:id
const buscarAgendamento = async (req, res) => {
    const a = await Agendamento.findByPk(req.params.id, { include: incluir })
    if (!a) return res.status(404).json({ message: 'Agendamento não encontrado!' })
    return res.status(200).json(formatar(a))
}

// PUT /agendamentos/:id
const atualizarAgendamento = async (req, res) => {
    const a = await Agendamento.findByPk(req.params.id)
    if (!a) return res.status(404).json({ message: 'Agendamento não encontrado!' })

    const v = req.body || {}
    const dataHora = lerDataHora(v)
    // só exige data futura se a data/hora foi realmente alterada
    const mudou = dataHora && dataHora.getTime() !== a.dataHora.getTime()
    const erro = await validarRegras(v, dataHora, a.codAgendamento, mudou)
    if (erro) return res.status(erro.status).json({ message: erro.message })

    a.dataHora = dataHora
    a.codCliente = v.codCliente
    a.codConsole = v.codConsole
    await a.save()

    const completo = await Agendamento.findByPk(a.codAgendamento, { include: incluir })
    return res.status(200).json({ message: 'Agendamento atualizado com sucesso!', agendamento: formatar(completo) })
}

module.exports = { cadastrarAgendamento, listarAgendamentos, buscarAgendamento, atualizarAgendamento }
