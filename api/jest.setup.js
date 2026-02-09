// Suppress Sequelize logging during tests
global.console = {
  ...console,
  log: jest.fn(), // Suppress console.log
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};
