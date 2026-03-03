'use strict';

const ts = require('typescript');

const MESSAGE_ID = 'noUselessToArrayIteration';
const SCATS_ITERABLE_TYPE_NAMES = new Set([
  'ArrayBuffer',
  'Collection',
  'HashMap',
  'HashSet',
]);

function isToArrayMemberExpression(node) {
  if (!node || node.type !== 'MemberExpression') {
    return false;
  }

  if (node.computed) {
    return node.property.type === 'Literal' && node.property.value === 'toArray';
  }

  return node.property.type === 'Identifier' && node.property.name === 'toArray';
}

function getParserServices(context) {
  return context.sourceCode.parserServices ?? context.parserServices;
}

function getTypeSymbolName(type, checker) {
  const apparentType = checker.getApparentType(type);
  const symbol = apparentType.aliasSymbol ?? apparentType.getSymbol();

  if (!symbol) {
    return null;
  }

  return symbol.getName();
}

function isScatsIterableType(type, checker) {
  if (!type) {
    return false;
  }

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return false;
  }

  if (type.isUnion()) {
    return type.types.every(next => isScatsIterableType(next, checker));
  }

  if (type.isIntersection()) {
    return type.types.some(next => isScatsIterableType(next, checker));
  }

  const symbolName = getTypeSymbolName(type, checker);

  if (!symbolName || !SCATS_ITERABLE_TYPE_NAMES.has(symbolName)) {
    return false;
  }

  const apparentType = checker.getApparentType(type);
  return checker.getPropertyOfType(apparentType, 'toArray') != null;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow useless `.toArray` in `for...of` over scats collections when type information confirms the value is a scats collection',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: '`.toArray` is unnecessary in `for...of`; iterate the scats collection directly.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const services = getParserServices(context);
    const checker = services?.program?.getTypeChecker();

    return {
      ForOfStatement(node) {
        if (!isToArrayMemberExpression(node.right)) {
          return;
        }

        if (!checker || !services?.getTypeAtLocation) {
          return;
        }

        if (!isScatsIterableType(services.getTypeAtLocation(node.right.object), checker)) {
          return;
        }

        context.report({
          node: node.right.property,
          messageId: MESSAGE_ID,
          fix(fixer) {
            return fixer.replaceText(node.right, sourceCode.getText(node.right.object));
          },
        });
      },
    };
  },
};
