const User = require('../models/user');
const { logger } = require('../config/logger');
const { generateToken } = require('../config/jwt');

class AuthService {
  async login(username, password) {
    try {
      const user = await User.findOne({ where: { username, active: true } });
      
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Error in login:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const user = await User.create(userData);
      return {
        id: user.id,
        username: user.username,
        role: user.role
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
