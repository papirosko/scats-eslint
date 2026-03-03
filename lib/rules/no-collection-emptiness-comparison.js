'use strict';

const ts = require('typescript');

const MESSAGE_ID = 'preferCollectionEmptinessProperty';
const SIZE_PROPERTIES = new Set(['length', 'size']);
const EMPTY_OPERATORS = new Set(['==', '===', '<=', '>=']);
const NON_EMPTY_OPERATORS = new Set(['!=', '!==', '>', '<']);

function getParserServices(context) {
  return context.sourceCode.parserServices ?? context.parserServices;
}

function isZero(node) {
  return node.type === 'Literal' && node.value === 0;
}

function isTrackedMember(node) {
  return node
    && node.type === 'MemberExpression'
    && !node.computed
    && node.property.type === 'Identifier'
    && SIZE_PROPERTIES.has(node.property.name);
}

function isScatsCollectionType(type, checker) {
  if (!type) {
    return false;
  }

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return false;
  }

  if (type.isUnion()) {
    return type.types.every(next => isScatsCollectionType(next, checker));
  }

  if (type.isIntersection()) {
    return type.types.some(next => isScatsCollectionType(next, checker));
  }

  const apparentType = checker.getApparentType(type);

  return checker.getPropertyOfType(apparentType, 'isEmpty') != null
    && checker.getPropertyOfType(apparentType, 'nonEmpty') != null;
}

function getTargetMember(node) {
  if (isTrackedMember(node.left) && isZero(node.right)) {
    return { member: node.left, zeroOnLeft: false };
  }

  if (isZero(node.left) && isTrackedMember(node.right)) {
    return { member: node.right, zeroOnLeft: true };
  }

  return null;
}

function getReplacementProperty(operator, zeroOnLeft) {
  if (!zeroOnLeft) {
    if (EMPTY_OPERATORS.has(operator)) {
      return 'isEmpty';
    }

    if (NON_EMPTY_OPERATORS.has(operator)) {
      return 'nonEmpty';
    }

    return null;
  }

  if (operator === '==' || operator === '===' || operator === '>=' || operator === '<=') {
    return 'isEmpty';
  }

  if (operator === '!=' || operator === '!==' || operator === '<' || operator === '>') {
    return 'nonEmpty';
  }

  return null;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer `.isEmpty` or `.nonEmpty` over comparing scats collection `length` or `size` to zero',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID]: 'Use `{{replacement}}` instead of comparing scats collection `{{property}}` to zero.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const services = getParserServices(context);
    const checker = services?.program?.getTypeChecker();

    return {
      BinaryExpression(node) {
        if (!checker || !services?.getTypeAtLocation) {
          return;
        }

        const target = getTargetMember(node);

        if (!target) {
          return;
        }

        const replacement = getReplacementProperty(node.operator, target.zeroOnLeft);

        if (!replacement) {
          return;
        }

        if (!isScatsCollectionType(services.getTypeAtLocation(target.member.object), checker)) {
          return;
        }

        context.report({
          node,
          messageId: MESSAGE_ID,
          data: {
            property: target.member.property.name,
            replacement,
          },
          fix(fixer) {
            return fixer.replaceText(node, `${sourceCode.getText(target.member.object)}.${replacement}`);
          },
        });
      },
    };
  },
};
