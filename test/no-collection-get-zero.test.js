'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-collection-get-zero');

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
    filename: 'no-collection-get-zero.test.ts',
  };
}

ruleTester.run('no-collection-get-zero', rule, {
  valid: [
    withTypeInfo(`
class Collection<T> {
  get(_index: number): T | undefined { return undefined; }
  head!: T;
  headOption!: { value: T } | undefined;
}

declare const entities: Collection<number>;

entities.head;
    `),
    withTypeInfo(`
class Collection<T> {
  get(_index: number): T | undefined { return undefined; }
}

declare const entities: Collection<number>;

entities.get(1);
    `),
    withTypeInfo(`
class Sequence<T> {
  get(_index: number): T | undefined { return undefined; }
}

declare const entities: Sequence<number>;

entities.get(0);
    `),
  ],
  invalid: [
    {
      ...withTypeInfo(`
class Collection<T> {
  get(_index: number): T | undefined { return undefined; }
  head!: T;
  headOption!: { value: T } | undefined;
}

declare const entities: Collection<number>;

entities.get(0);
      `),
      errors: [{ messageId: 'noCollectionGetZero' }],
    },
    {
      ...withTypeInfo(`
class Collection<T> {
  get(_index: number): T | undefined { return undefined; }
  head!: T;
  headOption!: { value: T } | undefined;
}

declare const entity: {
  entities: Collection<number>;
};

entity.entities.get(0);
      `),
      errors: [{ messageId: 'noCollectionGetZero' }],
    },
  ],
});
