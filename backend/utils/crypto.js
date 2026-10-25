require('dotenv').config()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

/*
 * Criptografia dos dados sensíveis (LGPD)
 *
 * - SENHA: hash bcrypt (irreversível, com salt).
 * - CPF e Nº DE SÉRIE: AES-256-CBC (reversível, para exibir quando necessário).
 *   O IV é derivado por HMAC-SHA256 do próprio valor ("IV sintético"), tornando a
 *   criptografia determinística: o mesmo valor gera sempre o mesmo texto cifrado.
 *   Isso permite (a) impedir CPF duplicado e (b) consultar console pelo nº de série
 *   cifrando o termo buscado, sem nunca gravar o dado em texto puro.
 */
const KEY = crypto.createHash('sha256').update(process.env.CRYPTO_KEY || 'chave-dev').digest()
const IV_KEY = crypto.createHash('sha256').update('iv:' + (process.env.CRYPTO_KEY || 'chave-dev')).digest()

const criptografar = (texto) => {
    const valor = String(texto)
    const iv = crypto.createHmac('sha256', IV_KEY).update(valor).digest().subarray(0, 16)
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv)
    const enc = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()])
    return iv.toString('hex') + ':' + enc.toString('hex')
}

const descriptografar = (payload) => {
    try {
        const [ivHex, encHex] = String(payload).split(':')
        const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, Buffer.from(ivHex, 'hex'))
        return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
    } catch (e) {
        return null
    }
}

const hashSenha = (senha) => bcrypt.hashSync(String(senha), 10)
const conferirSenha = (senha, hash) => bcrypt.compareSync(String(senha), hash)

module.exports = { criptografar, descriptografar, hashSenha, conferirSenha }
