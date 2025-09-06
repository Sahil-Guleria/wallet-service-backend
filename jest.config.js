module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/coverage/', 'jest.config.js'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  collectCoverageFrom: ['src/**/*.js', '!src/swagger.json', '!src/config/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
