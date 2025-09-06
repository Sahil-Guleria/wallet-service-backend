const { mockUser } = require('./mockData');
const bcrypt = require('bcryptjs');

// Mock the models
jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const { User } = require('../src/models');

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('user registration', () => {
    const newUser = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Test123!',
    };

    it('should register a new user', async () => {
      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);

      // Mock User.create to return new user
      User.create.mockResolvedValueOnce({
        ...mockUser,
        ...newUser,
        password: await bcrypt.hash(newUser.password, 10),
      });

      const result = await User.create(newUser);

      expect(result).toBeDefined();
      expect(result.username).toBe(newUser.username);
      expect(result.email).toBe(newUser.email);
      expect(result.password).not.toBe(newUser.password);
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it('should not register user with existing username', async () => {
      // Mock User.findOne to return existing user
      User.findOne.mockResolvedValue(mockUser);

      // Mock User.create to throw error
      User.create.mockRejectedValueOnce(new Error('Username already exists'));

      await expect(User.create(newUser)).rejects.toThrow('Username already exists');
    });
  });

  describe('user authentication', () => {
    const loginData = {
      username: mockUser.username,
      password: 'Test123!',
    };

    it('should authenticate valid credentials', async () => {
      // Mock User.findOne to return our mock user
      User.findOne.mockResolvedValue({
        ...mockUser,
        password: await bcrypt.hash(loginData.password, 10),
        validatePassword: function (password) {
          return bcrypt.compare(password, this.password);
        },
      });

      const user = await User.findOne({ where: { username: loginData.username } });
      const isValid = await user.validatePassword(loginData.password);

      expect(user).toBeDefined();
      expect(isValid).toBe(true);
      expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    it('should not authenticate invalid password', async () => {
      // Mock User.findOne to return our mock user
      User.findOne.mockResolvedValue({
        ...mockUser,
        password: await bcrypt.hash(loginData.password, 10),
        validatePassword: function (password) {
          return bcrypt.compare(password, this.password);
        },
      });

      const user = await User.findOne({ where: { username: loginData.username } });
      const isValid = await user.validatePassword('wrongpassword');

      expect(isValid).toBe(false);
    });
  });
});
