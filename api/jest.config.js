module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/models/index.js',
    '!src/config/*.js',
    '!src/routes/*.js',
    '!src/controllers/customer.controller.js'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageThreshold: {
    global: {
      branches: 66,
      functions: 88,
      lines: 76,
      statements: 76
    }
  },
  testTimeout: 10000,
  verbose: true,
  silent: false,
  // Suppress Sequelize console.log output
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
