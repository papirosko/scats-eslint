'use strict';

const OPTIONAL_CHAINING_MESSAGE_ID = 'noOptionalChaining';
const NULLISH_COALESCING_MESSAGE_ID = 'noNullishCoalescing';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow optional chaining and nullish coalescing in strict scats mode',
    },
    schema: [],
    messages: {
      [OPTIONAL_CHAINING_MESSAGE_ID]: 'Do not use optional chaining; use `option(...)`, `map`, and `flatMap` explicitly.',
      [NULLISH_COALESCING_MESSAGE_ID]: 'Do not use nullish coalescing; use `option(...).getOrElseValue(...)` or related `Option` APIs explicitly.',
    },
  },

  create(context) {
    return {
      ChainExpression(node) {
        context.report({
          node,
          messageId: OPTIONAL_CHAINING_MESSAGE_ID,
        });
      },

      LogicalExpression(node) {
        if (node.operator !== '??') {
          return;
        }

        context.report({
          node,
          messageId: NULLISH_COALESCING_MESSAGE_ID,
        });
      },
    };
  },
};
