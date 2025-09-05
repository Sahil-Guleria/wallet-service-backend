'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    const defaultUserId = '00000000-0000-0000-0000-000000000000';
    await queryInterface.bulkInsert('users', [{
      id: defaultUserId,
      username: 'system',
      password: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      email: 'system@example.com',
      isActive: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    await queryInterface.addColumn('wallets', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      after: 'balance'
    });

    await queryInterface.sequelize.query(`
      UPDATE wallets SET "userId" = '${defaultUserId}' WHERE "userId" IS NULL
    `);
    await queryInterface.changeColumn('wallets', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('wallets', 'userId');
    await queryInterface.dropTable('users');
  }
};
