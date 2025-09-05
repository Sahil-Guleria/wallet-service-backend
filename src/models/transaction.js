const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Wallet, {
        foreignKey: 'wallet_id',
        as: 'wallet'
      });
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    wallet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(16, 4),
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(16, 4),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('CREDIT', 'DEBIT'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.fn('NOW'),
      get() {
        const value = this.getDataValue('created_at');
        if (!value) return null;
        const date = new Date(value);
        return date;
      }
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: false
  });

  return Transaction;
};