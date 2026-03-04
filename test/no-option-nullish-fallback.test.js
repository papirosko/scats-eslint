'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-option-nullish-fallback');

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

ruleTester.run('no-option-nullish-fallback', rule, {
  valid: [
    'maybeUser.orNull;',
    'maybeUser.orUndefined;',
    'maybeUser.getOrElseValue(fallback);',
    'maybeUser.getOrElse(() => buildFallback());',
    'maybeUser.getOrElse(function () { return fallback; });',
  ],
  invalid: [
    {
      code: 'maybeUser.getOrElse(() => null);',
      output: 'maybeUser.orNull;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
    {
      code: 'maybeUser.getOrElseValue(null);',
      output: 'maybeUser.orNull;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
    {
      code: 'lookupUser(id).getOrElse(() => undefined);',
      output: 'lookupUser(id).orUndefined;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
    {
      code: 'lookupUser(id).getOrElseValue(undefined);',
      output: 'lookupUser(id).orUndefined;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
    {
      code: 'lookupUser(id).getOrElse(function () { return null; });',
      output: 'lookupUser(id).orNull;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
    {
      code: 'lookupUser(id).getOrElse(() => { return void 0; });',
      output: 'lookupUser(id).orUndefined;',
      errors: [{ messageId: 'noOptionNullishFallback' }],
    },
  ],
});
