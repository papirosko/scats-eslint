'use strict';

const MESSAGE_ID = 'noOptionNullishFallback';

function getMemberPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') {
    return null;
  }

  if (node.computed) {
    return node.property.type === 'Literal' ? node.property.value : null;
  }

  return node.property.type === 'Identifier' ? node.property.name : null;
}

function getNullishKind(node) {
  if (!node) {
    return null;
  }

  if (node.type === 'Literal' && node.value === null) {
    return 'null';
  }

  if (node.type === 'Identifier' && node.name === 'undefined') {
    return 'undefined';
  }

  if (node.type === 'UnaryExpression' && node.operator === 'void') {
    return 'undefined';
  }

  return null;
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

function getShortcutPropertyName(node, methodName) {
  if (methodName === 'getOrElseValue') {
    const kind = getNullishKind(node);
    return kind === 'null' ? 'orNull' : kind === 'undefined' ? 'orUndefined' : null;
  }

  if (methodName === 'getOrElse') {
    const returnedExpression = getReturnedExpression(node);
    const kind = getNullishKind(returnedExpression);
    return kind === 'null' ? 'orNull' : kind === 'undefined' ? 'orUndefined' : null;
  }

  return null;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow `Option#getOrElse(() => nullish)` and `Option#getOrElseValue(nullish)` when `orNull` or `orUndefined` can be used',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `{{ replacement }}` instead of `{{ methodName }}` with a {{ kind }} fallback.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        const methodName = getMemberPropertyName(node.callee);

        if ((methodName !== 'getOrElse' && methodName !== 'getOrElseValue') || node.arguments.length !== 1) {
          return;
        }

        const replacement = getShortcutPropertyName(node.arguments[0], methodName);

        if (!replacement || node.callee.type !== 'MemberExpression') {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
          data: {
            kind: replacement === 'orNull' ? 'null' : 'undefined',
            methodName,
            replacement,
          },
          fix(fixer) {
            return fixer.replaceText(node, `${sourceCode.getText(node.callee.object)}.${replacement}`);
          },
        });
      },
    };
  },
};
