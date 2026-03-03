'use strict';

const MESSAGE_ID = 'noArrayTypedVariable';

function isArrayType(typeNode) {
  if (!typeNode) {
    return false;
  }

  if (typeNode.type === 'TSArrayType') {
    return true;
  }

  if (typeNode.type !== 'TSTypeReference') {
    return false;
  }

  const typeName = typeNode.typeName;

  return typeName.type === 'Identifier'
    && (typeName.name === 'Array' || typeName.name === 'ReadonlyArray');
}

function hasArrayTypeAnnotation(node) {
  return node.typeAnnotation
    && node.typeAnnotation.type === 'TSTypeAnnotation'
    && isArrayType(node.typeAnnotation.typeAnnotation);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow local variables and class fields typed as JavaScript arrays in strict scats mode',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not type local variables or class fields as JavaScript arrays; use scats collections instead.',
    },
  },

  create(context) {
    function report(node) {
      context.report({
        node,
        messageId: MESSAGE_ID,
      });
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !hasArrayTypeAnnotation(node.id)) {
          return;
        }

        report(node.id.typeAnnotation);
      },

      PropertyDefinition(node) {
        if (node.key.type !== 'Identifier' || !hasArrayTypeAnnotation(node)) {
          return;
        }

        report(node.typeAnnotation);
      },
    };
  },
};
