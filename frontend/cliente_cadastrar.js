// Sem ?id => cadastro (público). Com ?id => edição (exige login).
const id = new URLSearchParams(location.search).get('id')
const sessao = iniciarPagina(!id)

const form = document.getElementById('form_cliente')
const campo = (n) => document.getElementById(n)
mascaraCpf(campo('cpf'))
mascaraTelefone(campo('telefone'))

async function carregar() {
    document.getElementById('titulo').textContent = 'Editar Cliente'
    document.getElementById('btn_salvar').textContent = 'Salvar alterações'
    document.getElementById('label_senha').textContent = 'Nova senha (deixe em branco para manter)'
    const { ok, dados } = await api(`/clientes/${id}`)
    if (!ok) return mostrarMsg(dados.message || 'Erro ao carregar cliente!', 'erro')
    campo('nome').value = dados.nome
    campo('email').value = dados.email
    campo('cpf').value = dados.cpf
    campo('telefone').value = dados.telefone
    campo('cpf').dispatchEvent(new Event('input'))
    campo('telefone').dispatchEvent(new Event('input'))
}
if (id && sessao) carregar().catch(() => mostrarMsg('Erro ao conectar com o servidor.', 'erro'))

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const valores = {
        nome: campo('nome').value.trim(),
        email: campo('email').value.trim(),
        senha: campo('senha').value,
        cpf: campo('cpf').value,
        telefone: campo('telefone').value
    }
    if (!valores.nome || !valores.email || !valores.cpf || !valores.telefone || (!id && !valores.senha)) {
        return mostrarMsg('Preencha todos os campos obrigatórios!', 'erro')
    }
    try {
        const { ok, dados } = id
            ? await api(`/clientes/${id}`, 'PUT', valores)
            : await api('/cliente', 'POST', valores)
        mostrarMsg(dados.message, ok ? 'sucesso' : 'erro')
        if (ok && !id) {
            form.reset()
            if (!sessao) document.getElementById('link_login').hidden = false
        }
        if (ok && id) campo('senha').value = ''
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao tentar conectar com o servidor.', 'erro')
    }
})
