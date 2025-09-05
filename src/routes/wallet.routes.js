const express = require('express');
const walletService = require('../services/wallet.service');
const pdfService = require('../services/pdf.service');
const validate = require('../middleware/validate');
const rateLimiter = require('../middleware/rate-limit');
const authenticate = require('../middleware/auth');
const idempotencyMiddleware = require('../middleware/idempotency');
const { cacheMiddleware, invalidateWalletCache } = require('../middleware/cache');
const { logger } = require('../config/logger');
const {
  setupWalletSchema,
  transactionSchema,
  transactionParamsSchema,
  getWalletParamsSchema,
  getTransactionsQuerySchema
} = require('../middleware/validation.schemas');

const router = express.Router();

router.post('/create',
  authenticate,
  rateLimiter.setupWallet,
  validate(setupWalletSchema, 'body'),
  async (req, res, next) => {
    try {
      const { name: walletName, balance: initialBalance } = req.body;
      const wallet = await walletService.createWallet(walletName, initialBalance, req.user.id);
      res.json(wallet);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/transact/:walletId',
  authenticate,
  rateLimiter.transaction,
  idempotencyMiddleware,
  validate(transactionParamsSchema, 'params'),
  validate(transactionSchema, 'body'),
  async (req, res, next) => {
    try {
      const { walletId } = req.params;
      const { amount: transactionAmount, description: transactionDescription } = req.body;
      
      logger.info('Transaction request:', {
        walletId,
        transactionAmount,
        transactionDescription,
        userId: req.user.id
      });
      
      const result = await walletService.processTransaction(walletId, transactionAmount, transactionDescription, req.user.id);
      
      // Invalidate cache for this wallet
      invalidateWalletCache(walletId);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/transactions',
  authenticate,
  rateLimiter.read,
  validate(getTransactionsQuerySchema, 'query'),
  cacheMiddleware(30),
  async (req, res, next) => {
    try {
      const { 
        walletId,
        skip: offsetStr,
        limit: pageSizeStr,
        sortBy: sortField,
        sortOrder: sortDirection
      } = req.query;

      const transactions = await walletService.getWalletTransactions(
        walletId,
        parseInt(offsetStr),
        parseInt(pageSizeStr),
        sortField,
        sortDirection
      );
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }
);

// Get all wallets
router.get('/wallets',
  authenticate,
  rateLimiter.read,
  cacheMiddleware(30),
  async (req, res, next) => {
    try {
      logger.info('Getting wallets for user:', { userId: req.user.id });
      const wallets = await walletService.getAllWallets(req.user.id);
      res.json({ data: wallets });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/wallet/:id',
  authenticate,
  rateLimiter.read,
  validate(getWalletParamsSchema, 'params'),
  cacheMiddleware(30),
  async (req, res, next) => {
    try {
      const wallet = await walletService.getWallet(req.params.id);
      res.json(wallet);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/transactions/:walletId/pdf',
  authenticate,
  rateLimiter.read,
  validate(transactionParamsSchema, 'params'),
  async (req, res, next) => {
    try {
      const { walletId } = req.params;
      
      // Get wallet info
      const wallet = await walletService.getWallet(walletId);
      
      // Get all transactions for the wallet
      const { transactions } = await walletService.getWalletTransactions(
        walletId,
        0,  // offset
        1000,  // pageSize
        'date',  // sortField
        'desc'  // sortDirection
      );
      
      // Generate PDF
      const doc = await pdfService.generateTransactionPDF(transactions, walletId);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=transactions-${walletId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Stream PDF to response
      doc.pipe(res);
      doc.end();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;