// Sem ?id => cadastro. Com ?id => atualização do agendamento.
iniciarPagina()
const id = new URLSearchParams(location.search).get('id')
const campo = (n) => document.getElementById(n)

async function carregarConsoles(codCliente, selecionado = '') {
    if (!codCliente) {
        campo('codConsole').innerHTML = '<option value="">Selecione o cliente primeiro</option>'
        return
    }
    const { ok, dados } = await api(`/consoles?codCliente=${encodeURIComponent(codCliente)}`)
    const lista = ok ? dados : []
    campo('codConsole').innerHTML = lista.length
        ? '<option value="">Selecione o console</option>' +
          lista.map((c) => `<option value="${esc(c.codConsole)}">#${esc(c.codConsole)} - ${esc(c.marca)} ${esc(c.modelo)} (${esc(c.tipoServico)})</option>`).join('')
        : '<option value="">Cliente sem consoles cadastrados</option>'
    campo('codConsole').value = String(selecionado)
}

async function iniciar() {
    const { ok, dados } = await api('/clientes')
    campo('codCliente').innerHTML = '<option value="">Selecione o cliente</option>' +
        (ok ? dados.map((c) => `<option value="${esc(c.codCliente)}">${esc(c.nome)}</option>`).join('') : '')

    if (id) {
        campo('titulo').textContent = 'Atualizar Agendamento'
        campo('btn_salvar').textContent = 'Salvar alterações'
        const r = await api(`/agendamentos/${id}`)
        if (!r.ok) return mostrarMsg(r.dados.message || 'Agendamento não encontrado!', 'erro')
        const a = r.dados
        campo('codCliente').value = String(a.codCliente)
        await carregarConsoles(a.codCliente, a.codConsole)
        const [d, h] = a.dataHora.split('T')
        campo('data').value = d
        campo('hora').value = h
    }
}
iniciar().catch(() => mostrarMsg('Erro ao conectar com o servidor.', 'erro'))

campo('codCliente').addEventListener('change', () => carregarConsoles(campo('codCliente').value))

document.getElementById('form_agendamento').addEventListener('submit', async (e) => {
    e.preventDefault()
    const valores = {
        codCliente: campo('codCliente').value,
        codConsole: campo('codConsole').value,
        dataHora: `${campo('data').value}T${campo('hora').value}`
    }
    if (!valores.codCliente || !valores.codConsole || !campo('data').value || !campo('hora').value) {
        return mostrarMsg('Preencha todos os campos!', 'erro')
    }
    try {
        const { ok, dados } = id
            ? await api(`/agendamentos/${id}`, 'PUT', valores)
            : await api('/agendamento', 'POST', valores)
        mostrarMsg(dados.message, ok ? 'sucesso' : 'erro')
        if (ok && !id) {
            e.target.reset()
            carregarConsoles('')
        }
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao tentar conectar com o servidor.', 'erro')
    }
})
