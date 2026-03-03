'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-collection-emptiness-comparison');

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
  length!: number;
  size!: number;
  isEmpty!: boolean;
  nonEmpty!: boolean;
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
  static of<T>(..._items: T[]): Collection<T> { throw new Error('not implemented'); }
}

class HashSet<T> implements Iterable<T> {
  size!: number;
  isEmpty!: boolean;
  nonEmpty!: boolean;
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
  static of<T>(..._items: T[]): HashSet<T> { throw new Error('not implemented'); }
}

class HashMap<K, V> implements Iterable<[K, V]> {
  size!: number;
  isEmpty!: boolean;
  nonEmpty!: boolean;
  [Symbol.iterator](): Iterator<[K, V]> { throw new Error('not implemented'); }
  static of<K, V>(..._items: [K, V][]): HashMap<K, V> { throw new Error('not implemented'); }
}

class ScatsArrayBuffer<T> implements Iterable<T> {
  length!: number;
  size!: number;
  isEmpty!: boolean;
  nonEmpty!: boolean;
  [Symbol.iterator](): Iterator<T> { throw new Error('not implemented'); }
}

type ArrayBuffer<T> = ScatsArrayBuffer<T>;
`;

function withTypeInfo(code) {
  return {
    code: `${PRELUDE}\n${code}`,
    filename: 'no-collection-emptiness-comparison.test.ts',
  };
}

ruleTester.run('no-collection-emptiness-comparison', rule, {
  valid: [
    withTypeInfo('const collection = Collection.of(1, 2, 3); collection.isEmpty;'),
    withTypeInfo('const collection = Collection.of(1, 2, 3); collection.nonEmpty;'),
    withTypeInfo('const set = HashSet.of(1, 2, 3); set.isEmpty;'),
    withTypeInfo('const map = HashMap.of([1, 1]); map.nonEmpty;'),
    withTypeInfo('const arr: number[] = []; arr.length === 0;'),
    withTypeInfo('const text = "foo"; text.length > 0;'),
  ],
  invalid: [
    {
      ...withTypeInfo('const collection = Collection.of(1, 2, 3); collection.length === 0;'),
      output: `${PRELUDE}\nconst collection = Collection.of(1, 2, 3); collection.isEmpty;`,
      errors: [{ messageId: 'preferCollectionEmptinessProperty' }],
    },
    {
      ...withTypeInfo('const collection = Collection.of(1, 2, 3); collection.length == 0;'),
      output: `${PRELUDE}\nconst collection = Collection.of(1, 2, 3); collection.isEmpty;`,
      errors: [{ messageId: 'preferCollectionEmptinessProperty' }],
    },
    {
      ...withTypeInfo('const set = HashSet.of(1, 2, 3); set.size == 0;'),
      output: `${PRELUDE}\nconst set = HashSet.of(1, 2, 3); set.isEmpty;`,
      errors: [{ messageId: 'preferCollectionEmptinessProperty' }],
    },
    {
      ...withTypeInfo('const set = HashSet.of(1, 2, 3); set.size > 0;'),
      output: `${PRELUDE}\nconst set = HashSet.of(1, 2, 3); set.nonEmpty;`,
      errors: [{ messageId: 'preferCollectionEmptinessProperty' }],
    },
    {
      ...withTypeInfo('const map = HashMap.of([1, 1]); 0 < map.size;'),
      output: `${PRELUDE}\nconst map = HashMap.of([1, 1]); map.nonEmpty;`,
      errors: [{ messageId: 'preferCollectionEmptinessProperty' }],
    },
  ],
});
