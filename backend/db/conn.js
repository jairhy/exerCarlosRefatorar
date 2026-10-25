require('dotenv').config()
const { Sequelize } = require('sequelize')

const db = new Sequelize(
    process.env.DB_NAME || 'db_pixelfix',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'root',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        timezone: '+00:00' // data/hora gravadas como horário de parede (sem conversão de fuso)
    }
)

module.exports = db
