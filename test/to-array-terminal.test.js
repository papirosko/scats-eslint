'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/to-array-terminal');

RuleTester.describe = test.describe;
RuleTester.it = test.it;
RuleTester.itOnly = test.it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('to-array-terminal', rule, {
  valid: [
    'Collection.of(1, 2, 3).map(x => x + 1).toArray;',
    'HashSet.of(1, 2, 3).toArray;',
    'HashMap.of([1, 1], [2, 2]).toArray;',
    'option(1).toArray;',
    'const items = Collection.of(1, 2, 3).toArray;',
    'fn(Collection.of(1, 2, 3).toArray);',
    'const first = Collection.of(1, 2, 3).map(x => x + 1);',
  ],
  invalid: [
    {
      code: 'Collection.of(1, 2, 3).toArray.map(x => x + 1);',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'Collection.of(1, 2, 3).map(x => x + 1).toArray.filter(Boolean);',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'HashSet.of(1, 2, 3).toArray.map(x => x + 1);',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'HashMap.of([1, 1]).toArray.length;',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'option(1).toArray[0];',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'Collection.of(1, 2, 3).toArray();',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
    {
      code: 'Collection.of(1, 2, 3).toArray[0];',
      errors: [{ messageId: 'nonTerminalToArray' }],
    },
  ],
});
