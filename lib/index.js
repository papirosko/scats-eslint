'use strict';

const noArrayConstructionRule = require('./rules/no-array-construction');
const noArrayMutationRule = require('./rules/no-array-mutation');
const noArrayOptionFallbackRule = require('./rules/no-array-option-fallback');
const noArrayTypedVariableRule = require('./rules/no-array-typed-variable');
const noCollectionEmptinessComparisonRule = require('./rules/no-collection-emptiness-comparison');
const noNullishSyntaxRule = require('./rules/no-nullish-syntax');
const noOptionForeachAssignmentRule = require('./rules/no-option-foreach-assignment');
const noUselessToArrayIterationRule = require('./rules/no-useless-to-array-iteration');
const toArrayTerminalRule = require('./rules/to-array-terminal');
const noExplicitEmptyRule = require('./rules/no-explicit-empty');

const rules = {
  'no-array-construction': noArrayConstructionRule,
  'no-array-mutation': noArrayMutationRule,
  'no-array-option-fallback': noArrayOptionFallbackRule,
  'no-array-typed-variable': noArrayTypedVariableRule,
  'no-collection-emptiness-comparison': noCollectionEmptinessComparisonRule,
  'no-nullish-syntax': noNullishSyntaxRule,
  'no-option-foreach-assignment': noOptionForeachAssignmentRule,
  'no-explicit-empty': noExplicitEmptyRule,
  'no-useless-to-array-iteration': noUselessToArrayIterationRule,
  'to-array-terminal': toArrayTerminalRule,
};

const recommended = {
  plugins: ['scats'],
  rules: {
    'scats/no-array-option-fallback': 'error',
    'scats/no-collection-emptiness-comparison': 'error',
    'scats/no-explicit-empty': 'error',
    'scats/no-option-foreach-assignment': 'error',
    'scats/no-useless-to-array-iteration': 'error',
    'scats/to-array-terminal': 'error',
  },
};

const strict = {
  plugins: ['scats'],
  rules: {
    'scats/no-array-construction': 'error',
    'scats/no-array-mutation': 'error',
    'scats/no-array-option-fallback': 'error',
    'scats/no-array-typed-variable': 'error',
    'scats/no-collection-emptiness-comparison': 'error',
    'scats/no-nullish-syntax': 'error',
    'scats/no-explicit-empty': 'error',
    'scats/no-option-foreach-assignment': 'error',
    'scats/no-useless-to-array-iteration': 'error',
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
