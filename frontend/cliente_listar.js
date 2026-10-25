iniciarPagina()
const tabela = document.getElementById('tabela')

async function listar() {
    try {
        const { ok, dados } = await api('/clientes')
        if (!ok) return mostrarMsg(dados.message || 'Erro ao listar clientes!', 'erro')
        if (!dados.length) return mostrarMsg('Nenhum cliente cadastrado.', 'aviso')
        tabela.innerHTML = `
            <table>
                <thead><tr><th>Código</th><th>Nome</th><th>E-mail</th><th>CPF</th><th>Telefone</th><th>Ações</th></tr></thead>
                <tbody>${dados.map((c) => `
                    <tr>
                        <td>${esc(c.codCliente)}</td><td>${esc(c.nome)}</td><td>${esc(c.email)}</td>
                        <td>${esc(c.cpf)}</td><td>${esc(c.telefone)}</td>
                        <td>
                            <a class="btn-link" href="./cliente_cadastrar.html?id=${esc(c.codCliente)}">Editar</a>
                            <button type="button" class="btn-peq perigo" data-id="${esc(c.codCliente)}" data-nome="${esc(c.nome)}">Excluir</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao conectar com o servidor.', 'erro')
    }
}

tabela.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]')
    if (!btn) return
    if (!confirm(`Excluir o cliente "${btn.dataset.nome}"?`)) return
    const { ok, dados } = await api(`/clientes/${btn.dataset.id}`, 'DELETE')
    await listar()
    mostrarMsg(dados.message, ok ? 'sucesso' : 'erro')
})

listar()
