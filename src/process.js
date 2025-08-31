const postgres = require('../config/postgres')
const socket = require('./sockets/SocketMananger')
const logger = require('../src/utils/logger')

async function clean() {
    try {
        logger.info('Called Clean')
        await postgres.close();
        logger.info('Database pool has been closed');

        if (socket.getIO()) {
            socket.getIO().close()
            logger.info('All Socket.IO connections have been closed.');
        }

    } catch (err) {
        logger.error(err)
    }
}

process.on('SIGINT', async () => {
    logger.error('SIGINT')
    await clean()
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.error('SIGTERM')
    await clean()
    process.exit(0);
})

process.on('uncaughtException', async (err) => {
    logger.error('Unhandled exception:', err);
});
 
process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
