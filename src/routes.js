const express = require('express');
const router = express.Router();
const exampleV1Routes = require('./api/v1/routes/exampleRoutes'); // Caminho corrigido
const logger = require('./utils/logger');

// Usa a rota V1 para o caminho '/api/v1'
router.use('/api/v1', exampleV1Routes);

logger.info('Rotas inicializadas.');

module.exports = router;
