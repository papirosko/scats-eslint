'use strict';

const ts = require('typescript');

const MESSAGE_ID = 'noOptionNullishFallback';
const REWRAP_MESSAGE_ID = 'noOptionNullishRewrap';
const OR_ELSE_VALUE_MESSAGE_ID = 'preferOptionOrElseValue';

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

function getOptionUnwrap(node) {
  if (!node || node.type !== 'CallExpression' || node.arguments.length !== 1) {
    return null;
  }

  if (node.callee.type !== 'Identifier' || node.callee.name !== 'option') {
    return null;
  }

  const [argument] = node.arguments;

  if (argument.type !== 'MemberExpression') {
    return null;
  }

  const shortcutName = getMemberPropertyName(argument);

  if (shortcutName !== 'orNull' && shortcutName !== 'orUndefined') {
    return null;
  }

  return {
    shortcutName,
    optionNode: node,
    optionExpression: argument.object,
  };
}

function getReturnedCall(node) {
  const returnedExpression = getReturnedExpression(node);
  return returnedExpression?.type === 'CallExpression' ? returnedExpression : null;
}

function getOrElseValueReplacement(node) {
  if (!node || node.type !== 'CallExpression' || node.arguments.length !== 1) {
    return null;
  }

  const methodName = getMemberPropertyName(node.callee);

  if (methodName !== 'orElse' || node.callee.type !== 'MemberExpression') {
    return null;
  }

  const left = getOptionUnwrap(node.callee.object);
  const right = getOptionUnwrap(getReturnedCall(node.arguments[0]));

  if (!left || !right) {
    return null;
  }

  return {
    left,
    right,
  };
}

function isWithinOptionOrElseRewrap(node) {
  const parent = node.parent;

  if (!parent || parent.type !== 'ArrowFunctionExpression' && parent.type !== 'FunctionExpression') {
    return false;
  }

  const callExpression = parent.parent;

  return Boolean(getOrElseValueReplacement(callExpression));
}

function isReceiverOfOptionOrElseRewrap(node) {
  const parent = node.parent;

  if (!parent || parent.type !== 'MemberExpression' || parent.object !== node) {
    return false;
  }

  return Boolean(getOrElseValueReplacement(parent.parent));
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow nullish fallbacks and redundant `option(...)` re-wrapping around existing `Option` values',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `{{ replacement }}` instead of `{{ methodName }}` with a {{ kind }} fallback.',
      [REWRAP_MESSAGE_ID]: 'Do not wrap `{{ shortcutName }}` in `option(...)`; `{{ expressionText }}` is already an `Option`.',
      [OR_ELSE_VALUE_MESSAGE_ID]: 'Use `orElseValue(...)` instead of wrapping `Option#{{ shortcutName }}` in `option(...)` before `orElse(...)`.',
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
        const orElseValueReplacement = getOrElseValueReplacement(node);

        if (orElseValueReplacement) {
          const { left, right } = orElseValueReplacement;

          if (!isKnownOption(left.optionExpression) || !isKnownOption(right.optionExpression)) {
            return;
          }

          context.report({
            node,
            messageId: OR_ELSE_VALUE_MESSAGE_ID,
            data: {
              shortcutName: left.shortcutName,
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${sourceCode.getText(left.optionExpression)}.orElseValue(${sourceCode.getText(right.optionExpression)})`,
              );
            },
          });
          return;
        }

        const optionUnwrap = getOptionUnwrap(node);

        if (optionUnwrap) {
          if (isWithinOptionOrElseRewrap(node) || isReceiverOfOptionOrElseRewrap(node)) {
            return;
          }

          if (!isKnownOption(optionUnwrap.optionExpression)) {
            return;
          }

          context.report({
            node,
            messageId: REWRAP_MESSAGE_ID,
            data: {
              shortcutName: optionUnwrap.shortcutName,
              expressionText: sourceCode.getText(optionUnwrap.optionExpression),
            },
            fix(fixer) {
              return fixer.replaceText(node, sourceCode.getText(optionUnwrap.optionExpression));
            },
          });
          return;
        }

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
