'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/prefer-get-or-else-value');

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

ruleTester.run('prefer-get-or-else-value', rule, {
  valid: [
    'maybeUser.getOrElseValue(0);',
    'maybeUser.getOrElse(() => fallback);',
    'maybeUser.getOrElse((x) => 0);',
    'maybeUser.getOrElse(() => null);',
    'maybeUser.getOrElse(() => undefined);',
    'maybeUser.getOrElse(() => buildFallback());',
    'maybeUser.getOrElse(() => ({ value: 1 }));',
    'maybeUser.getOrElse(() => { audit(); return 0; });',
  ],
  invalid: [
    {
      code: 'maybeUser.getOrElse(() => 0);',
      output: 'maybeUser.getOrElseValue(0);',
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
    {
      code: 'maybeUser.getOrElse(() => "guest");',
      output: 'maybeUser.getOrElseValue("guest");',
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
    {
      code: 'maybeUser.getOrElse(function () { return true; });',
      output: 'maybeUser.getOrElseValue(true);',
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
    {
      code: 'lookupUser(id).getOrElse(() => `guest`);',
      output: 'lookupUser(id).getOrElseValue(`guest`);',
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
    {
      code: 'lookupUser(id).getOrElse(() => { return 42; });',
      output: 'lookupUser(id).getOrElseValue(42);',
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
  ],
});
