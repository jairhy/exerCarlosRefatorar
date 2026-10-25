/* ===== Utilitários compartilhados (sessão, API, menu superior) ===== */
const API = window.PIXELFIX_API_URL || 'http://localhost:3000'
const CHAVE_SESSAO = 'pixelfix_sessao'

function getSessao() {
    try {
        const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO))
        if (!s || new Date(s.expiraEm) <= new Date()) {
            localStorage.removeItem(CHAVE_SESSAO)
            return null
        }
        return s
    } catch (e) {
        return null
    }
}

function salvarSessao(dados) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({
        token: dados.token, expiraEm: dados.expiraEm, cliente: dados.cliente
    }))
}

function sair(expirou = false) {
    localStorage.removeItem(CHAVE_SESSAO)
    location.href = new URL(`login.html${expirou ? '?expirou=1' : ''}`, location.href).href
}

// Chamada à API com o token Bearer. Em 401 com sessão ativa, encerra a sessão.
async function api(rota, metodo = 'GET', corpo) {
    const s = getSessao()
    const resp = await fetch(API + rota, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', ...(s ? { Authorization: 'Bearer ' + s.token } : {}) },
        body: corpo ? JSON.stringify(corpo) : undefined
    })
    const dados = await resp.json().catch(() => ({}))
    if (resp.status === 401 && s) sair(true)
    return { ok: resp.ok, status: resp.status, dados }
}

// Escapa HTML (evita XSS ao montar tabelas com innerHTML)
function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function mostrarMsg(texto, tipo = 'sucesso') {
    const el = document.getElementById('resposta')
    el.className = 'resposta ' + tipo
    el.textContent = texto
}

function formatarDataHora(iso) { // "2026-11-10T09:00" -> "10/11/2026 09:00"
    const [d, h] = String(iso).split('T')
    const [a, m, dia] = d.split('-')
    return `${dia}/${m}/${a} ${h}`
}

function mascaraCpf(input) {
    input.addEventListener('input', () => {
        const d = input.value.replace(/\D/g, '').slice(0, 11)
        input.value = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    })
}

function mascaraTelefone(input) {
    input.addEventListener('input', () => {
        const d = input.value.replace(/\D/g, '').slice(0, 11)
        input.value = d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    })
}

function nomeArquivoAtual() {
    return location.pathname.split('/').pop() || 'index.html'
}

// Monta o menu superior (acessível) e protege a página.
// publica = true: página acessível sem login (login e auto-cadastro).
function iniciarPagina(publica = false) {
    const s = getSessao()
    if (!s && !publica) {
        location.replace('login.html')
        return null
    }

    const atual = nomeArquivoAtual()
    const link = (arq, texto) =>
        `<a href="./${arq}"${atual === arq ? ' aria-current="page"' : ''}>${texto}</a>`

    const menu = s ? `
        ${link('index.html', 'Home')}
        <span class="grupo"><span class="titulo_menu">Clientes</span>
            ${link('cliente_cadastrar.html', 'Cadastrar')}${link('cliente_listar.html', 'Listar')}</span>
        <span class="grupo"><span class="titulo_menu">Consoles</span>
            ${link('console_cadastrar.html', 'Cadastrar')}${link('console_listar.html', 'Listar')}</span>
        <span class="grupo"><span class="titulo_menu">Agendamentos</span>
            ${link('agendamento_cadastrar.html', 'Cadastrar')}${link('agendamento_listar.html', 'Listar')}</span>
        <span class="usuario">Olá, <strong>${esc(s.cliente.nome)}</strong>
            <button type="button" id="btn_logout" class="btn-peq">Sair</button></span>`
        : `${link('login.html', 'Entrar')}${link('cliente_cadastrar.html', 'Criar conta')}`

    document.body.insertAdjacentHTML('afterbegin', `
        <a class="pular" href="#conteudo">Ir para o conteúdo</a>
        <header class="topo"><nav aria-label="Menu principal">${menu}</nav></header>`)

    const btn = document.getElementById('btn_logout')
    if (btn) btn.addEventListener('click', () => sair(false))

    // encerra automaticamente quando a sessão (90 min) expirar
    if (s) setTimeout(() => sair(true), Math.max(0, new Date(s.expiraEm) - new Date()))
    return s
}
