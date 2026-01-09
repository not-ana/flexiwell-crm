// Cucumber configuration
module.exports = {
  default: {
    require: ['tests/steps/**/*.ts', 'tests/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:tests/reports/cucumber-report.html',
      'json:tests/reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['tests/features/**/*.feature'],
    publishQuiet: true,
  },
  // Run only UI validation tests
  ui: {
    require: ['tests/steps/**/*.ts', 'tests/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:tests/reports/ui-validation-report.html',
      'json:tests/reports/ui-validation-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['tests/features/ui-validation.feature'],
    publishQuiet: true,
  },
  // Smoke tests - quick validation
  smoke: {
    require: ['tests/steps/**/*.ts', 'tests/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'json:tests/reports/smoke-report.json'],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['tests/features/**/*.feature'],
    tags: '@smoke',
    publishQuiet: true,
  },
};
