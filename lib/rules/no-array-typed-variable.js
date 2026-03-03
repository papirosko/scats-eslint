'use strict';

const VARIABLE_MESSAGE_ID = 'noArrayTypedVariable';
const CLASS_FIELD_MESSAGE_ID = 'noArrayTypedClassField';
const ALLOW_ARRAY_TYPES_TAG = '@scatsAllowArrayTypes';

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
      [VARIABLE_MESSAGE_ID]: 'Do not type local variables as JavaScript arrays; use scats collections instead.',
      [CLASS_FIELD_MESSAGE_ID]: 'Do not type class fields as JavaScript arrays; use scats collections instead. If this class is an external DTO or contract, annotate the class with `@scatsAllowArrayTypes`.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    function report(node, messageId) {
      context.report({
        node,
        messageId,
      });
    }

    function classAllowsArrayTypes(classNode) {
      const comments = sourceCode.getCommentsBefore(classNode);

      return comments.some((comment) => comment.value.includes(ALLOW_ARRAY_TYPES_TAG));
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !hasArrayTypeAnnotation(node.id)) {
          return;
        }

        report(node.id.typeAnnotation, VARIABLE_MESSAGE_ID);
      },

      PropertyDefinition(node) {
        if (node.key.type !== 'Identifier' || !hasArrayTypeAnnotation(node)) {
          return;
        }

        if (node.parent && (node.parent.type === 'ClassBody') && node.parent.parent && classAllowsArrayTypes(node.parent.parent)) {
          return;
        }

        report(node.typeAnnotation, CLASS_FIELD_MESSAGE_ID);
      },
    };
  },
};
