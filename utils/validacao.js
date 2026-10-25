const somenteDigitos = (v) => String(v || '').replace(/\D/g, '')

// Validação de CPF com dígitos verificadores
const cpfValido = (cpf) => {
    const c = somenteDigitos(cpf)
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
    for (let t = 9; t < 11; t++) {
        let soma = 0
        for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i)
        const dv = ((soma * 10) % 11) % 10
        if (dv !== Number(c[t])) return false
    }
    return true
}

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))

// Celular brasileiro: DDD + 9 + 8 dígitos (11 dígitos)
const celularValido = (t) => /^[1-9]{2}9\d{8}$/.test(somenteDigitos(t))

const mascararCpf = (cpf) => {
    const c = somenteDigitos(cpf)
    return c.length === 11 ? `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**` : '***'
}

module.exports = { somenteDigitos, cpfValido, emailValido, celularValido, mascararCpf }
