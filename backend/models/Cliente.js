const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Cliente = db.define('cliente', {
    codCliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(100), allowNull: false },      // hash bcrypt
    cpf: { type: DataTypes.STRING(120), allowNull: false, unique: true }, // AES-256 (hex)
    telefone: { type: DataTypes.STRING(15), allowNull: false }
}, {
    timestamps: false,
    tableName: 'clientes'
})

module.exports = Cliente
