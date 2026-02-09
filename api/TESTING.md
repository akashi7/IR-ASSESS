# Backend Testing Guide

## Overview

Comprehensive test suite for the Certificate Management System backend API using Jest and Supertest.

## Test Coverage

### Test Suites

1. **Authentication Tests** (`__tests__/auth.controller.test.js`)
   - User registration
   - Login functionality
   - JWT authentication
   - Profile retrieval
   - Password hashing
   - Duplicate email handling

2. **Template Controller Tests** (`__tests__/template.controller.test.js`)
   - Template creation
   - Template listing (with customer isolation)
   - Template retrieval
   - Template updates
   - Template deletion
   - Authorization checks

3. **Certificate Controller Tests** (`__tests__/certificate.controller.test.js`)
   - Certificate simulation
   - Certificate generation (JWT auth)
   - Certificate generation (API key auth)
   - Batch certificate generation
   - Certificate listing with pagination
   - Certificate verification
   - Certificate revocation
   - Customer isolation

## Running Tests

### Inside Docker Container

```bash
# Install test dependencies (first time only)
docker exec certificate_api npm install --save-dev jest supertest @types/jest

# Run all tests
docker exec certificate_api npm test

# Run tests in watch mode
docker exec certificate_api npm run test:watch

# Run specific test file
docker exec certificate_api npx jest __tests__/auth.controller.test.js
```

### Local Development

```bash
cd api
npm install
npm test
```

## Test Coverage Report

Generate and view coverage report:

```bash
# Generate coverage report
docker exec certificate_api npm test

# Coverage report will be in api/coverage/
# Open api/coverage/lcov-report/index.html in browser
```

## Coverage Thresholds

Configured in `jest.config.js`:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test Structure

Each test file follows this pattern:

```javascript
describe('Controller Name', () => {
  beforeEach(async () => {
    // Setup test data
  });

  describe('Endpoint Name', () => {
    it('should do something', async () => {
      // Test implementation
    });
  });
});
```

## Key Features Tested

### Security
✅ Customer data isolation
✅ JWT authentication
✅ API key authentication
✅ Password hashing
✅ Authorization checks

### Functionality
✅ CRUD operations
✅ Pagination
✅ Filtering
✅ Validation
✅ Error handling

### Performance
✅ Batch operations
✅ Database queries

## Test Data

Tests use an isolated test database that is reset before each test suite:

- Database tables are dropped and recreated
- Fresh test data is generated for each test
- No interference between tests

## Troubleshooting

### Tests failing with "Connection refused"
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database credentials in `.env`

### Tests timing out
- Increase timeout in `jest.config.js`
- Check for open database connections

### Coverage not generating
- Ensure all test files end with `.test.js` or `.spec.js`
- Check `collectCoverageFrom` in `jest.config.js`

## Continuous Integration

To run tests in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    docker-compose up -d db
    docker-compose run api npm test
```

## Next Steps

- [ ] Add integration tests for PDF generation
- [ ] Add load tests for batch generation
- [ ] Add E2E tests with frontend
- [ ] Implement code quality checks (ESLint, Prettier)
