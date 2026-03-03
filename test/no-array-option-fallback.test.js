'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-array-option-fallback');

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

ruleTester.run('no-array-option-fallback', rule, {
  valid: [
    'maybeCollection.getOrElseValue(Nil);',
    'maybeNumbers.getOrElseValue(fallback);',
    'optionArray.map(x => x.length).getOrElseValue(0);',
  ],
  invalid: [
    {
      code: 'optionArray.getOrElseValue([]);',
      errors: [{ messageId: 'noArrayOptionFallback' }],
    },
    {
      code: 'maybeNumbers.getOrElseValue(new Array());',
      errors: [{ messageId: 'noArrayOptionFallback' }],
    },
    {
      code: 'groupsByMember.get(1).map(x => x.toCollection.sort((a, b) => a - b).toArray).getOrElseValue([]);',
      errors: [{ messageId: 'noArrayOptionFallback' }],
    },
    {
      code: 'maybeCollection.getOrElseValue(Nil.toArray);',
      errors: [{ messageId: 'noArrayOptionFallback' }],
    },
  ],
});
