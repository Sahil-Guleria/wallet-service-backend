const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',
  email: 'test@example.com',
  password: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  isActive: true,
};

const mockWallet = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Wallet',
  balance: '100.0000',
  userId: mockUser.id,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  wallet_id: mockWallet.id,
  amount: '50.0000',
  type: 'CREDIT',
  description: 'Test transaction',
  balance: '150.0000',
  created_at: new Date(),
};

module.exports = {
  mockUser,
  mockWallet,
  mockTransaction,
};
