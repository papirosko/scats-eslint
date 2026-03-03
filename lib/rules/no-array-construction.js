'use strict';

const MESSAGE_ID = 'noArrayConstruction';
function isArrayConstruction(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'ArrayExpression') {
    return true;
  }

  if ((node.type === 'CallExpression' || node.type === 'NewExpression')
    && node.callee.type === 'Identifier'
    && node.callee.name === 'Array') {
    return true;
  }

  return false;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow storing JavaScript arrays in variables or fields in strict scats mode',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not store JavaScript arrays in variables or fields; use scats collections instead.',
    },
  },

  create(context) {
    function reportIfArrayConstruction(node) {
      if (!isArrayConstruction(node)) {
        return;
      }

      context.report({
        node,
        messageId: MESSAGE_ID,
      });
    }

    return {
      VariableDeclarator(node) {
        reportIfArrayConstruction(node.init);
      },

      AssignmentExpression(node) {
        reportIfArrayConstruction(node.right);
      },

      PropertyDefinition(node) {
        reportIfArrayConstruction(node.value);
      },
    };
  },
};
