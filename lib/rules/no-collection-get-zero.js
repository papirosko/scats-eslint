'use strict';

const ts = require('typescript');

const MESSAGE_ID = 'noCollectionGetZero';

function getParserServices(context) {
  return context.sourceCode.parserServices ?? context.parserServices;
}

function isCollectionType(type, checker) {
  if (!type) {
    return false;
  }

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return false;
  }

  if (type.isUnion()) {
    return type.types.every(next => isCollectionType(next, checker));
  }

  if (type.isIntersection()) {
    return type.types.some(next => isCollectionType(next, checker));
  }

  const symbol = type.aliasSymbol ?? type.getSymbol();

  if (symbol?.getName() === 'Collection') {
    return true;
  }

  const apparentType = checker.getApparentType(type);
  const apparentSymbol = apparentType.aliasSymbol ?? apparentType.getSymbol();

  return apparentSymbol?.getName() === 'Collection';
}

function isZeroLiteral(node) {
  if (!node) {
    return false;
  }

  return node.type === 'Literal' && node.value === 0;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow `Collection#get(0)` when `head` or `headOption` expresses the intent more clearly',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `head` or `headOption` instead of `Collection#get(0)`.',
    },
  },

  create(context) {
    const services = getParserServices(context);
    const checker = services?.program?.getTypeChecker();

    function isKnownCollection(node) {
      if (!checker || !services?.getTypeAtLocation) {
        return false;
      }

      return isCollectionType(services.getTypeAtLocation(node), checker);
    }

    return {
      CallExpression(node) {
        if (node.arguments.length !== 1 || !isZeroLiteral(node.arguments[0])) {
          return;
        }

        const callee = node.callee;

        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (callee.property.type !== 'Identifier' || callee.property.name !== 'get') {
          return;
        }

        if (!isKnownCollection(callee.object)) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
