/*
 * Testes de integração da API PixelFix (node:test + fetch nativo).
 * Pré-requisito: banco db_pixelfix criado (db/db_pixelfix.sql) e .env configurado.
 * Execução: npm test
 */
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const jwt = require('jsonwebtoken')

const app = require('../index')
const conn = require('../db/conn')
const { Cliente, Console, Agendamento } = require('../models')
const { criptografar } = require('../utils/crypto')

let server, base, token
const ctx = {}
const sufixo = Date.now().toString().slice(-6)

// gera CPF válido aleatório
const gerarCpf = () => {
    const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
    for (let t = 9; t < 11; t++) {
        let s = 0
        for (let i = 0; i < t; i++) s += d[i] * (t + 1 - i)
        d.push(((s * 10) % 11) % 10)
    }
    return d.join('')
}

const req = async (metodo, rota, corpo, tk = token) => {
    const r = await fetch(base + rota, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
        body: corpo ? JSON.stringify(corpo) : undefined
    })
    return { status: r.status, body: await r.json().catch(() => ({})) }
}

// próxima segunda-feira distante (evita conflito com dados reais)
const dataFutura = (offsetDias, hora) => {
    const d = new Date(Date.now() + (400 + offsetDias) * 86400000)
    while (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1)
    return `${d.toISOString().slice(0, 10)}T${hora}`
}

before(async () => {
    await conn.authenticate()
    await conn.sync()
    server = http.createServer(app).listen(0)
    await new Promise((r) => server.once('listening', r))
    base = `http://localhost:${server.address().port}`
})

after(async () => {
    if (ctx.codAgendamento) await Agendamento.destroy({ where: { codAgendamento: ctx.codAgendamento } })
    if (ctx.codConsole) await Console.destroy({ where: { codConsole: ctx.codConsole } })
    if (ctx.codConsole2) await Console.destroy({ where: { codConsole: ctx.codConsole2 } })
    for (const id of [ctx.codCliente, ctx.codCliente2]) if (id) await Cliente.destroy({ where: { codCliente: id } })
    server.close()
    await conn.close()
})

// ---------- Públicas ----------
test('T01 GET / retorna 200', async () => {
    const r = await req('GET', '/', null, null)
    assert.equal(r.status, 200)
})

test('T02 cadastrar cliente com CPF inválido -> 400', async () => {
    const r = await req('POST', '/cliente', { nome: 'Teste', email: `x${sufixo}@t.com`, senha: '123456', cpf: '11111111111', telefone: '47999998888' }, null)
    assert.equal(r.status, 400)
})

test('T03 cadastrar cliente válido -> 201 e CPF/senha cifrados no banco', async () => {
    ctx.cpf = gerarCpf()
    ctx.email = `teste${sufixo}@pixelfix.com`
    const r = await req('POST', '/cliente', { nome: 'Cliente Teste', email: ctx.email, senha: 'senha123', cpf: ctx.cpf, telefone: '(47) 99999-8888' }, null)
    assert.equal(r.status, 201)
    ctx.codCliente = r.body.cliente.codCliente
    const [row] = await conn.query('SELECT senha, cpf FROM clientes WHERE codCliente = ?', { replacements: [ctx.codCliente], type: 'SELECT' })
    assert.notEqual(row.senha, 'senha123')
    assert.match(row.senha, /^\$2[aby]\$/)
    assert.ok(!row.cpf.includes(ctx.cpf), 'CPF não pode estar em texto puro')
})

test('T04 cadastrar cliente com e-mail/CPF repetidos -> 409', async () => {
    const r = await req('POST', '/cliente', { nome: 'Dup', email: ctx.email, senha: '123456', cpf: gerarCpf(), telefone: '47999998888' }, null)
    assert.equal(r.status, 409)
    const r2 = await req('POST', '/cliente', { nome: 'Dup', email: `outro${sufixo}@t.com`, senha: '123456', cpf: ctx.cpf, telefone: '47999998888' }, null)
    assert.equal(r2.status, 409)
})

// ---------- Login ----------
test('T05 login sem dados -> 400', async () => {
    assert.equal((await req('POST', '/login', {}, null)).status, 400)
})

test('T06 login com senha errada -> 401', async () => {
    assert.equal((await req('POST', '/login', { email: ctx.email, senha: 'errada' }, null)).status, 401)
})

test('T07 login válido -> 200, token com expiração de 90 min', async () => {
    const r = await req('POST', '/login', { email: ctx.email, senha: 'senha123' }, null)
    assert.equal(r.status, 200)
    token = r.body.token
    const { iat, exp } = jwt.decode(token)
    assert.equal(exp - iat, 90 * 60)
    assert.equal(r.body.cliente.nome, 'Cliente Teste')
    assert.equal(r.body.cliente.senha, undefined)
})

// ---------- Proteção ----------
test('T08 rota protegida sem token -> 401', async () => {
    assert.equal((await req('GET', '/clientes', null, null)).status, 401)
})

test('T09 token expirado -> 401 com expirado=true', async () => {
    const expirado = jwt.sign({ codCliente: ctx.codCliente }, process.env.JWT_SECRET || 'segredo-dev', { expiresIn: -10 })
    const r = await req('GET', '/clientes', null, expirado)
    assert.equal(r.status, 401)
    assert.equal(r.body.expirado, true)
})

test('T10 GET /me retorna o cliente logado', async () => {
    const r = await req('GET', '/me')
    assert.equal(r.status, 200)
    assert.equal(r.body.email, ctx.email)
})

// ---------- CRUD Cliente ----------
test('T11 listar clientes -> CPF mascarado', async () => {
    const r = await req('GET', '/clientes')
    assert.equal(r.status, 200)
    const meu = r.body.find((c) => c.codCliente === ctx.codCliente)
    assert.ok(meu)
    assert.match(meu.cpf, /^\*\*\*\.\d{3}\.\d{3}-\*\*$/)
    assert.equal(meu.senha, undefined)
})

test('T12 buscar cliente por id -> CPF completo', async () => {
    const r = await req('GET', `/clientes/${ctx.codCliente}`)
    assert.equal(r.status, 200)
    assert.equal(r.body.cpf, ctx.cpf)
})

test('T13 atualizar cliente -> 200', async () => {
    const r = await req('PUT', `/clientes/${ctx.codCliente}`, { nome: 'Cliente Teste Editado', email: ctx.email, cpf: ctx.cpf, telefone: '47988887777' })
    assert.equal(r.status, 200)
    assert.equal(r.body.cliente.nome, 'Cliente Teste Editado')
})

test('T14 cliente inexistente -> 404', async () => {
    assert.equal((await req('GET', '/clientes/999999')).status, 404)
})

// ---------- Console ----------
test('T15 cadastrar console para cliente inexistente -> 404', async () => {
    const r = await req('POST', '/console', { modelo: 'PS5', marca: 'Sony', numeroSerie: `SN-T-${sufixo}`, tipoServico: 'Limpeza', codCliente: 999999 })
    assert.equal(r.status, 404)
})

test('T16 cadastrar console válido -> 201 e série cifrada no banco', async () => {
    ctx.serie = `SN-T-${sufixo}`
    const r = await req('POST', '/console', { modelo: 'PlayStation 5', marca: 'Sony', numeroSerie: ctx.serie, tipoServico: 'Limpeza', codCliente: ctx.codCliente })
    assert.equal(r.status, 201)
    ctx.codConsole = r.body.console.codConsole
    const [row] = await conn.query('SELECT numeroSerie FROM consoles WHERE codConsole = ?', { replacements: [ctx.codConsole], type: 'SELECT' })
    assert.ok(!row.numeroSerie.includes(ctx.serie))
    assert.equal(row.numeroSerie, criptografar(ctx.serie))
})

test('T17 número de série duplicado -> 409', async () => {
    const r = await req('POST', '/console', { modelo: 'PS5', marca: 'Sony', numeroSerie: ctx.serie, tipoServico: 'Limpeza', codCliente: ctx.codCliente })
    assert.equal(r.status, 409)
})

test('T18 consulta por termo: código do console e nº de série', async () => {
    const porCod = await req('GET', `/consoles?termo=${ctx.codConsole}`)
    assert.equal(porCod.status, 200)
    assert.ok(porCod.body.some((c) => c.codConsole === ctx.codConsole))
    const porSerie = await req('GET', `/consoles?termo=${ctx.serie}`)
    assert.equal(porSerie.body.length, 1)
    assert.equal(porSerie.body[0].codConsole, ctx.codConsole)
    assert.match(porSerie.body[0].numeroSerie, /^\*+/) // mascarado na listagem
})

test('T19 consultar console por id -> série completa', async () => {
    const r = await req('GET', `/consoles/${ctx.codConsole}`)
    assert.equal(r.body.numeroSerie, ctx.serie)
})

// ---------- Agendamento ----------
test('T20 agendamento no passado -> 400', async () => {
    const r = await req('POST', '/agendamento', { dataHora: '2020-01-06T10:00', codCliente: ctx.codCliente, codConsole: ctx.codConsole })
    assert.equal(r.status, 400)
})

test('T21 agendamento fora do expediente -> 400', async () => {
    const r = await req('POST', '/agendamento', { dataHora: dataFutura(0, '22:00'), codCliente: ctx.codCliente, codConsole: ctx.codConsole })
    assert.equal(r.status, 400)
})

test('T22 agendamento válido -> 201', async () => {
    ctx.dh = dataFutura(0, '10:00')
    const r = await req('POST', '/agendamento', { dataHora: ctx.dh, codCliente: ctx.codCliente, codConsole: ctx.codConsole })
    assert.equal(r.status, 201)
    ctx.codAgendamento = r.body.agendamento.codAgendamento
    assert.equal(r.body.agendamento.dataHora, ctx.dh)
})

test('T23 conflito de horário na bancada -> 409', async () => {
    const r = await req('POST', '/agendamento', { dataHora: dataFutura(0, '10:30'), codCliente: ctx.codCliente, codConsole: ctx.codConsole })
    assert.equal(r.status, 409)
})

test('T24 console de outro cliente -> 409', async () => {
    const cpf2 = gerarCpf()
    const c2 = await req('POST', '/cliente', { nome: 'Outro Cliente', email: `outro${sufixo}@pixelfix.com`, senha: '123456', cpf: cpf2, telefone: '47977776666' }, null)
    ctx.codCliente2 = c2.body.cliente.codCliente
    const r = await req('POST', '/agendamento', { dataHora: dataFutura(0, '15:00'), codCliente: ctx.codCliente2, codConsole: ctx.codConsole })
    assert.equal(r.status, 409)
})

test('T25 atualizar agendamento -> 200', async () => {
    const nova = dataFutura(0, '14:00')
    const r = await req('PUT', `/agendamentos/${ctx.codAgendamento}`, { dataHora: nova, codCliente: ctx.codCliente, codConsole: ctx.codConsole })
    assert.equal(r.status, 200)
    assert.equal(r.body.agendamento.dataHora, nova)
})

test('T26 listagem de agendamentos ordenada por data', async () => {
    const r = await req('GET', '/agendamentos')
    assert.equal(r.status, 200)
    const datas = r.body.map((a) => a.dataHora)
    assert.deepEqual(datas, [...datas].sort())
})

// ---------- Exclusão ----------
test('T27 excluir o próprio usuário logado -> 409', async () => {
    assert.equal((await req('DELETE', `/clientes/${ctx.codCliente}`)).status, 409)
})

test('T28 excluir cliente com console vinculado -> 409', async () => {
    const criado = await req('POST', '/console', {
        modelo: 'PlayStation 5', marca: 'Sony', numeroSerie: `SN-T-DEL-${sufixo}`,
        tipoServico: 'Teste de exclusão', codCliente: ctx.codCliente2
    })
    assert.equal(criado.status, 201)
    ctx.codConsole2 = criado.body.console.codConsole

    const r = await req('DELETE', `/clientes/${ctx.codCliente2}`)
    assert.equal(r.status, 409)
    await Console.destroy({ where: { codConsole: ctx.codConsole2 } })
    ctx.codConsole2 = null
})

test('T29 excluir cliente sem vínculos -> 200', async () => {
    const r = await req('DELETE', `/clientes/${ctx.codCliente2}`)
    assert.equal(r.status, 200)
    ctx.codCliente2 = null
})
