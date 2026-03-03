'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-useless-to-array-iteration');

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

const PRELUDE = `
class Collection<T> implements Iterable<T> {
  toArray!: T[];
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
  static of<T>(..._items: T[]): Collection<T> { throw new Error('not implemented'); }
}

class HashSet<T> implements Iterable<T> {
  toArray!: T[];
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
  static of<T>(..._items: T[]): HashSet<T> { throw new Error('not implemented'); }
}

class HashMap<K, V> implements Iterable<[K, V]> {
  toArray!: Array<[K, V]>;
  [Symbol.iterator](): Iterator<[K, V]> { throw new Error('not implemented'); }
  static of<K, V>(..._items: [K, V][]): HashMap<K, V> { throw new Error('not implemented'); }
}

class CustomList<T> implements Iterable<T> {
  toArray!: T[];
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
}
`;

function withTypeInfo(code) {
  return {
    code: `${PRELUDE}\n${code}`,
    filename: 'no-useless-to-array-iteration.test.ts',
  };
}

ruleTester.run('no-useless-to-array-iteration', rule, {
  valid: [
    withTypeInfo('for (const item of Collection.of(1, 2, 3)) {}'),
    withTypeInfo('for (const item of HashSet.of(1, 2, 3)) {}'),
    withTypeInfo('for (const entry of HashMap.of([1, 1])) {}'),
    withTypeInfo('const items = new CustomList<number>(); for (const item of items.toArray) {}'),
    withTypeInfo('for (const item in Collection.of(1, 2, 3).toArray) {}'),
  ],
  invalid: [
    {
      ...withTypeInfo('for (const item of Collection.of(1, 2, 3).toArray) {}'),
      output: `${PRELUDE}\nfor (const item of Collection.of(1, 2, 3)) {}`,
      errors: [{ messageId: 'noUselessToArrayIteration' }],
    },
    {
      ...withTypeInfo('const collection = Collection.of(1, 2, 3); for (const item of collection.toArray) { console.log(item); }'),
      output: `${PRELUDE}\nconst collection = Collection.of(1, 2, 3); for (const item of collection) { console.log(item); }`,
      errors: [{ messageId: 'noUselessToArrayIteration' }],
    },
    {
      ...withTypeInfo('for (const entry of HashMap.of([1, 1], [2, 2]).toArray) {}'),
      output: `${PRELUDE}\nfor (const entry of HashMap.of([1, 1], [2, 2])) {}`,
      errors: [{ messageId: 'noUselessToArrayIteration' }],
    },
  ],
});
