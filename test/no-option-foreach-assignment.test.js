'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-option-foreach-assignment');

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

ruleTester.run('no-option-foreach-assignment', rule, {
  valid: [
    'const mustQuery = option(request.term).map((term) => ({ query: term }));',
    'let mustQuery = none; option(request.term).map((term) => term + 1);',
    'let result = none; option(request.term).foreach((term) => console.log(term));',
    'let result = none; values.forEach((value) => { result = value; });',
    'let result = maybeNone; option(request.term).foreach((term) => { result = some(term); });',
    'let result = none; option(request.term).foreach((term) => { other = some(term); });',
  ],
  invalid: [
    {
      code: 'let mustQuery = none; option(request.term).foreach((term) => { mustQuery = some({ query: term }); });',
      errors: [{ messageId: 'noOptionForeachAssignment' }],
    },
    {
      code: 'let mustQuery: Option<object> = none; option(request.term).foreach((term) => { mustQuery = some({ query: term }); });',
      errors: [{ messageId: 'noOptionForeachAssignment' }],
    },
    {
      code: 'let mustQuery = none; option(request.term).foreach((term) => { if (term) { mustQuery = some(term); } });',
      errors: [{ messageId: 'noOptionForeachAssignment' }],
    },
    {
      code: 'let mustQuery = none; option(request.term).foreach(() => { mustQuery = none; });',
      errors: [{ messageId: 'noOptionForeachAssignment' }],
    },
  ],
});
