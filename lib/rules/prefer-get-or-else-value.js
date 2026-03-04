'use strict';

const MESSAGE_ID = 'preferGetOrElseValue';

function getMemberPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') {
    return null;
  }

  if (node.computed) {
    return node.property.type === 'Literal' ? node.property.value : null;
  }

  return node.property.type === 'Identifier' ? node.property.name : null;
}

function getReturnedExpression(node) {
  if (!node || (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression')) {
    return null;
  }

  if (node.params.length > 0) {
    return null;
  }

  if (node.body.type !== 'BlockStatement') {
    return node.body;
  }

  if (node.body.body.length !== 1) {
    return null;
  }

  const [statement] = node.body.body;

  if (statement.type !== 'ReturnStatement' || !statement.argument) {
    return null;
  }

  return statement.argument;
}

function isStaticLiteral(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal') {
    return node.value !== null;
  }

  return node.type === 'TemplateLiteral' && node.expressions.length === 0;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer `Option#getOrElseValue(...)` over `Option#getOrElse(() => literal)` for explicit constant fallbacks',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `getOrElseValue(...)` instead of `getOrElse(() => ...)` when returning an explicit constant fallback.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        const methodName = getMemberPropertyName(node.callee);

        if (methodName !== 'getOrElse' || node.arguments.length !== 1 || node.callee.type !== 'MemberExpression') {
          return;
        }

        const returnedExpression = getReturnedExpression(node.arguments[0]);

        if (!isStaticLiteral(returnedExpression)) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
          fix(fixer) {
            return fixer.replaceText(
              node,
              `${sourceCode.getText(node.callee.object)}.getOrElseValue(${sourceCode.getText(returnedExpression)})`,
            );
          },
        });
      },
    };
  },
};
