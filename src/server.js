require('dotenv').config()
const listen = require('./process')
const express = require('express')
const morgan = require('morgan');
const logger = require('./utils/logger')

const app = express()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('tiny'))

// Carregar certificados SSL
const server = require('./ssl')(app)

// Inicia Managers
const SocketManager = require('./sockets/SocketMananger')
SocketManager.initialize(server)

const PostgresSQLManager = require('../config/postgres')

// Middleware
const ErrorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const routes = require('./routes');
app.use(routes); // AQUI ESTÁ A ÚNICA MUDANÇA NA LÓGICA DO SEU ARQUIVO

// Inicia servidor na porta definida no .env 
server.listen(process.env.PORT, () => {
    logger.info(`Server started with port ${process.env.PORT}`)
})

app.get("*", ErrorMiddleware.error404, (req, res, next) => {
    next()
})
app.post("*", ErrorMiddleware.error404, (req, res, next) => {
    next()
})

module.exports = app
