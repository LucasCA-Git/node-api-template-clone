const express = require('express');
const router = express.Router();
const ExampleController = require('../controllers/ExampleController')
const AuthMiddleware = require('../../../middlewares/authMiddleware')
const CacheMiddleware = require('../../../middlewares/cacheMiddleware')


router.post('/test', ExampleController.register)
router.get('/test', ExampleController.example)
router.get('/test/:id', CacheMiddleware.cached(), ExampleController.getProfile) // Cache com 30 segundos
router.post('/test/login', AuthMiddleware.auth, ExampleController.login)

// CRUD de usuários
router.get('/users', ExampleController.listUsers); 
router.put('/users/:id', ExampleController.updateUser); 
router.delete('/users/:id', ExampleController.deleteUser); 

module.exports = router;