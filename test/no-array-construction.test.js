'use strict';

const test = require('node:test');
const { RuleTester } = require('eslint');

const rule = require('../lib/rules/no-array-construction');

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

ruleTester.run('no-array-construction', rule, {
  valid: [
    'Nil;',
    'Collection.empty;',
    'HashSet.empty;',
    'HashMap.empty;',
    'mutable.ArrayBuffer.empty;',
    'Collection.of(1, 2, 3);',
    'HashSet.of(1, 2, 3);',
    'Collection.from(values);',
    'HashMap.from(entries);',
    "foo([]);",
    "foo(new Array());",
    "return [1, 2, 3];",
    "const moduleConfig = { imports: [LogModule, MetricsModule] };",
    "let items; items = [];",
    "this.items = [];",
    "res.paymentProfilesCount = [];",
    "Collection.of({id: 1, name: 'aa'}, {id: 2, name: 'bb'}).toMap(x => [x.id, x.name]);",
    "HashMap.of([1, 'a'], [2, 'b']);",
    "HashMap.from([[1, 'a'], [2, 'b']]);",
    "mutable.HashMap.of(['Bob', 12], ['Steve', 13]);",
    "map.addOne(['Alice', 11]);",
    "map.addAll([['Alice', 11], ['Bob', 12]]);",
    "forComp.yield(({ i, j }) => [i, j]);",
    "right(1).join(right('a')).map(([x, y]) => ({ x, y }));",
  ],
  invalid: [
    {
      code: 'const arr = [];',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
    {
      code: 'const arr = [1, 2, 3];',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
    {
      code: 'const arr = new Array();',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
    {
      code: 'const arr = Array(3);',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
    {
      code: 'class Test { items = []; }',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
    {
      code: 'const buffer = new Array();',
      errors: [{ messageId: 'noArrayConstruction' }],
    },
  ],
});
