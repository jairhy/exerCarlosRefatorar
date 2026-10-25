iniciarPagina()
const campo = (n) => document.getElementById(n)

async function carregarClientes() {
    const { ok, dados } = await api('/clientes')
    campo('codCliente').innerHTML = '<option value="">Selecione o cliente</option>' +
        (ok ? dados.map((c) => `<option value="${esc(c.codCliente)}">${esc(c.nome)} (${esc(c.email)})</option>`).join('') : '')
}
carregarClientes().catch(() => mostrarMsg('Erro ao conectar com o servidor.', 'erro'))

document.getElementById('form_console').addEventListener('submit', async (e) => {
    e.preventDefault()
    const valores = {
        codCliente: campo('codCliente').value,
        modelo: campo('modelo').value.trim(),
        marca: campo('marca').value.trim(),
        numeroSerie: campo('numeroSerie').value.trim(),
        tipoServico: campo('tipoServico').value.trim()
    }
    if (Object.values(valores).some((v) => !v)) return mostrarMsg('Preencha todos os campos!', 'erro')
    try {
        const { ok, dados } = await api('/console', 'POST', valores)
        mostrarMsg(dados.message, ok ? 'sucesso' : 'erro')
        if (ok) e.target.reset()
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao tentar conectar com o servidor.', 'erro')
    }
})
