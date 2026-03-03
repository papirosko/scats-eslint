'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-explicit-empty');

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

ruleTester.run('no-explicit-empty', rule, {
  valid: [
    'Nil;',
    'Collection.empty;',
    'HashSet.empty;',
    'HashMap.empty;',
    'ArrayBuffer.empty;',
    'Collection.of([]);',
    'HashSet.of([]);',
    'HashMap.of([]);',
    'Collection.from(items);',
    'HashSet.from(values);',
    'HashMap.from(entries);',
    'ArrayBuffer.from(source);',
    'Collection.of(1, 2, 3);',
  ],
  invalid: [
    {
      code: 'Collection.of();',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'HashSet.of();',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'HashMap.of();',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'ArrayBuffer.of();',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'Collection.from([]);',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'HashSet.from([]);',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'HashMap.from([]);',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'ArrayBuffer.from([]);',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'Collection.from(new Set());',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
    {
      code: 'HashMap.from(new Map());',
      errors: [{ messageId: 'preferEmptyCollection' }],
    },
  ],
});
