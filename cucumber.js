// Cucumber configuration
module.exports = {
  default: {
    require: ['tests/steps/**/*.ts', 'tests/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:tests/reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['tests/features/**/*.feature'],
    publishQuiet: true,
  },
};
