require('dotenv').config()
const express = require('express')
const cors = require('cors')

const conn = require('./db/conn')
require('./models') // registra as associações

const { authMiddleware } = require('./middleware/auth')
const auth = require('./controller/auth.controller')
const cliente = require('./controller/cliente.controller')
const consoleCtrl = require('./controller/console.controller')
const agendamento = require('./controller/agendamento.controller')

const app = express()
const PORT = Number(process.env.PORT) || 3000
const hostname = process.env.HOSTNAME || 'localhost'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

// ===== Rotas públicas =====
app.get('/', (req, res) => res.status(200).json({ message: 'API PixelFix Rodando!' }))
app.post('/login', auth.login)
app.post('/cliente', cliente.cadastrarCliente) // auto-cadastro

// ===== Rotas protegidas (token JWT, expira em 90 min) =====
app.use(authMiddleware)

app.get('/me', auth.me)

app.get('/clientes', cliente.listarClientes)
app.get('/clientes/:id', cliente.buscarCliente)
app.put('/clientes/:id', cliente.atualizarCliente)
app.delete('/clientes/:id', cliente.excluirCliente)

app.post('/console', consoleCtrl.cadastrarConsole)
app.get('/consoles', consoleCtrl.listarConsoles)
app.get('/consoles/:id', consoleCtrl.consultarConsole)

app.post('/agendamento', agendamento.cadastrarAgendamento)
app.get('/agendamentos', agendamento.listarAgendamentos)
app.get('/agendamentos/:id', agendamento.buscarAgendamento)
app.put('/agendamentos/:id', agendamento.atualizarAgendamento)

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada!' }))

// tratamento global de erros (Express 5 propaga erros de handlers async)
app.use((err, req, res, next) => {
    console.error(err)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Registro duplicado!' })
    }
    return res.status(500).json({ message: 'Erro interno do servidor!' })
})

module.exports = app

if (require.main === module) {
    conn.authenticate()
        .then(() => conn.sync())
        .then(() => {
            console.log('Banco de dados Conectado!')
            app.listen(PORT, hostname, () => console.log(`Servidor rodando em http://${hostname}:${PORT}`))
        })
        .catch((err) => console.error('Erro ao conectar com o banco de dados!', err))
}
