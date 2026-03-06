'use strict';

const MESSAGE_ID = 'noArrayOptionFallback';

function getMemberPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') {
    return null;
  }

  if (node.computed) {
    return node.property.type === 'Literal' ? node.property.value : null;
  }

  return node.property.type === 'Identifier' ? node.property.name : null;
}

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

function getReturnedExpression(node) {
  if (!node || (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression')) {
    return null;
  }

  if (node.body.type !== 'BlockStatement') {
    return node.body;
  }

  if (node.body.body.length !== 1) {
    return null;
  }

  const [statement] = node.body.body;

  if (statement.type !== 'ReturnStatement') {
    return null;
  }

  return statement.argument ?? null;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow JavaScript array fallbacks in `Option#getOrElseValue` and `Option#getOrElse`, including `Nil.toArray`',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not use a JavaScript array as an `Option` fallback; keep the value as a scats collection and use `Nil` or the appropriate empty collection.',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const methodName = getMemberPropertyName(node.callee);
        let fallbackNode = null;

        if ((methodName !== 'getOrElseValue' && methodName !== 'getOrElse') || node.arguments.length !== 1) {
          return;
        }

        if (methodName === 'getOrElseValue') {
          fallbackNode = node.arguments[0];
        } else {
          fallbackNode = getReturnedExpression(node.arguments[0]);
        }

        if (!isArrayConstruction(fallbackNode)) {
          return;
        }

        context.report({
          node: fallbackNode,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
