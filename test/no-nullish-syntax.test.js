'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-nullish-syntax');

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

ruleTester.run('no-nullish-syntax', rule, {
  valid: [
    "option(xx).getOrElseValue('foo');",
    'option(x).flatMap(x => option(x.foo)).flatMap(x => option(x.bar));',
    'option(user).map(user => user.name);',
    'value || fallback;',
  ],
  invalid: [
    {
      code: 'x?.foo;',
      errors: [{ messageId: 'noOptionalChaining' }],
    },
    {
      code: 'x.foo?.bar;',
      errors: [{ messageId: 'noOptionalChaining' }],
    },
    {
      code: 'x?.foo?.bar?.();',
      errors: [{ messageId: 'noOptionalChaining' }],
    },
    {
      code: "xx ?? 'foo';",
      errors: [{ messageId: 'noNullishCoalescing' }],
    },
    {
      code: "x?.foo ?? 'bar';",
      errors: [
        { messageId: 'noNullishCoalescing' },
        { messageId: 'noOptionalChaining' },
      ],
    },
  ],
});
