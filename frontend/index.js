const sessao = iniciarPagina()
if (sessao) {
    document.getElementById('boas_vindas').textContent = `Bem-vindo(a), ${sessao.cliente.nome}!`
    const hora = new Date(sessao.expiraEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    document.getElementById('info_sessao').textContent = `Sua sessão expira às ${hora} (90 minutos após o login).`
}
