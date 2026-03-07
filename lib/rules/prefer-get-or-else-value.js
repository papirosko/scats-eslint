'use strict';

const ts = require('typescript');

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

function unwrapReferenceExpression(node) {
  if (!node) {
    return null;
  }

  if (
    node.type === 'TSAsExpression'
    || node.type === 'TSTypeAssertion'
    || node.type === 'TSNonNullExpression'
    || node.type === 'ParenthesizedExpression'
  ) {
    return unwrapReferenceExpression(node.expression);
  }

  return node;
}

function isImmediateOptionReference(node) {
  const unwrapped = unwrapReferenceExpression(node);

  if (!unwrapped) {
    return false;
  }

  if (unwrapped.type === 'Identifier' || unwrapped.type === 'ThisExpression' || unwrapped.type === 'Super') {
    return true;
  }

  if (unwrapped.type !== 'MemberExpression') {
    return false;
  }

  if (unwrapped.computed) {
    return false;
  }

  return isImmediateOptionReference(unwrapped.object);
}

function getParserServices(context) {
  return context.sourceCode.parserServices ?? context.parserServices;
}

function isOptionType(type, checker) {
  if (!type) {
    return false;
  }

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return false;
  }

  if (type.isUnion()) {
    return type.types.every(next => isOptionType(next, checker));
  }

  if (type.isIntersection()) {
    return type.types.some(next => isOptionType(next, checker));
  }

  const symbol = type.aliasSymbol ?? type.getSymbol();

  if (symbol?.getName() === 'Option') {
    return true;
  }

  const apparentType = checker.getApparentType(type);
  const apparentSymbol = apparentType.aliasSymbol ?? apparentType.getSymbol();

  return apparentSymbol?.getName() === 'Option';
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer `Option#getOrElseValue(...)` and `Option#orElseValue(...)` over callback forms when the fallback is already explicit',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `{{ replacement }}(...)` instead of `{{ methodName }}(() => ...)` when the fallback is already explicit.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const services = getParserServices(context);
    const checker = services?.program?.getTypeChecker();

    function isKnownOption(node) {
      if (!checker || !services?.getTypeAtLocation) {
        return false;
      }

      return isOptionType(services.getTypeAtLocation(node), checker);
    }

    return {
      CallExpression(node) {
        const methodName = getMemberPropertyName(node.callee);

        if ((methodName !== 'getOrElse' && methodName !== 'orElse') || node.arguments.length !== 1 || node.callee.type !== 'MemberExpression') {
          return;
        }

        const returnedExpression = getReturnedExpression(node.arguments[0]);

        let replacement = null;

        if (methodName === 'getOrElse' && isStaticLiteral(returnedExpression)) {
          replacement = 'getOrElseValue';
        }

        if (methodName === 'orElse' && returnedExpression && isImmediateOptionReference(returnedExpression) && isKnownOption(returnedExpression)) {
          replacement = 'orElseValue';
        }

        if (!replacement) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
          data: {
            methodName,
            replacement,
          },
          fix(fixer) {
            return [
              fixer.replaceText(node.callee.property, replacement),
              fixer.replaceText(node.arguments[0], sourceCode.getText(returnedExpression)),
            ];
          },
        });
      },
    };
  },
};
