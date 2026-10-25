const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Console = db.define('console', {
    codConsole: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    modelo: { type: DataTypes.STRING(50), allowNull: false },
    marca: { type: DataTypes.STRING(50), allowNull: false },
    numeroSerie: { type: DataTypes.STRING(120), allowNull: false, unique: true }, // AES-256 (hex)
    tipoServico: { type: DataTypes.STRING(100), allowNull: false },
    codCliente: { type: DataTypes.INTEGER, allowNull: false }
}, {
    timestamps: false,
    tableName: 'consoles'
})

module.exports = Console
