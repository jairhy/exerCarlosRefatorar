const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Agendamento = db.define('agendamento', {
    codAgendamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dataHora: { type: DataTypes.DATE, allowNull: false },
    codCliente: { type: DataTypes.INTEGER, allowNull: false },
    codConsole: { type: DataTypes.INTEGER, allowNull: false }
}, {
    timestamps: false,
    tableName: 'agendamentos'
})

module.exports = Agendamento
