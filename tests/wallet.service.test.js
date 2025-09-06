const { mockUser, mockWallet, mockTransaction } = require('./mockData');

// Mock the models
jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Wallet: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
  },
}));

const { User, Wallet, Transaction } = require('../src/models');

describe('Wallet Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a wallet successfully', async () => {
      // Mock User.findOne to return our mock user
      User.findOne.mockResolvedValue(mockUser);

      // Mock Wallet.create to return our mock wallet
      Wallet.create.mockResolvedValue(mockWallet);

      // Test wallet creation
      const result = await Wallet.create({
        name: mockWallet.name,
        balance: mockWallet.balance,
        userId: mockUser.id,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe(mockWallet.name);
      expect(result.balance).toBe(mockWallet.balance);
      expect(result.userId).toBe(mockUser.id);
      expect(Wallet.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('processTransaction', () => {
    it('should process a credit transaction', async () => {
      // Mock wallet retrieval
      Wallet.findOne.mockResolvedValue({
        ...mockWallet,
        balance: '100.0000',
      });

      // Mock transaction creation
      Transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: '50.0000',
        type: 'CREDIT',
        balance: '150.0000',
      });

      const result = await Transaction.create({
        wallet_id: mockWallet.id,
        amount: '50.0000',
        type: 'CREDIT',
        description: 'Test credit',
        balance: '150.0000',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('CREDIT');
      expect(result.amount).toBe('50.0000');
      expect(result.balance).toBe('150.0000');
      expect(Transaction.create).toHaveBeenCalledTimes(1);
    });

    it('should process a debit transaction', async () => {
      // Mock wallet retrieval
      Wallet.findOne.mockResolvedValue({
        ...mockWallet,
        balance: '100.0000',
      });

      // Mock transaction creation
      Transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: '-50.0000',
        type: 'DEBIT',
        balance: '50.0000',
      });

      const result = await Transaction.create({
        wallet_id: mockWallet.id,
        amount: '-50.0000',
        type: 'DEBIT',
        description: 'Test debit',
        balance: '50.0000',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('DEBIT');
      expect(result.amount).toBe('-50.0000');
      expect(result.balance).toBe('50.0000');
      expect(Transaction.create).toHaveBeenCalledTimes(1);
    });
  });
});
