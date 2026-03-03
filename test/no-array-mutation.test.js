'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-array-mutation');

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

ruleTester.run('no-array-mutation', rule, {
  valid: [
    'buffer.append(1);',
    'buffer.appendAll(values);',
    'collection.map(x => x + 1);',
    'map.addOne(["Alice", 11]);',
    'set.addAll(values);',
    'items[index] = 1;',
    'items.length;',
  ],
  invalid: [
    {
      code: 'arr.push(1);',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr.pop();',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr.splice(0, 1);',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr.sort(compare);',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr[0] = 1;',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr[`0`] = 1;',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr.length = 0;',
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      code: 'arr[0]++;',
      errors: [{ messageId: 'noArrayMutation' }],
    },
  ],
});
