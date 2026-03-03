'use strict';

const noArrayConstructionRule = require('./rules/no-array-construction');
const noArrayMutationRule = require('./rules/no-array-mutation');
const toArrayTerminalRule = require('./rules/to-array-terminal');
const noExplicitEmptyRule = require('./rules/no-explicit-empty');

const rules = {
  'no-array-construction': noArrayConstructionRule,
  'no-array-mutation': noArrayMutationRule,
  'no-explicit-empty': noExplicitEmptyRule,
  'to-array-terminal': toArrayTerminalRule,
};

const recommended = {
  plugins: ['scats'],
  rules: {
    'scats/no-explicit-empty': 'error',
    'scats/to-array-terminal': 'error',
  },
};

const strict = {
  plugins: ['scats'],
  rules: {
    'scats/no-array-construction': 'error',
    'scats/no-array-mutation': 'error',
    'scats/no-explicit-empty': 'error',
    'scats/to-array-terminal': 'error',
  },
};

module.exports = {
  rules,
  configs: {
    recommended,
    strict,
  },
};
