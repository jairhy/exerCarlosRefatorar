iniciarPagina()
const tabela = document.getElementById('tabela')

async function listar(termo = '') {
    tabela.innerHTML = ''
    try {
        const { ok, dados } = await api('/consoles' + (termo ? `?termo=${encodeURIComponent(termo)}` : ''))
        if (!ok) return mostrarMsg(dados.message || 'Erro ao listar consoles!', 'erro')
        if (!dados.length) return mostrarMsg('Nenhum console encontrado.', 'aviso')
        mostrarMsg(`${dados.length} console(s) encontrado(s).`, 'sucesso')
        tabela.innerHTML = `
            <table>
                <thead><tr><th>Nº Console</th><th>Modelo</th><th>Marca</th><th>Nº de série</th><th>Serviço</th><th>Cliente</th></tr></thead>
                <tbody>${dados.map((c) => `
                    <tr>
                        <td>${esc(c.codConsole)}</td><td>${esc(c.modelo)}</td><td>${esc(c.marca)}</td>
                        <td><span id="serie_${esc(c.codConsole)}">${esc(c.numeroSerie)}</span>
                            <button type="button" class="btn-peq" data-id="${esc(c.codConsole)}" aria-label="Mostrar número de série completo">Ver</button></td>
                        <td>${esc(c.tipoServico)}</td><td>${esc(c.cliente)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao conectar com o servidor.', 'erro')
    }
}

// "Ver": busca o nº de série completo (descriptografado pela API)
tabela.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]')
    if (!btn) return
    const { ok, dados } = await api(`/consoles/${btn.dataset.id}`)
    if (ok) {
        document.getElementById('serie_' + btn.dataset.id).textContent = dados.numeroSerie
        btn.remove()
    }
})

document.getElementById('form_busca').addEventListener('submit', (e) => {
    e.preventDefault()
    listar(document.getElementById('termo').value.trim())
})

listar()
