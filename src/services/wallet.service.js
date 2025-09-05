const { Wallet, Transaction, sequelize, Sequelize } = require('../models');
const { logger } = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { cacheWalletData, getCachedWalletData, invalidateWalletCache } = require('../middleware/cache');

class WalletService {
  async createWallet(walletName, initialBalance, userId) {
    const t = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });
    
    try {
      if (initialBalance < 0) {
        throw new Error('Initial balance cannot be negative');
      }

      const wallet = await Wallet.create({
        name: walletName,
        balance: initialBalance,
        userId
      }, { 
        transaction: t,
        lock: Sequelize.Transaction.LOCK.UPDATE
      });

      await Transaction.create({
        wallet_id: wallet.id,
        amount: initialBalance,
        balance: initialBalance,
        type: 'CREDIT',
        description: 'Initial deposit'
      }, { 
        transaction: t,
        lock: Sequelize.Transaction.LOCK.UPDATE
      });

      await t.commit();

      const walletData = {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        name: wallet.name,
        date: wallet.created_at
      };

      await cacheWalletData(wallet.id, walletData);
      return walletData;
    } catch (error) {
      await t.rollback();
      logger.error('Error in setupWallet:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Wallet with this name already exists');
      }
      
      throw error;
    }
  }

  async getAllWallets(userId) {
    try {
      logger.info('Getting all wallets for user:', { userId });
      const wallets = await Wallet.findAll({
        where: { userId },
        order: [['created_at', 'DESC']]
      });

      logger.info('Found wallets:', { count: wallets.length });
      const mappedWallets = wallets.map(wallet => ({
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        name: wallet.name,
        date: wallet.created_at
      }));
      logger.info('Mapped wallets:', { mappedWallets });
      return mappedWallets;
    } catch (error) {
      logger.error('Error in getAllWallets:', error);
      throw error;
    }
  }

  async getWallet(id) {
    try {
      const cachedWallet = await getCachedWalletData(id);
      if (cachedWallet) {
        return cachedWallet;
      }

      const wallet = await Wallet.findByPk(id);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletData = {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        name: wallet.name,
        date: wallet.created_at
      };

      await cacheWalletData(id, walletData);
      return walletData;
    } catch (error) {
      logger.error('Error in getWallet:', error);
      throw error;
    }
  }

  async processTransaction(walletId, transactionAmount, transactionDescription, userId) {
    logger.info('Starting transaction:', { walletId, transactionAmount, transactionDescription });
    
          const normalizedAmount = Number(Number(transactionAmount).toFixed(4));
      if (isNaN(normalizedAmount) || !isFinite(normalizedAmount)) {
        throw new Error(`Invalid transaction amount: ${transactionAmount}`);
      }
      
      if (normalizedAmount === 0) {
        throw new Error('Transaction amount cannot be zero');
      }
      
      const decimalPlaces = (normalizedAmount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 4) {
        throw new Error(`Transaction amount cannot have more than 4 decimal places: ${transactionAmount}`);
      }

      const transactionType = normalizedAmount > 0 ? 'CREDIT' : 'DEBIT';
      const absoluteAmount = Math.abs(normalizedAmount);

      const t = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      });
    
    try {
      const wallet = await Wallet.findOne({ 
        where: { id: walletId, userId },
        transaction: t,
        lock: Sequelize.Transaction.LOCK.UPDATE
      });
      
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
      }
      
      const currentBalance = Number(Number(wallet.balance).toFixed(4));
      
      if (transactionType === 'DEBIT' && currentBalance < absoluteAmount) {
        throw new ApiError(400, 'Transaction Failed', [{
          field: 'amount',
          message: `Insufficient balance. Available: ${currentBalance}, Required: ${absoluteAmount}`
        }]);
      }
      
      const updatedBalance = Number(
        (transactionType === 'CREDIT' ? currentBalance + absoluteAmount : currentBalance - absoluteAmount)
        .toFixed(4)
      );
      
      await wallet.update(
        { balance: updatedBalance },
        { transaction: t }
      );
      
      const newTransaction = await Transaction.create({
        wallet_id: walletId,
        amount: normalizedAmount,
        balance: updatedBalance,
        type: transactionType,
        description: transactionDescription,
        created_at: sequelize.fn('NOW')
      }, { transaction: t });
      
      await t.commit();
      await invalidateWalletCache(walletId);
      return {
        balance: updatedBalance,
        transactionId: newTransaction.id,
        type: transactionType,
        timestamp: new Date()
      };
    } catch (error) {
      await t.rollback();
      logger.error('Transaction failed:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        walletId,
        amount,
        description,
        transactionAmount,
        type,
        absAmount
      });
      
      if (error.name === 'SequelizeValidationError') {
        throw new Error('Invalid transaction data: ' + error.message);
      }
      if (error.name === 'SequelizeDatabaseError') {
        throw new Error('Database error: ' + error.message);
      }
      if (error.name === 'ReferenceError') {
        throw new Error('Internal error: ' + error.message);
      }
      throw error;
    }
  }

  async getWalletTransactions(walletId, offset = 0, pageSize = 10, sortField = 'date', sortDirection = 'desc') {
    try {
      const wallet = await Wallet.findByPk(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const cacheKey = `transactions:${walletId}:${offset}:${pageSize}:${sortField}:${sortDirection}`;
      const cachedTransactions = await getCachedWalletData(cacheKey);
      if (cachedTransactions) {
        return cachedTransactions;
      }

      const dbSortField = sortField === 'date' ? 'created_at' : 'amount';

      const { count, rows } = await Transaction.findAndCountAll({
        where: { wallet_id: walletId },
        order: [[dbSortField, sortDirection.toUpperCase()]],
        limit: pageSize,
        offset: offset
      });

      const result = {
        transactions: rows.map(t => ({
          id: t.id,
          walletId: t.wallet_id,
          amount: parseFloat(t.amount),
          balance: parseFloat(t.balance),
          description: t.description,
          date: t.created_at,
          type: t.type
        })),
        total: count
      };

      await cacheWalletData(cacheKey, result, 60);

      return result;
    } catch (error) {
      logger.error('Error in getTransactions:', error);
      throw error;
    }
  }
}

module.exports = new WalletService();