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

### Strict

- includes all `recommended` rules
- `scats/no-array-construction`: disallows direct JavaScript array construction, while allowing tuple-oriented scats APIs such as `HashMap.of([k, v])`, `toMap(x => [k, v])`, and `yield(...) => [a, b]`

## Development

```bash
npm test
```
