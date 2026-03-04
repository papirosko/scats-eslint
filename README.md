# eslint-plugin-scats

ESLint plugin with rules for safer and more idiomatic usage of `scats`.

## Installation

```bash
npm install --save-dev eslint eslint-plugin-scats
```

If you lint TypeScript, also install:

```bash
npm install --save-dev @typescript-eslint/parser
```

## Configs

### Legacy config

Recommended:

```js
module.exports = {
  plugins: ['scats'],
  extends: ['plugin:scats/recommended'],
};
```

Strict:

```js
module.exports = {
  plugins: ['scats'],
  extends: ['plugin:scats/strict'],
};
```

### Flat config

```js
const scats = require('eslint-plugin-scats');

module.exports = [
  {
    plugins: {
      scats,
    },
    rules: {
      ...scats.configs.recommended.rules,
    },
  },
];
```

For strict mode use `scats.configs.strict.rules`.

## Rules

### Recommended

- `scats/to-array-terminal`: requires `.toArray` to be terminal in scats call chains
- `scats/no-array-option-fallback`: disallows `Option#getOrElseValue([])`, `Option#getOrElseValue(Nil.toArray)`, and similar array fallbacks; prefer keeping values as scats collections and using `Nil` or an appropriate empty collection
- `scats/no-collection-emptiness-comparison`: prefers `.isEmpty` and `.nonEmpty` over comparing scats collection `.length` or `.size` to zero
- `scats/no-explicit-empty`: disallows creating obviously empty scats collections via constructors/factories when `Nil` or `*.empty` should be used
- `scats/no-option-nullish-fallback`: disallows `Option#getOrElse(() => null)`, `Option#getOrElseValue(null)`, and the corresponding `undefined` fallbacks when `.orNull` or `.orUndefined` can be used directly
- `scats/no-option-foreach-assignment`: disallows `let result = none` followed by mutation inside `option(...).foreach(...)`; prefer deriving the value with `map` or `flatMap`
- `scats/no-useless-to-array-iteration`: disallows `for...of (... of collection.toArray)` for confirmed scats collections and auto-fixes to iterate the scats collection directly

### Strict

- includes all `recommended` rules
- `scats/no-array-construction`: disallows storing JavaScript arrays in local variables or class fields; inline arrays and object property assignments for external APIs remain allowed
- `scats/no-array-mutation`: disallows mutating JavaScript arrays directly via mutating methods, index writes, or `length = ...`; this rule uses TypeScript type information to avoid false positives on non-array objects with methods like `push`
- `scats/no-array-typed-variable`: disallows local variables and class fields typed as `Array<T>`, `ReadonlyArray<T>`, or `T[]`; this catches cases where `.toArray` results are stored explicitly as JavaScript arrays. For DTOs or external contracts, annotate the class with `@scatsAllowArrayTypes`
- `scats/no-nullish-syntax`: disallows `?.` and `??`; prefer explicit `Option` flows such as `option(x).flatMap(...)` and `option(x).getOrElseValue(...)`

## Development

```bash
npm test
```
