const bcrypt = require('bcryptjs');
const { logger } = require('../config/logger');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 100],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  /**
   * Validates user's password
   * @param {string} password - The password to validate
   * @returns {Promise<boolean>} True if password is valid
   */
  User.prototype.validatePassword = async function (password) {
    try {
      // Input validation
      if (!password || typeof password !== 'string') {
        logger.warn('Invalid password input type:', {
          userId: this.id,
          type: typeof password,
        });
        return false;
      }

      // Compare passwords
      const isValid = await bcrypt.compare(password, this.password);

      // Log result (but not the password!)
      logger.info('Password validation:', {
        userId: this.id,
        isValid,
        timestamp: new Date().toISOString(),
      });

      return isValid;
    } catch (error) {
      // Log error details
      logger.error('Password validation error:', {
        userId: this.id,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  };

  /**
   * Define model associations
   */
  User.associate = function (models) {
    User.hasMany(models.Wallet, {
      foreignKey: 'userId',
      as: 'wallets',
    });
  };

  return User;
};
