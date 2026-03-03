'use strict';

const MESSAGE_ID = 'noArrayOptionFallback';

function isArrayConstruction(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'ArrayExpression') {
    return true;
  }

  if (
    node.type === 'MemberExpression'
    && !node.computed
    && node.object.type === 'Identifier'
    && node.object.name === 'Nil'
    && node.property.type === 'Identifier'
    && node.property.name === 'toArray'
  ) {
    return true;
  }

  return (node.type === 'CallExpression' || node.type === 'NewExpression')
    && node.callee.type === 'Identifier'
    && node.callee.name === 'Array';
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow JavaScript array fallbacks in `Option#getOrElseValue`, including `Nil.toArray`',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not use a JavaScript array as `Option#getOrElseValue` fallback; keep the value as a scats collection and use `Nil` or the appropriate empty collection.',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (callee.property.type !== 'Identifier' || callee.property.name !== 'getOrElseValue') {
          return;
        }

        if (node.arguments.length !== 1 || !isArrayConstruction(node.arguments[0])) {
          return;
        }

        context.report({
          node: node.arguments[0],
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
