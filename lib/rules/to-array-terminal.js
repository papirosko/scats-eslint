'use strict';

const MESSAGE_ID = 'nonTerminalToArray';

function isToArrayMemberExpression(node) {
  if (!node || node.type !== 'MemberExpression') {
    return false;
  }

  if (node.computed) {
    return node.property.type === 'Literal' && node.property.value === 'toArray';
  }

  return node.property.type === 'Identifier' && node.property.name === 'toArray';
}

function isNonTerminalUsage(node) {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (parent.type === 'MemberExpression' && parent.object === node) {
    return true;
  }

  if (parent.type === 'CallExpression' && parent.callee === node) {
    return true;
  }

  if (parent.type === 'NewExpression' && parent.callee === node) {
    return true;
  }

  if (parent.type === 'TaggedTemplateExpression' && parent.tag === node) {
    return true;
  }

  return false;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'require `.toArray` on scats collections to be terminal in a chain',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: '`.toArray` must be terminal in a chain.',
    },
  },

  create(context) {
    return {
      MemberExpression(node) {
        if (!isToArrayMemberExpression(node)) {
          return;
        }

        if (!isNonTerminalUsage(node)) {
          return;
        }

        context.report({
          node: node.property,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
