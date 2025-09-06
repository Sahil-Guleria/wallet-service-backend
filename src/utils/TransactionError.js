class TransactionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TransactionError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static CODES = {
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  };
}

module.exports = TransactionError;
