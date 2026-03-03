'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-array-typed-variable');

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

ruleTester.run('no-array-typed-variable', rule, {
  valid: [
    'const cases = Collection.of(1, 2, 3);',
    'const cases: Collection<number> = Collection.of(1, 2, 3);',
    'function test(items: number[]) { return items.length; }',
    'type Cases = Array<number>;',
    'interface Test { items: number[]; }',
    'class Test { items: Collection<number>; }',
    'class Test { items = Collection.of(1, 2, 3); }',
    '/** @scatsAllowArrayTypes */ class ApiConfig { readonly keys: ReadonlyArray<string>; }',
    '// @scatsAllowArrayTypes\nclass ApiConfig { keys: string[]; }',
    '/**\n * @scatsAllowArrayTypes\n */\nexport class OfferedServiceBriefClickView { additionalImages: string[]; }',
  ],
  invalid: [
    {
      code: 'const cases: Array<[number, TaxStatus, PayoutMethod]> = Collection.of([6200000, TaxStatus.individualRu, PayoutMethod.cardRu], [1573, TaxStatus.individualRu, PayoutMethod.webMoney]).toArray;',
      errors: [{ messageId: 'noArrayTypedVariable' }],
    },
    {
      code: 'let items: number[] = getItems();',
      errors: [{ messageId: 'noArrayTypedVariable' }],
    },
    {
      code: 'let items: ReadonlyArray<number>;',
      errors: [{ messageId: 'noArrayTypedVariable' }],
    },
    {
      code: 'class Test { items: string[]; }',
      errors: [{ messageId: 'noArrayTypedClassField' }],
    },
    {
      code: 'class Test { readonly items: Array<string> = values.toArray; }',
      errors: [{ messageId: 'noArrayTypedClassField' }],
    },
  ],
});
