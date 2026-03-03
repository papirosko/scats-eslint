'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-array-mutation');

RuleTester.describe = test.describe;
RuleTester.it = test.it;
RuleTester.itOnly = test.it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
        defaultProject: 'tsconfig.json',
      },
      tsconfigRootDir: __dirname ? path.resolve(__dirname, '..') : process.cwd(),
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

function withTypeInfo(code) {
  return {
    code,
    filename: 'no-array-mutation.test.ts',
  };
}

ruleTester.run('no-array-mutation', rule, {
  valid: [
    withTypeInfo('const buffer = mutable.ArrayBuffer.empty; buffer.append(1);'),
    withTypeInfo('const buffer = mutable.ArrayBuffer.empty; buffer.appendAll(values);'),
    withTypeInfo('const collection = Collection.of(1, 2, 3); collection.map(x => x + 1);'),
    withTypeInfo('const map = mutable.HashMap.empty; map.addOne(["Alice", 11]);'),
    withTypeInfo('const set = mutable.HashSet.empty; set.addAll(values);'),
    withTypeInfo('const items: number[] = []; items[index] = 1;'),
    withTypeInfo('const items: number[] = []; items.length;'),
    withTypeInfo('const foo: { push(value: number): void } = { push() {} }; foo.push(1);'),
    withTypeInfo('class Queue { push(_value) {} } const foo = new Queue(); foo.push(1);'),
  ],
  invalid: [
    {
      ...withTypeInfo('const arr: number[] = []; arr.push(1);'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr.pop();'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr.splice(0, 1);'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr.sort(compare);'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr[0] = 1;'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr[`0`] = 1;'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr.length = 0;'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const arr: number[] = []; arr[0]++;'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
    {
      ...withTypeInfo('const pair: [number, number] = [1, 2]; pair[0] = 3;'),
      errors: [{ messageId: 'noArrayMutation' }],
    },
  ],
});
