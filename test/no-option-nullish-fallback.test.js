'use strict';

const path = require('path');
const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-option-nullish-fallback');

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
    filename: 'no-option-nullish-fallback.test.ts',
  };
}

function withOptionDeclarations(code) {
  return withTypeInfo(`
type Option<T> = {
  readonly orNull: T | null;
  readonly orUndefined: T | undefined;
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare function option<T>(value: T | null | undefined): Option<T>;

declare const messageDocument: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
};

${code}
  `);
}

ruleTester.run('no-option-nullish-fallback', rule, {
  valid: [
    'maybeUser.orNull;',
    'maybeUser.orUndefined;',
    'maybeUser.getOrElseValue(fallback);',
    'maybeUser.getOrElse(() => buildFallback());',
    'maybeUser.getOrElse(function () { return fallback; });',
    withOptionDeclarations('const timestamp = messageDocument.sendTimestamp.orElseValue(messageDocument.creationTimestamp);'),
    withTypeInfo(`
type MaybeTimestamp = { readonly orNull: number | null };
declare function option<T>(value: T | null | undefined): { readonly orNull: T | null };
declare const maybeTimestamp: MaybeTimestamp;
const timestamp = option(maybeTimestamp.orNull);
    `),
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
    {
      ...withOptionDeclarations('const timestamp = option(messageDocument.sendTimestamp.orNull);'),
      output: `
type Option<T> = {
  readonly orNull: T | null;
  readonly orUndefined: T | undefined;
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare function option<T>(value: T | null | undefined): Option<T>;

declare const messageDocument: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
};

const timestamp = messageDocument.sendTimestamp;
  `,
      errors: [{ messageId: 'noOptionNullishRewrap' }],
    },
    {
      ...withOptionDeclarations(
        'const timestamp = option(messageDocument.sendTimestamp.orNull).orElse(() => option(messageDocument.creationTimestamp.orNull));',
      ),
      output: `
type Option<T> = {
  readonly orNull: T | null;
  readonly orUndefined: T | undefined;
  orElse(fn: () => Option<T>): Option<T>;
  orElseValue(other: Option<T>): Option<T>;
};

declare function option<T>(value: T | null | undefined): Option<T>;

declare const messageDocument: {
  sendTimestamp: Option<number>;
  creationTimestamp: Option<number>;
};

const timestamp = messageDocument.sendTimestamp.orElseValue(messageDocument.creationTimestamp);
  `,
      errors: [{ messageId: 'preferOptionOrElseValue' }],
    },
  ],
});
