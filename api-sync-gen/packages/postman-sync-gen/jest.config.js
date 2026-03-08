const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: '@company/postman-sync-gen',
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@company/api-sync-core$': '<rootDir>/../core/src/index.ts',
  },
};
