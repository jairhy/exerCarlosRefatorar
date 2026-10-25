// se já houver sessão válida, vai direto para a home
if (getSessao()) location.replace('index.html')
iniciarPagina(true)

if (new URLSearchParams(location.search).get('expirou')) {
    mostrarMsg('Sua sessão expirou. Faça login novamente.', 'erro')
}

document.getElementById('form_login').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value.trim()
    const senha = document.getElementById('senha').value

    if (!email || !senha) return mostrarMsg('Informe e-mail e senha!', 'erro')

    try {
        const { ok, dados } = await api('/login', 'POST', { email, senha })
        if (!ok) return mostrarMsg(dados.message || 'Erro ao fazer login!', 'erro')
        salvarSessao(dados)
        location.href = 'index.html'
    } catch (err) {
        console.error(err)
        mostrarMsg('Erro ao tentar conectar com o servidor.', 'erro')
    }
})
