const Cliente = require('./Cliente')
const Console = require('./Console')
const Agendamento = require('./Agendamento')

// 1 cliente -> N consoles
Cliente.hasMany(Console, { foreignKey: 'codCliente', onDelete: 'RESTRICT' })
Console.belongsTo(Cliente, { foreignKey: 'codCliente' })

// 1 cliente -> N agendamentos
Cliente.hasMany(Agendamento, { foreignKey: 'codCliente', onDelete: 'RESTRICT' })
Agendamento.belongsTo(Cliente, { foreignKey: 'codCliente' })

// 1 console -> N agendamentos
Console.hasMany(Agendamento, { foreignKey: 'codConsole', onDelete: 'RESTRICT' })
Agendamento.belongsTo(Console, { foreignKey: 'codConsole' })

module.exports = { Cliente, Console, Agendamento }
