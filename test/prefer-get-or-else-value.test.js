'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/prefer-get-or-else-value');

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
    filename: 'prefer-get-or-else-value.test.ts',
  };
}

function withOptionDeclarations(code) {
  return withTypeInfo(`
type Option<T> = {
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare const entity: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
  deliveryTimestamp: Option<number>;
  lastModificationTimestamp: Option<number>;
  rawCreationTimestamp: Option<number>;
};

${code}
  `);
}

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
    withOptionDeclarations('const timestamp = entity.sendTimestamp.orElseValue(entity.creationTimestamp);'),
    withTypeInfo(`
type MaybeTimestamp = { value: number };
declare const entity: { deliveryTimestamp: MaybeTimestamp };
const timestamp = maybeUser.orElse(() => entity.deliveryTimestamp);
    `),
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
    {
      ...withOptionDeclarations('const timestamp = entity.sendTimestamp.orElse(() => entity.creationTimestamp);'),
      output: `
type Option<T> = {
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare const entity: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
  deliveryTimestamp: Option<number>;
  lastModificationTimestamp: Option<number>;
  rawCreationTimestamp: Option<number>;
};

const timestamp = entity.sendTimestamp.orElseValue(entity.creationTimestamp);
  `,
      errors: [{ messageId: 'preferGetOrElseValue' }],
    },
    {
      ...withOptionDeclarations(`const timestamp = entity.sendTimestamp.orElseValue(entity.creationTimestamp)
    .orElse(() => entity.deliveryTimestamp)
    .orElse(() => entity.lastModificationTimestamp)
    .orElse(() => entity.rawCreationTimestamp);`),
      output: `
type Option<T> = {
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare const entity: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
  deliveryTimestamp: Option<number>;
  lastModificationTimestamp: Option<number>;
  rawCreationTimestamp: Option<number>;
};

const timestamp = entity.sendTimestamp.orElseValue(entity.creationTimestamp)
    .orElseValue(entity.deliveryTimestamp)
    .orElseValue(entity.lastModificationTimestamp)
    .orElseValue(entity.rawCreationTimestamp);
  `,
      errors: [
        { messageId: 'preferGetOrElseValue' },
        { messageId: 'preferGetOrElseValue' },
        { messageId: 'preferGetOrElseValue' },
      ],
    },
  ],
});
