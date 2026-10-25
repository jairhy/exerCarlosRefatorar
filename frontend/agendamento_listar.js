iniciarPagina()

async function listar() {
    try {
        const { ok, dados } = await api('/agendamentos')
        if (!ok) return mostrarMsg(dados.message || 'Erro ao listar agendamentos!', 'erro')
        if (!dados.length) return mostrarMsg('Nenhum agendamento cadastrado.', 'aviso')
        document.getElementById('tabela').innerHTML = `
            <table>
                <thead><tr><th>Código</th><th>Data e hora</th><th>Cliente</th><th>Console</th><th>Serviço</th><th>Ações</th></tr></thead>
                <tbody>${dados.map((a) => `
                    <tr>
                        <td>${esc(a.codAgendamento)}</td><td>${esc(formatarDataHora(a.dataHora))}</td>
                        <td>${esc(a.cliente)}</td><td>#${esc(a.codConsole)} - ${esc(a.console)}</td><td>${esc(a.tipoServico)}</td>
                        <td><a class="btn-link" href="./agendamento_cadastrar.html?id=${esc(a.codAgendamento)}">Atualizar</a></td>
                    </tr>`).join('')}
                </tbody>
            </table>`
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao conectar com o servidor.', 'erro')
    }
}
listar()
