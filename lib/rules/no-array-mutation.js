'use strict';

const ts = require('typescript');

const MESSAGE_ID = 'noArrayMutation';
const ARRAY_MUTATION_METHODS = new Set([
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
]);

function isArrayIndexProperty(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal') {
    return Number.isInteger(node.value) && node.value >= 0;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const raw = node.quasis[0].value.cooked;
    return /^\d+$/.test(raw);
  }

  return false;
}

function getParserServices(context) {
  return context.sourceCode.parserServices ?? context.parserServices;
}

function isArrayLikeType(type, checker) {
  if (!type) {
    return false;
  }

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return false;
  }

  if (type.isUnion()) {
    return type.types.every(next => isArrayLikeType(next, checker));
  }

  if (type.isIntersection()) {
    return type.types.some(next => isArrayLikeType(next, checker));
  }

  const apparentType = checker.getApparentType(type);

  return checker.isArrayType(apparentType) || checker.isTupleType(apparentType);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow mutating JavaScript arrays in strict scats mode when type information confirms the value is an array',
    },
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Do not mutate JavaScript arrays directly; use mutable scats collections instead.',
    },
  },

  create(context) {
    const services = getParserServices(context);
    const checker = services?.program?.getTypeChecker();

    function isKnownArray(node) {
      if (!checker || !services?.getTypeAtLocation) {
        return false;
      }

      return isArrayLikeType(services.getTypeAtLocation(node), checker);
    }

    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (callee.property.type !== 'Identifier' || !ARRAY_MUTATION_METHODS.has(callee.property.name)) {
          return;
        }

        if (!isKnownArray(callee.object)) {
          return;
        }

        context.report({
          node: callee.property,
          messageId: MESSAGE_ID,
        });
      },

      AssignmentExpression(node) {
        const left = node.left;

        if (left.type !== 'MemberExpression') {
          return;
        }

        if (!isKnownArray(left.object)) {
          return;
        }

        if (!left.computed && left.property.type === 'Identifier' && left.property.name === 'length') {
          context.report({
            node: left.property,
            messageId: MESSAGE_ID,
          });
          return;
        }

        if (left.computed && isArrayIndexProperty(left.property)) {
          context.report({
            node: left.property,
            messageId: MESSAGE_ID,
          });
        }
      },

      UpdateExpression(node) {
        const argument = node.argument;

        if (argument.type !== 'MemberExpression' || !argument.computed) {
          return;
        }

        if (!isKnownArray(argument.object)) {
          return;
        }

        if (!isArrayIndexProperty(argument.property)) {
          return;
        }

        context.report({
          node: argument.property,
          messageId: MESSAGE_ID,
        });
      },
    };
  },
};
