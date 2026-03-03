'use strict';

const MESSAGE_ID = 'noArrayMutation';
const ARRAY_MUTATION_METHODS = new Set([
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
]);

function isArrayIndexProperty(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal') {
    return Number.isInteger(node.value) && node.value >= 0;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const raw = node.quasis[0].value.cooked;
    return /^\d+$/.test(raw);
  }

  return false;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow mutating JavaScript arrays in strict scats mode',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not mutate JavaScript arrays directly; use mutable scats collections instead.',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (callee.property.type !== 'Identifier' || !ARRAY_MUTATION_METHODS.has(callee.property.name)) {
          return;
        }

        context.report({
          node: callee.property,
          messageId: MESSAGE_ID,
        });
      },

      AssignmentExpression(node) {
        const left = node.left;

        if (left.type !== 'MemberExpression') {
          return;
        }

        if (!left.computed && left.property.type === 'Identifier' && left.property.name === 'length') {
          context.report({
            node: left.property,
            messageId: MESSAGE_ID,
          });
          return;
        }

        if (left.computed && isArrayIndexProperty(left.property)) {
          context.report({
            node: left.property,
            messageId: MESSAGE_ID,
          });
        }
      },

      UpdateExpression(node) {
        const argument = node.argument;

        if (argument.type !== 'MemberExpression' || !argument.computed) {
          return;
        }

        if (!isArrayIndexProperty(argument.property)) {
          return;
        }

        context.report({
          node: argument.property,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
