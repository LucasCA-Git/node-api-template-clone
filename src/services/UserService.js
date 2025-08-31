const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const UserRepository = require('../models/sql/UserRepository')

class UserService {
    // Registra um novo usuário no banco de dados
    async registerUser(user) {
        const existingUser = await UserRepository.findUserByEmail(user.email);
        if (existingUser) {
            throw new Error('Usuário já existe');
        }
        
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await UserRepository.createUser({ ...user, password: hashedPassword });
        return newUser;
    }

    // Autentica um usuário e retorna um JWT
    async authenticate(userData) {
        const user = await UserRepository.findUserByEmail(userData.email);
        if (!user || !await bcrypt.compare(userData.password, user.password)) {
            throw new Error('Credenciais inválidas');
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '12h' });
        return token;
    }

    // Busca o perfil de um usuário por ID
    async getUserProfile(userId) {
        const user = await UserRepository.findUserById(userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        return user;
    }

    // Lista todos os usuários
    async listUsers() {
        return await UserRepository.findAllUsers();
    }

    // Atualiza dados de um usuário
    async updateUser(userId, updateData) {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        const updatedUser = await UserRepository.updateUser(userId, updateData);
        if (!updatedUser) {
            throw new Error('Usuário não encontrado para atualizar');
        }
        return updatedUser;
    }

    // Deleta um usuário
    async deleteUser(userId) {
        const deleted = await UserRepository.deleteUser(userId);
        if (!deleted) {
            throw new Error('Usuário não encontrado para deletar');
        }
        return { message: 'Usuário deletado com sucesso' };
    }
}

module.exports = new UserService();
