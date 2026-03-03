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
- `scats/no-explicit-empty`: disallows creating obviously empty scats collections via constructors/factories when `Nil` or `*.empty` should be used
- `scats/no-useless-to-array-iteration`: disallows `for...of (... of collection.toArray)` for confirmed scats collections and auto-fixes to iterate the scats collection directly

### Strict

- includes all `recommended` rules
- `scats/no-array-construction`: disallows storing JavaScript arrays in variables or fields; inline arrays for external APIs and tuple-oriented scats APIs remain allowed
- `scats/no-array-mutation`: disallows mutating JavaScript arrays directly via mutating methods, index writes, or `length = ...`; this rule uses TypeScript type information to avoid false positives on non-array objects with methods like `push`

## Development

```bash
npm test
```
